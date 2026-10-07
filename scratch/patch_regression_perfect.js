const fs = require('fs');
const file = 'x:/app/backend/tests/regression.js';
let content = fs.readFileSync(file, 'utf8');

const testCode = `
  // --- BF-SKU-DELETE ---
  console.log('\\n--- BF-SKU-DELETE ---');
  
  // Create a product to delete
  await setLogin(stockistToken);
  const p1Res = await post('http://localhost:3001/api/products', { name: 'DeleteMe Prod', category: 'electronics', price: 100, cost_price: 80, stock_quantity: 5, region_id: 'r-test1', barcode: '123123123' });
  const p1 = p1Res.data;
  
  // Another stockist deleting it -> 403
  await setLogin(stockist2Token);
  let del403 = await fetch('http://localhost:3001/api/products/' + p1.id, { method: 'DELETE', headers: { Authorization: \`Bearer \${stockist2Token}\` }});
  assert(del403.status === 403, 'Another shop\\'s shopkeeper gets 403 when deleting');
  pass('Another shop\\'s shopkeeper gets 403 when deleting');

  // Customer deleting it -> 403
  await setLogin(customerToken);
  let cDel403 = await fetch('http://localhost:3001/api/products/' + p1.id, { method: 'DELETE', headers: { Authorization: \`Bearer \${customerToken}\` }});
  assert(cDel403.status === 403, 'A customer gets 403 when deleting');
  pass('A customer gets 403 when deleting');
  
  // Owner deletes -> 200
  await setLogin(stockistToken);
  let del200 = await fetch('http://localhost:3001/api/products/' + p1.id, { method: 'DELETE', headers: { Authorization: \`Bearer \${stockistToken}\` }});
  assert(del200.status === 200, 'Owner deletes successfully (200)');
  pass('Owner deletes successfully (200)');
  
  const allProds = await dbModule.getTable('products');
  const pAfterDel = allProds.find(x => x.id === p1.id);
  assert(pAfterDel && pAfterDel.deleted_at && pAfterDel.is_sellable === false, 'Owner deletes: deleted_at set, row still exists, is_sellable is false');
  pass('Owner deletes: deleted_at set, row still exists, is_sellable is false');

  // Delete twice -> 200
  let delTwice = await fetch('http://localhost:3001/api/products/' + p1.id, { method: 'DELETE', headers: { Authorization: \`Bearer \${stockistToken}\` }});
  assert(delTwice.status === 200, 'Delete twice: 200 both times');
  pass('Delete twice: 200 both times');
  
  // Check audits
  const allAudits = await dbModule.getTable('admin_audit_log');
  const prodAudits = allAudits.filter(a => a.action === 'DELETE_PRODUCT' && a.details && a.details.product_id === p1.id);
  assert(prodAudits.length === 1, 'Delete twice: one audit entry');
  pass('Delete twice: one audit entry');

  // GET /api/products skips
  let stProds = await get(\`http://localhost:3001/api/products?regionId=r-test1&stockistId=\${s1.id}\`);
  assert(!stProds.data.some(x => x.id === p1.id), 'GET /api/products as shopkeeper no longer returns it');
  pass('GET /api/products as shopkeeper no longer returns it');

  let cusProds = await get(\`http://localhost:3001/api/products?regionId=r-test1&stockistId=\${s1.id}&customer=true\`);
  assert(!cusProds.data.some(x => x.id === p1.id), 'GET /api/products as customer no longer returns it');
  pass('GET /api/products as customer no longer returns it');
  
  // Create an order with deleted product -> 400
  await setLogin(customerToken);
  let badOrdRes = await post('http://localhost:3001/api/orders', {
    customerId: c1.id,
    fulfillmentType: 'PICKUP',
    paymentMethod: 'UPI',
    stores: [{ stockistId: s1.id, pickupSlot: '12:00-14:00', items: [{ productId: p1.id, quantity: 1, price: 100 }]}]
  });
  assert(badOrdRes.status === 400 && badOrdRes.data.error === 'product_unavailable', 'Create an order with a deleted product: 400 product_unavailable');
  pass('Create an order with a deleted product: 400 product_unavailable');

  // Admin deletes
  await setLogin(stockistToken);
  const p2Res = await post('http://localhost:3001/api/products', { name: 'AdminDeleteProd', category: 'electronics', price: 100, cost_price: 80, stock_quantity: 5, region_id: 'r-test1', barcode: '222' });
  const p2 = p2Res.data;

  // Create an order BEFORE admin deletes it, so we can test old orders load correctly
  await setLogin(customerToken);
  let oldOrd = await post('http://localhost:3001/api/orders', {
    customerId: c1.id,
    fulfillmentType: 'PICKUP',
    paymentMethod: 'UPI',
    stores: [{ stockistId: s1.id, pickupSlot: '12:00-14:00', items: [{ productId: p2.id, quantity: 1, price: 100 }]}]
  });
  
  await setLogin(adminToken);
  let admDel = await fetch('http://localhost:3001/api/products/' + p2.id, { method: 'DELETE', headers: { Authorization: \`Bearer \${adminToken}\` }});
  assert(admDel.status === 200, 'Admin can delete a product');
  pass('Admin can delete a product');

  // Verify old order still loads
  let oi = await dbModule.getTable('order_items');
  let ordItems = oi.filter(x => x.order_id === oldOrd.data[0].id);
  assert(ordItems.some(x => x.product_name === 'AdminDeleteProd'), 'An old order containing that product still loads with its name');
  pass('An old order containing that product still loads with its name');

  console.log(\`\\n=== REGRESSION SUITE COMPLETED: \${passedCount}/\${testCount} tests passed ===\`);
`;

const target = "console.log(`\\n=== REGRESSION SUITE COMPLETED: ${passedCount}/${testCount} tests passed ===`);";
content = content.replace(target, testCode);

fs.writeFileSync(file, content);
console.log('Appended tests perfectly.');
