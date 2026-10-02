const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const buggyTestTarget = /  \/\/ --- New tests for the status route \(BF-SEC-2c\) ---[\s\S]*?assert\(t2Audit !== undefined, 'audit row exists for ADMIN_MANUAL_DELIVERY_OVERRIDE'\);\n/g;

const replacement = `  // --- New tests for the status route (BF-SEC-2c) ---
  // Create a new pickup order for these tests
  loginAs('u-cust1', 'CUSTOMER');
  const bfsec2Order = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    fulfillmentType: 'PICKUP',
    paymentMethod: 'ONLINE',
    stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: 1 }], pickupSlot: '10:00 AM - 11:00 AM' }]
  });
  
  if (!bfsec2Order.body || !bfsec2Order.body.orderId) {
    console.error('Order creation failed:', bfsec2Order);
    process.exit(1);
  }
  
  const t2OrderId = bfsec2Order.body.orderId;

  // (a) owning stockist (u-stk1) PATCH own order READY_FOR_PICKUP -> 200
  loginAs('u-stk1', 'STOCKIST');
  const t2PatchOwn = await patch(\`http://localhost:3001/api/orders/\${t2OrderId}/status\`, { status: 'READY_FOR_PICKUP' });
  assert(t2PatchOwn.status === 200, 'owning stockist PATCH own order READY_FOR_PICKUP -> 200');

  // (b) another stockist (u-stk2) -> 403
  loginAs('u-stk2', 'STOCKIST');
  const t2PatchOther = await patch(\`http://localhost:3001/api/orders/\${t2OrderId}/status\`, { status: 'READY_FOR_PICKUP' });
  assert(t2PatchOther.status === 403, 'another stockist PATCH order -> 403');

  // (c) customer -> 403
  loginAs('u-cust1', 'CUSTOMER');
  const t2PatchCust = await patch(\`http://localhost:3001/api/orders/\${t2OrderId}/status\`, { status: 'READY_FOR_PICKUP' });
  assert(t2PatchCust.status === 403, 'customer PATCH order -> 403');

  // (d) anonymous -> 401
  clearLogin();
  const t2PatchAnon = await patch(\`http://localhost:3001/api/orders/\${t2OrderId}/status\`, { status: 'READY_FOR_PICKUP' });
  assert(t2PatchAnon.status === 401, 'anonymous PATCH order -> 401');

  // (e) owning stockist DELIVERED on a PICKUP order -> 400 PIN_REQUIRED
  loginAs('u-stk1', 'STOCKIST');
  const t2PatchDeliv = await patch(\`http://localhost:3001/api/orders/\${t2OrderId}/status\`, { status: 'DELIVERED' });
  assert(t2PatchDeliv.status === 400 && t2PatchDeliv.body.code === 'PIN_REQUIRED', 'owning stockist DELIVERED on a PICKUP order -> 400 PIN_REQUIRED');

  // (f) admin DELIVERED on a PICKUP order -> 200 and an audit row exists
  loginAs('u-admin', 'ADMIN');
  const t2PatchAdminDeliv = await patch(\`http://localhost:3001/api/orders/\${t2OrderId}/status\`, { status: 'DELIVERED' });
  assert(t2PatchAdminDeliv.status === 200, 'admin DELIVERED on a PICKUP order -> 200');

  const t2AuditTable = await dbModule.getTable('audit_logs');
  const t2Audit = t2AuditTable.find(a => a.action === 'ADMIN_MANUAL_DELIVERY_OVERRIDE' && a.entity_id === t2OrderId);
  assert(t2Audit !== undefined, 'audit row exists for ADMIN_MANUAL_DELIVERY_OVERRIDE');\n`;

if (buggyTestTarget.test(code)) {
  code = code.replace(buggyTestTarget, replacement);
  fs.writeFileSync('backend/tests/regression.js', code);
  console.log('Fixed buggy tests');
} else {
  console.log('Buggy test block not found');
}
