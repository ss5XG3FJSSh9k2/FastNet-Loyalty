const fs = require('fs');

const testCode = `
  // ==========================================
  // BF-SEC-4: Input validation tests
  // ==========================================

  // (a) Orders: quantity -5, 0, 1.5, 'abc', null, NaN-like, 100 (above cap)
  loginAs('u-cust1', 'CUSTOMER');
  const bfsec4OrdersBefore = await dbModule.getTable('orders');
  const bfsec4LedgerBefore = await dbModule.getTable('points_ledger');
  const invalidQuantities = [-5, 0, 1.5, 'abc', null, {}, 100];
  for (const qty of invalidQuantities) {
    const res = await post('http://localhost:3001/api/orders', {
      customerId: 'u-cust1',
      stores: [{ stockistId: 'u-stk1', items: [{ productId: 'test-p1', quantity: qty }], pickupSlot: 'Morning' }],
      fulfillmentType: 'PICKUP'
    });
    assert(res.status === 400 && res.body.error === 'validation_failed', \`Order with qty \${qty} -> 400 validation_failed\`);
  }
  const bfsec4OrdersAfter = await dbModule.getTable('orders');
  const bfsec4LedgerAfter = await dbModule.getTable('points_ledger');
  assert(bfsec4OrdersAfter.length === bfsec4OrdersBefore.length, 'No orders created from invalid requests');
  assert(bfsec4LedgerAfter.length === bfsec4LedgerBefore.length, 'No ledger rows created from invalid requests');

  // (b) Duplicate lines: sum exceeds stock
  // test-p1 has stock 50. Let's do 30 + 30.
  const resDup = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stores: [{ stockistId: 'u-stk1', items: [{ productId: 'test-p1', quantity: 30 }, { productId: 'test-p1', quantity: 30 }], pickupSlot: 'Morning' }],
    fulfillmentType: 'PICKUP'
  });
  assert(resDup.status === 400 && resDup.body.error.includes('Insufficient stock'), 'Duplicate lines exceeding stock -> 400 Insufficient stock');

  // (c) Valid order still works
  const resValid = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stores: [{ stockistId: 'u-stk1', items: [{ productId: 'test-p1', quantity: 1 }], pickupSlot: 'Morning' }],
    fulfillmentType: 'PICKUP'
  });
  assert(resValid.status === 200 && resValid.body.success === true, 'Valid order works');
  assert(resValid.body.orders[0].total_price === 10, 'Total price unchanged');

  // (d) Rewards validation
  loginAs('u-admin', 'ADMIN');
  const invalidPointCosts = [-50, 0, 2.5, 'abc', '5abc', 1e12];
  for (const pc of invalidPointCosts) {
    const res = await post('http://localhost:3001/api/admin/generic-rewards', { name: 'R', point_cost: pc, value_rupees: 10, cooldown_type: 'NONE' });
    assert(res.status === 400, \`Reward with point_cost \${pc} -> 400\`);
  }
  const invalidValues = [-1, 'zzz'];
  for (const val of invalidValues) {
    const res = await post('http://localhost:3001/api/admin/generic-rewards', { name: 'R', point_cost: 10, value_rupees: val, cooldown_type: 'NONE' });
    assert(res.status === 400, \`Reward with value \${val} -> 400\`);
  }
  const resEmptyName = await post('http://localhost:3001/api/admin/generic-rewards', { name: '', point_cost: 10, value_rupees: 10, cooldown_type: 'NONE' });
  assert(resEmptyName.status === 400, 'Reward with empty name -> 400');
  const resLongName = await post('http://localhost:3001/api/admin/generic-rewards', { name: 'A'.repeat(81), point_cost: 10, value_rupees: 10, cooldown_type: 'NONE' });
  assert(resLongName.status === 400, 'Reward with 81 char name -> 400');
  
  // Valid create
  const resValidReward = await post('http://localhost:3001/api/admin/generic-rewards', { name: 'Valid Reward', point_cost: 10, value_rupees: 10, cooldown_type: 'NONE' });
  assert(resValidReward.status === 200, 'Valid reward create works');
  const rId = resValidReward.body.id;

  // Invalid patch
  const resPatchActive = await patch(\`http://localhost:3001/api/admin/generic-rewards/\${rId}\`, { is_active: 'yes' });
  assert(resPatchActive.status === 400, 'Reward patch is_active string -> 400');
  const resPatchCost = await patch(\`http://localhost:3001/api/admin/generic-rewards/\${rId}\`, { point_cost: -5 });
  assert(resPatchCost.status === 400, 'Reward patch point_cost negative -> 400');
  
  // Valid patch
  const resValidPatch = await patch(\`http://localhost:3001/api/admin/generic-rewards/\${rId}\`, { point_cost: 20 });
  assert(resValidPatch.status === 200 && resValidPatch.body.point_cost === 20, 'Valid reward patch works');

  // (e) points-credit validation
  const invalidCreditAmounts = [0, -5, 'x', 1001];
  for (const amt of invalidCreditAmounts) {
    const res = await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: amt, reason: 'valid reason' });
    assert(res.status === 400, \`Points credit with amount \${amt} -> 400\`);
  }
  const resShortReason = await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: 10, reason: '1234' });
  assert(resShortReason.status === 400, 'Points credit with 4 char reason -> 400');

  const bfsec4CreditLedgerBefore = await dbModule.getTable('points_ledger');
  const resValidCredit = await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: 10, reason: 'Valid credit reason' });
  assert(resValidCredit.status === 200, 'Valid points credit works');
  const bfsec4CreditLedgerAfter = await dbModule.getTable('points_ledger');
  assert(bfsec4CreditLedgerAfter.length === bfsec4CreditLedgerBefore.length + 1, 'Valid credit writes one ledger row');

  // (f) Products validation
  loginAs('u-stk1', 'STOCKIST');
  const invalidPrices = [-1, 0, 'abc'];
  for (const p of invalidPrices) {
    const res = await post('http://localhost:3001/api/products', { name: 'N', price: p, initialStock: 10 });
    assert(res.status === 400, \`Product with price \${p} -> 400\`);
  }
  const resHighCost = await post('http://localhost:3001/api/products', { name: 'N', price: 10, costPrice: 20, initialStock: 10 });
  assert(resHighCost.status === 400, 'Product with cost > price -> 400');
  const resNegStock = await post('http://localhost:3001/api/products', { name: 'N', price: 10, initialStock: -1 });
  assert(resNegStock.status === 400, 'Product with negative stock -> 400');
  
  const resValidProduct = await post('http://localhost:3001/api/products', { name: 'Valid Prod', price: 100, initialStock: 10 });
  assert(resValidProduct.status === 200, 'Valid product create works');
  const pId = resValidProduct.body.product.id;

  const resZeroRestock = await post('http://localhost:3001/api/stockists/restock', { product_id: pId, stock_added: 0 });
  assert(resZeroRestock.status === 400, 'Restock with 0 -> 400');
  
  const resValidRestock = await post('http://localhost:3001/api/stockists/restock', { product_id: pId, stock_added: 5 });
  assert(resValidRestock.status === 200, 'Valid restock works');

  // (g) /orders/sync rejects batch containing one invalid line
  loginAs('u-cust1', 'CUSTOMER');
  const resSyncInvalid = await post('http://localhost:3001/api/orders/sync', {
    customerId: 'u-cust1',
    orders: [
      { stockistId: 'u-stk1', items: [{ productId: 'test-p1', quantity: 1 }] },
      { stockistId: 'u-stk1', items: [{ productId: 'test-p1', quantity: -5 }] }
    ]
  });
  assert(resSyncInvalid.status === 400, 'Sync with invalid line -> 400');
`;

let code = fs.readFileSync('backend/tests/regression.js', 'utf8');
code = code.replace(
  /console\.log\(\`\\n=== REGRESSION SUITE COMPLETED:/,
  testCode + '\n  console.log(`\\n=== REGRESSION SUITE COMPLETED:'
);

fs.writeFileSync('backend/tests/regression.js', code);
console.log('Tests patched successfully.');
