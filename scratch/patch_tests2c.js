const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

// Test #693: x-admin-id with a real admin id and NO token -> 401; WITH admin token -> 200
const test693_target = /  \/\/ Test #693: Endpoint: GET \/api\/admin\/analytics with real setup admin ID header returns 200[\s\S]*?assert\(realAdminAnalyticsRes\.status === 200 && realAdminAnalyticsRes\.body\.orders, 'GET \/api\/admin\/analytics with real setup admin ID header returns 200'\);/;
const test693_repl = `  // Test #693: Endpoint: GET /api/admin/analytics with real setup admin ID header
  const pre693Token = currentToken;
  clearLogin();
  const realAdminAnalyticsResNoToken = await get('http://localhost:3001/api/admin/analytics', {
    headers: { 'x-admin-id': realAdminUser.id }
  });
  assert(realAdminAnalyticsResNoToken.status === 401, 'GET /api/admin/analytics with real admin ID header but no token returns 401');
  
  loginAs('u-admin', 'ADMIN');
  const realAdminAnalyticsRes = await get('http://localhost:3001/api/admin/analytics', {
    headers: { 'x-admin-id': realAdminUser.id }
  });
  assert(realAdminAnalyticsRes.status === 200 && realAdminAnalyticsRes.body.orders, 'GET /api/admin/analytics with real setup admin ID header and token returns 200');
  currentToken = pre693Token;`;

if (test693_target.test(code)) {
  code = code.replace(test693_target, test693_repl);
  console.log('Test 693 replaced');
} else {
  console.log('Test 693 NOT FOUND');
}

// Restore regression.js:4550 to strict assertions (actually around line 4563)
const test4550_target = /  \/\/ Issue BF18-6b: GET \/api\/admin\/kyc\/:userId\/document with non-admin token\/header returns 403\s*clearLogin\(\);\s*const nonAdminDocRes = await get\('http:\/\/localhost:3001\/api\/admin\/kyc\/u-stk3\/document'\);\s*assert\(nonAdminDocRes\.status === 401 \|\| nonAdminDocRes\.status === 403, 'GET \/api\/admin\/kyc\/:userId\/document without admin headers returns 401\/403'\);\s*loginAs\('u-admin', 'ADMIN'\);/;
const test4550_repl = `  // Issue BF18-6b: GET /api/admin/kyc/:userId/document with non-admin token/header returns 403
  clearLogin();
  const nonAdminDocRes = await get('http://localhost:3001/api/admin/kyc/u-stk3/document');
  assert(nonAdminDocRes.status === 401, 'GET /api/admin/kyc/:userId/document anonymous returns 401');

  loginAs('u-cust1', 'CUSTOMER');
  const custDocRes = await get('http://localhost:3001/api/admin/kyc/u-stk3/document');
  assert(custDocRes.status === 403, 'GET /api/admin/kyc/:userId/document customer returns 403');

  loginAs('u-partner-admin', 'PARTNER_ADMIN');
  const partnerDocRes = await get('http://localhost:3001/api/admin/kyc/u-stk3/document');
  assert(partnerDocRes.status === 200, 'GET /api/admin/kyc/:userId/document partner-admin returns 200');

  loginAs('u-admin', 'ADMIN');`;

if (test4550_target.test(code)) {
  code = code.replace(test4550_target, test4550_repl);
  console.log('Test 4550 replaced');
} else {
  console.log('Test 4550 NOT FOUND');
}

// 4. New tests for the status route
const statusTests = `
  // --- New tests for the status route (BF-SEC-2c) ---
  // Create a new pickup order for these tests
  loginAs('u-cust1', 'CUSTOMER');
  const bfsec2Order = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    fulfillmentType: 'PICKUP',
    paymentMethod: 'ONLINE',
    stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: 1 }] }]
  });
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
  assert(t2Audit !== undefined, 'audit row exists for ADMIN_MANUAL_DELIVERY_OVERRIDE');
`;

const completionTarget = /  console\.log\(`\\n=== REGRESSION SUITE COMPLETED: \$\{passedCount\}\/\$\{testCount\} tests passed ===`\);/;
if (completionTarget.test(code)) {
  code = code.replace(completionTarget, statusTests + "\n  console.log(`\\n=== REGRESSION SUITE COMPLETED: ${passedCount}/${testCount} tests passed ===`);");
  console.log('Status tests added');
} else {
  console.log('Completion log NOT FOUND');
}

fs.writeFileSync('backend/tests/regression.js', code);
