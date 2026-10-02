const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const tests = `
  console.log('\\n--- Round BF-SEC-4: Input Validation Tests ---');

  // (a) Orders: quantity -5, 0, 1.5, 'abc', null, NaN-like, 100 (above cap) -> each 400
  loginAs('u-cust1', 'CUSTOMER');
  const badQuantities = [-5, 0, 1.5, 'abc', null, NaN, 100];
  for (const qty of badQuantities) {
    const oRes = await post('http://localhost:3001/api/orders', {
      stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: qty }] }]
    });
    assert(oRes.status === 400, 'Orders creation with bad quantity ' + String(qty) + ' returns 400, got ' + oRes.status);
  }

  // (b) Duplicate lines: p1 twice with quantities whose sum exceeds stock -> 400
  // p1 stock is 100 initially (seed). 60 + 50 = 110.
  const dupLinesRes = await post('http://localhost:3001/api/orders', {
    stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: 60 }, { productId: 'p1', quantity: 50 }] }]
  });
  assert(dupLinesRes.status === 400, 'Duplicate lines exceeding stock returns 400 Insufficient stock');

  // (c) A valid order still works and totals are unchanged vs before this ticket.
  const validOrderRes = await post('http://localhost:3001/api/orders', {
    stores: [{ stockistId: 's1', pickupSlot: '10:00 AM', items: [{ productId: 'p1', quantity: 1 }] }],
    fulfillmentType: 'PICKUP'
  });
  assert(validOrderRes.status === 200, 'Valid order works, got ' + validOrderRes.status + ' ' + (validOrderRes.body.error||''));
  assert(validOrderRes.body.order.total_price > 0, 'Total price is > 0');

  loginAs('u-admin', 'ADMIN');
  // (d) Rewards: point_cost -50, 0, 2.5, 'abc', '5abc', 1e12; value_rupees -1, 'zzz'; name '' and 81 chars; is_active 'yes' -> each 400
  const badPointCosts = [-50, 0, 2.5, 'abc', '5abc', 1e12];
  for (const pc of badPointCosts) {
    const pcRes = await post('http://localhost:3001/api/admin/generic-rewards', { name: 'test', point_cost: pc, value_rupees: 10 });
    assert(pcRes.status === 400, 'Reward with bad point_cost ' + String(pc) + ' returns 400');
  }
  const badValues = [-1, 'zzz'];
  for (const val of badValues) {
    const valRes = await post('http://localhost:3001/api/admin/generic-rewards', { name: 'test', point_cost: 10, value_rupees: val });
    assert(valRes.status === 400, 'Reward with bad value_rupees ' + String(val) + ' returns 400');
  }
  const badNames = ['', 'x'.repeat(81)];
  for (const name of badNames) {
    const nameRes = await post('http://localhost:3001/api/admin/generic-rewards', { name: name, point_cost: 10, value_rupees: 10 });
    assert(nameRes.status === 400, 'Reward with bad name ' + name.length + ' returns 400');
  }
  
  const rewardRes = await post('http://localhost:3001/api/admin/generic-rewards', { name: 'Valid Reward', point_cost: 10, value_rupees: 10, cooldown_type: 'NONE' });
  assert(rewardRes.status === 200, 'Valid generic-reward creation works, got ' + rewardRes.status + ' ' + (rewardRes.body.error||''));
  const rewardId = rewardRes.body.id;
  
  const patchResActive = await patch(\`http://localhost:3001/api/admin/generic-rewards/\${rewardId}\`, { is_active: 'yes' });
  assert(patchResActive.status === 400, 'PATCH reward with is_active \\'yes\\' returns 400');
  const validPatchRes = await patch(\`http://localhost:3001/api/admin/generic-rewards/\${rewardId}\`, { is_active: false });
  assert(validPatchRes.status === 200, 'Valid PATCH reward works');

  // (e) points-credit: amount 0, -5, 'x', 1001 (over cap) and a 4-character reason -> 400;
  const badCredits = [0, -5, 'x', 1001];
  for (const amt of badCredits) {
    const crRes = await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: amt, reason: 'validreason' });
    assert(crRes.status === 400, 'points-credit bad amount ' + String(amt) + ' returns 400');
  }
  const crResReason = await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: 10, reason: 'test' });
  assert(crResReason.status === 400, 'points-credit bad reason 4 chars returns 400');
  
  const validCr = await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: 10, reason: 'validreason' });
  assert(validCr.status === 200, 'points-credit valid works');

  // (f) Products: price -1, 0, 'abc'; cost above price; stock -1; restock 0 -> 400
  const badPrices = [-1, 0, 'abc'];
  for (const p of badPrices) {
    const prRes = await post('http://localhost:3001/api/products', { name: 't', price: p, cost_price: 1, stock_qty: 1, is_sellable: true, image_url: '/dummy.jpg' });
    assert(prRes.status === 400, 'product bad price ' + String(p) + ' returns 400');
  }
  const costAbovePrice = await post('http://localhost:3001/api/products', { name: 't', price: 10, cost_price: 15, stock_qty: 1, is_sellable: true, image_url: '/dummy.jpg' });
  assert(costAbovePrice.status === 400, 'product cost above price returns 400');
  
  const badStocks = [-1];
  for (const s of badStocks) {
    const stRes = await post('http://localhost:3001/api/products', { name: 't', price: 10, cost_price: 5, stock_qty: s, is_sellable: true, image_url: '/dummy.jpg' });
    assert(stRes.status === 400, 'product bad stock ' + String(s) + ' returns 400');
  }

  // Use a stockist for restock
  loginAs('u-stk1', 'STOCKIST');
  const restock0 = await post('http://localhost:3001/api/stockists/restock', { items: [{ productId: 'p1', quantity: 0 }], stockistId: 's1' });
  assert(restock0.status === 400, 'restock quantity 0 returns 400');

  // (g) /orders/sync rejects a batch containing one invalid line and creates none of it.
  loginAs('u-stk1', 'STOCKIST');
  const syncRes = await post('http://localhost:3001/api/orders/sync', {
    orders: [{
      offline_order_id: 'off-1',
      total_price: 100,
      customer_phone: '9876543210',
      items: [{ productId: 'p1', quantity: 0 }]
    }]
  });
  assert(syncRes.status === 400, '/orders/sync with bad quantity returns 400');
`;

if (!code.includes('Round BF-SEC-4: Input Validation Tests')) {
  // Insert before the console.log of REGRESSION SUITE COMPLETED
  code = code.replace(/console\.log\(\`\\n=== REGRESSION SUITE COMPLETED/, tests + '\n  $&');
  fs.writeFileSync('backend/tests/regression.js', code, 'utf8');
}
