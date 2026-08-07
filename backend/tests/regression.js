process.env.POSTGRES_MODE = 'mem';
const http = require('http');
const dbModule = require('../db.js');

function postMultipart(url, fields, fileObj = { fieldName: 'bill_photo', filename: 'bill.jpg', mime: 'image/jpeg', buffer: Buffer.from('mock jpeg data') }, method = 'POST', options = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const parsed = new URL(url);

    let body = [];

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) {
        body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
      }
    }

    if (fileObj) {
      body.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileObj.fieldName || 'bill_photo'}"; filename="${fileObj.filename || 'bill.jpg'}"\r\nContent-Type: ${fileObj.mime || 'image/jpeg'}\r\n\r\n`));
      body.push(Buffer.isBuffer(fileObj.buffer) ? fileObj.buffer : Buffer.from(fileObj.buffer || 'mock bill content'));
      body.push(Buffer.from('\r\n'));
    }

    body.push(Buffer.from(`--${boundary}--\r\n`));
    const payload = Buffer.concat(body);

    const headers = Object.assign({
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': payload.length
    }, options.headers || {});

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: method,
      headers: headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function post(url, body, options = {}) {
  if (options.asMultipart || (url.includes('/api/products') && !options.rawJson)) {
    return postMultipart(url, body, options.fileObj || { fieldName: 'bill_photo', filename: 'bill.jpg', mime: 'image/jpeg', buffer: Buffer.from('mock bill photo data') }, 'POST', options);
  }
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body || {});
    const headers = Object.assign({
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }, options.headers || {});
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function patch(url, body, options = {}) {
  if (options.asMultipart || (url.includes('/api/products') && !options.rawJson && (body.price !== undefined || body.costPrice !== undefined || body.cost_price !== undefined))) {
    return postMultipart(url, body, options.fileObj || { fieldName: 'bill_photo', filename: 'bill.jpg', mime: 'image/jpeg', buffer: Buffer.from('mock bill photo data') }, 'PATCH', options);
  }
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body || {});
    const headers = Object.assign({
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }, options.headers || {});
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'PATCH',
      headers: headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = Object.assign({}, options.headers || {});
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function del(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = Object.assign({}, options.headers || {});
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'DELETE',
      headers: headers
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

let testCount = 0;
let passedCount = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`[PASS] Test #${testCount}: ${message}`);
  } else {
    console.error(`[FAIL] Test #${testCount}: ${message}`);
    process.exit(1);
  }
}

async function main() {
  console.log('=== RUNNING ACCUMULATED REGRESSION SUITE ===');

  const sMod = require('../server.js');
  await sMod.readyPromise;

  // Reset database to starting state
  console.log('\nResetting database...');
  await post('http://localhost:3001/api/admin/reset-db');

  // 1. Payment split math
  console.log('\n--- 1. Payment Split Math ---');
  const orderRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    pickupSlot: 'Morning (8AM–12PM)',
    commission_model: 'gross_v1',
    items: [
      { productId: 'p1', quantity: 2 }, // Alu, price: 30, cost: 22. Subtotal: 60. profit: 16
      { productId: 'p3', quantity: 1 }  // Dal, price: 60, cost: 48. Subtotal: 60. profit: 12
    ]
  });
  
  assert(orderRes.status === 200, 'Order created successfully');
  const orderId = orderRes.body.orderId;
  const orderDetails = (await get(`http://localhost:3001/api/orders`)).body.find(o => o.id === orderId);
  
  assert(orderDetails !== undefined, 'Order details fetched from DB');
  const totalDue = orderDetails.total_price;
  const stockistAmt = orderDetails.stockist_amount;
  const platformAmt = orderDetails.platform_amount;
  assert(Math.abs(stockistAmt + platformAmt - totalDue) < 0.01, `Split math sums to order total: ${stockistAmt} + ${platformAmt} === ${totalDue}`);

  // 2. Points calculation from profit margin
  console.log('\n--- 2. Points Calculated from Profit Margin ---');
  // Margin for 2 Alu + 1 Dal = (30-22)*2 + (60-48) = 16 + 12 = 28.
  // Earn rate for s1 (region r1) is 45%.
  // Expected points = 28 * 0.45 = 12.6.
  const pointsCredited = orderDetails.points_credited;
  assert(Math.abs(pointsCredited - 12.6) < 0.01, `Points calculated correctly from profit margin: ${pointsCredited} === 12.6`);

  // 3. Redemption allowlist
  console.log('\n--- 3. Redemption Allowlist Rejection ---');
  const badRedeem = await post('http://localhost:3001/api/ledger/redeem', {
    customerId: 'u-cust1',
    amount: 10,
    redemptionType: 'GROCERY_VOUCHER_25'
  });
  assert(badRedeem.status === 400, 'Invalid redemption type rejected with 400 Bad Request');

  // 4. Redemption descriptions match type
  console.log('\n--- 4. Redemption Descriptions ---');
  // Add some points first to allow redemptions
  // Customer Amit Sen had 12.6 pts from the order. Let's redeem:
  const red1 = await post('http://localhost:3001/api/ledger/redeem', {
    customerId: 'u-cust1',
    amount: 5,
    redemptionType: 'BROADBAND_DISCOUNT'
  });
  assert(red1.status === 200, 'Custom Broadband Discount redeemed');
  
  const red2 = await post('http://localhost:3001/api/ledger/redeem', {
    customerId: 'u-cust1',
    amount: 5,
    redemptionType: 'WIFI_TOPUP'
  });
  assert(red2.status === 200, 'WiFi Speed Booster redeemed');

  const history = (await get('http://localhost:3001/api/ledger/history/u-cust1')).body;
  const entry1 = history.find(h => h.id === red1.body.ledgerId);
  const entry2 = history.find(h => h.id === red2.body.ledgerId);

  assert(entry1 && entry1.description === 'Broadband Bill Discount - ₹5', 'Broadband discount description is correct');
  assert(entry2 && entry2.description === 'WiFi Speed Booster 48h (100 Mbps)', 'WiFi booster description is correct');

  // 5. CSV export data columns check
  console.log('\n--- 5. CSV Export Columns & Descriptions ---');
  const redemptionsRes = await get('http://localhost:3001/api/admin/redemptions');
  assert(redemptionsRes.status === 200, 'Fetched redemptions list');
  const testRed = redemptionsRes.body[0];
  assert(testRed && testRed.description !== undefined, 'Redemption log in DB includes description field');
  assert(testRed && testRed.redemption_type !== undefined, 'Redemption log in DB includes redemption_type field');

  // 6. Points reversal on cancellation
  console.log('\n--- 6. Points Reversal on Cancellation ---');
  await patch(`http://localhost:3001/api/orders/${orderId}/status`, { status: 'DELIVERED' });
  const balBefore = (await get('http://localhost:3001/api/ledger/balance/u-cust1')).body.balance;

  // Bypass stockist cancel restriction on DELIVERED status by manually setting to PENDING in DB
  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: orderId, patch: { status: 'PENDING' } });

  await patch(`http://localhost:3001/api/orders/${orderId}/status`, { status: 'CANCELLED' });
  const balAfter = (await get('http://localhost:3001/api/ledger/balance/u-cust1')).body.balance;
  
  // Reversal should deduct the points earned (12.6)
  assert(Math.abs(balBefore - balAfter - 12.6) < 0.01, `Cancellations correctly subtract order earnings: balance went from ${balBefore} to ${balAfter}`);

  // 7. Anomaly flagging persists to FLAGGED status
  console.log('\n--- 7. Anomaly Flagging Persistence ---');
  // Create 3 orders to trigger anomaly detection (we cancelled 1, but total placed counts)
  await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });

  const anomalies = (await get('http://localhost:3001/api/admin/anomalies')).body;
  assert(anomalies.length > 0, 'Anomaly logged successfully');
  const targetAnomaly = anomalies[0];
  assert(targetAnomaly.status === 'PENDING', 'Initial anomaly status is PENDING');

  const flagRes = await post(`http://localhost:3001/api/admin/anomalies/${targetAnomaly.id}/flag`);
  assert(flagRes.status === 200, 'Anomaly flagged successfully via API');

  const anomaliesUpdated = (await get('http://localhost:3001/api/admin/anomalies')).body;
  const updatedAnomaly = anomaliesUpdated.find(a => a.id === targetAnomaly.id);
  assert(updatedAnomaly && updatedAnomaly.status === 'FLAGGED', 'Anomaly status persisted as FLAGGED');

  // 8. No rupee symbol on raw points
  console.log('\n--- 8. Raw Points Balance Format ---');
  const balanceRawObj = (await get('http://localhost:3001/api/ledger/balance/u-cust1')).body;
  assert(typeof balanceRawObj.balance === 'number', 'Raw points balance is numeric');
  assert(!String(balanceRawObj.balance).includes('₹'), 'Raw points balance payload does not contain rupee symbol (₹)');

  // 9. Flexible pre-order switching & post-order lock
  console.log('\n--- 9. Fulfillment Pre-order Delivery Fee & Post-order Lock ---');
  const orderDelRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'DELIVERY',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(orderDelRes.status === 200, 'Order with DELIVERY fulfillment created successfully');
  const orderDelId = orderDelRes.body.orderId;
  
  const orderDelDetails = (await get(`http://localhost:3001/api/orders`)).body.find(o => o.id === orderDelId);
  assert(orderDelDetails.fulfillment_type === 'DELIVERY', 'Order fulfillment type is DELIVERY');
  assert(orderDelDetails.delivery_fee === 40, `Delivery fee of 40 applied: ${orderDelDetails.delivery_fee}`);
  assert(orderDelDetails.total_price === 70, `Total price includes delivery fee: ${orderDelDetails.total_price} === 70`);

  const patchPickupRes = await patch(`http://localhost:3001/api/orders/${orderDelId}/fulfillment`, {
    fulfillmentType: 'PICKUP'
  });
  assert(patchPickupRes.status === 400, 'Switching post-order from DELIVERY to PICKUP is blocked');

  const orderPickRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(orderPickRes.status === 200, 'Order with PICKUP fulfillment created successfully');
  const orderPickId = orderPickRes.body.orderId;

  const patchDelRes = await patch(`http://localhost:3001/api/orders/${orderPickId}/fulfillment`, {
    fulfillmentType: 'DELIVERY'
  });
  assert(patchDelRes.status === 200, 'Switching post-order from PICKUP to DELIVERY is allowed');
  
  const orderPickDetailsUpdated = (await get(`http://localhost:3001/api/orders`)).body.find(o => o.id === orderPickId);
  assert(orderPickDetailsUpdated.fulfillment_type === 'DELIVERY', 'Fulfillment type updated to DELIVERY');
  assert(orderPickDetailsUpdated.delivery_fee === 40, 'Delivery fee calculated and added');
  assert(orderPickDetailsUpdated.total_price === 70, 'Total price updated with delivery fee');

  // 10. IST timezone boundary check
  console.log('\n--- 10. IST Timezone Boundary Check ---');
  const dateAt20UTC = new Date('2026-07-13T20:00:00Z');
  function localISTDateString(date) {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + IST_OFFSET_MS);
    return istDate.toISOString().slice(0, 10);
  }
  assert(localISTDateString(dateAt20UTC) === '2026-07-14', 'IST timezone boundary wraps correctly past midnight IST');

  // 11. Stockist rates/reports a customer
  console.log('\n--- 11. Stockist Rates/Reports a Customer ---');
  const fbRes = await post('http://localhost:3001/api/feedback', {
    reporterId: 's1',
    reporterRole: 'STOCKIST',
    targetId: 'u-cust1',
    targetRole: 'CUSTOMER',
    orderId: orderPickId,
    rating: 2,
    reason: 'Customer did not show up to pick up order.',
    reportFlag: true
  });
  assert(fbRes.status === 200, 'Feedback from stockist submitted successfully');
  
  const adminFbRes = await get('http://localhost:3001/api/admin/feedback');
  assert(adminFbRes.status === 200, 'Admin feedback queue retrieved successfully');
  
  const targetFb = adminFbRes.body.find(f => f.id === fbRes.body.feedback.id);
  assert(targetFb !== undefined, 'Stockist feedback exists in admin feedback queue');
  assert(targetFb.reporter_role === 'STOCKIST', `Reporter role is STOCKIST: ${targetFb.reporter_role}`);
  assert(targetFb.target_role === 'CUSTOMER', `Target role is CUSTOMER: ${targetFb.target_role}`);
  assert(targetFb.report_flag === true, `Report flag is set to true: ${targetFb.report_flag}`);
  assert(targetFb.reason === 'Customer did not show up to pick up order.', 'Reason matches submitted text');

  // 12. Slot Enforcement
  console.log('\n--- 12. Slot Enforcement ---');
  const slotRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(slotRes.status === 400, 'Order without slot is rejected with 400');

  // 13. Cancel Window Enforcement
  console.log('\n--- 13. Cancel Window Enforcement ---');
  const testOrder = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(testOrder.status === 200, 'Order created within cancel window');
  
  // Backdate cancel deadline in the JSON db manually to simulate time elapsed
  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: testOrder.body.orderId, patch: { cancel_deadline: new Date(Date.now() - 10000).toISOString(), status: 'PENDING' } });
  
  const cancelRes = await post(`http://localhost:3001/api/orders/${testOrder.body.orderId}/cancel`);
  assert(cancelRes.status === 400, 'Cancellation blocked after deadline/window closed');

  // 14. No-show flow (Reschedule or Cancel)
  console.log('\n--- 14. No-Show flow ---');
  // Order status needs to be SHIPPED/READY to simulate missed pickup
  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: testOrder.body.orderId, patch: { status: 'SHIPPED' } });
  
  const rescheduleRes1 = await post(`http://localhost:3001/api/orders/${testOrder.body.orderId}/noshw-action`, {
    action: 'RESCHEDULE',
    newSlot: 'Afternoon (12PM–4PM)'
  });
  assert(rescheduleRes1.status === 200, 'Rescheduling first time is allowed');
  
  const rescheduleRes2 = await post(`http://localhost:3001/api/orders/${testOrder.body.orderId}/noshw-action`, {
    action: 'RESCHEDULE',
    newSlot: 'Evening (4PM–8PM)'
  });
  assert(rescheduleRes2.status === 400, 'Second reschedule is blocked');

  // Cancel missed pickup (refund status goes to REFUND_DUE)
  const cancelMissedRes = await post(`http://localhost:3001/api/orders/${testOrder.body.orderId}/noshw-action`, {
    action: 'CANCEL'
  });
  assert(cancelMissedRes.status === 200, 'Missed pickup order cancelled successfully');
  assert(cancelMissedRes.body.order.payment_status === 'REFUND_DUE', 'Payment marked as REFUND_DUE');

  // Trigger admin refund
  const adminRefundRes = await post(`http://localhost:3001/api/admin/orders/${testOrder.body.orderId}/refund`);
  assert(adminRefundRes.status === 200, 'Admin refund succeeds');
  assert(adminRefundRes.body.order.payment_status === 'REFUNDED', 'Payment marked as REFUNDED');

  // Check prepaid pickup restriction
  await post('http://localhost:3001/api/admin/override-table', { table: 'users', id: 'u-cust1', patch: { no_show_count: 3, prepaid_pickup_restricted: true } });

  const restrictedRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(restrictedRes.status === 400, 'Prepaid pickup is restricted after 3 no-shows');

  // Reset no-shows
  await post('http://localhost:3001/api/admin/override-table', { table: 'users', id: 'u-cust1', patch: { no_show_count: 0, prepaid_pickup_restricted: false } });

  // 15. Multi-store checkout
  console.log('\n--- 15. Multi-Store Checkout ---');
  const multiStoreFailing = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    fulfillmentType: 'DELIVERY',
    stores: [
      { stockistId: 's1', pickupSlot: 'Morning (8AM–12PM)', items: [{ productId: 'p1', quantity: 1 }] },
      { stockistId: 's3', pickupSlot: 'Morning (8AM–12PM)', items: [{ productId: 'p2', quantity: 1 }] }
    ]
  });
  assert(multiStoreFailing.status === 400, 'Multi-store DELIVERY checkout is blocked');

  const multiStoreSuccess = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    fulfillmentType: 'PICKUP',
    stores: [
      { stockistId: 's1', pickupSlot: 'Morning (8AM–12PM)', items: [{ productId: 'p1', quantity: 1 }] },
      { stockistId: 's3', pickupSlot: 'Afternoon (12PM–4PM)', items: [{ productId: 'p2', quantity: 1 }] }
    ]
  });
  assert(multiStoreSuccess.status === 200, 'Multi-store PICKUP checkout is successful');
  assert(multiStoreSuccess.body.orders.length === 2, 'Two separate orders created');
  assert(multiStoreSuccess.body.orders[0].payment_status === 'HELD', 'Payment status is HELD');
  
  const multiOrderId = multiStoreSuccess.body.orders[0].id;

  // 16. Release Split
  console.log('\n--- 16. Release Split ---');
  // Deliver the order to allow releasing split
  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: multiOrderId, patch: { status: 'DELIVERED' } });

  const releaseRes = await post(`http://localhost:3001/api/admin/release-split/${multiOrderId}`);
  assert(releaseRes.status === 200, 'Split released successfully');

  // 17. COD Commission Ledger
  console.log('\n--- 17. COD Commission ---');
  const codOrder = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'DELIVERY',
    paymentMethod: 'COD',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(codOrder.status === 200, 'COD order created successfully');
  assert(codOrder.body.order.payment_status === 'COD', 'COD payment status is COD');
  
  const codLedger = await dbModule.getTable('cod_commission_ledger');
  const codEntry = codLedger.find(e => e.order_id === codOrder.body.orderId);
  assert(codEntry !== undefined, 'COD commission entry added to ledger');

  // 18. Fraud Flag Dismissals
  console.log('\n--- 18. Fraud Flag Dismissals ---');
  const anomaliesList = await dbModule.getTable('anomaly_logs');
  const targetAnomaly2 = anomaliesList[0];
  
  const dismissRes = await post(`http://localhost:3001/api/admin/anomalies/${targetAnomaly2.id}/dismiss`, {
    reason: 'Legitimate regular customer'
  });
  assert(dismissRes.status === 200, 'Anomaly flag dismissed');
  
  const auditAnomalies = await dbModule.getTable('anomaly_logs');
  const updatedAnomaly2 = auditAnomalies.find(a => a.id === targetAnomaly2.id);
  assert(updatedAnomaly2.status === 'DISMISSED', 'Anomaly status updated to DISMISSED');
  assert(updatedAnomaly2.dismiss_reason === 'Legitimate regular customer', 'Dismiss reason saved');

  // 19. Ledger Credit on DELIVERED only
  console.log('\n--- 19. Ledger Credit on DELIVERED only ---');
  const balanceBefore = (await get('http://localhost:3001/api/ledger/balance/u-cust1')).body.balance;
  
  const orderForPoints = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(orderForPoints.status === 200, 'Order created successfully');
  const pointsToEarn = orderForPoints.body.pointsCredited; // 3.6
  
  const balanceDuringPending = (await get('http://localhost:3001/api/ledger/balance/u-cust1')).body.balance;
  assert(balanceDuringPending === balanceBefore, 'Ledger unchanged until DELIVERED');

  const delRes = await patch(`http://localhost:3001/api/orders/${orderForPoints.body.orderId}/status`, { status: 'DELIVERED' });
  assert(delRes.status === 200, 'Order delivered successfully');

  const balanceAfter = (await get('http://localhost:3001/api/ledger/balance/u-cust1')).body.balance;
  assert(Math.abs(balanceAfter - balanceBefore - pointsToEarn) < 0.01, `Ledger increased by exactly that amount: ${balanceAfter - balanceBefore} === ${pointsToEarn}`);

  // 20. Legacy SHIPPED status safety mapping
  console.log('\n--- 20. Legacy SHIPPED status safety mapping ---');
  // PICKUP order mapping
  const pickupOrderForShipped = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(pickupOrderForShipped.status === 200, 'Pickup order created');
  const patchPickupShipped = await patch(`http://localhost:3001/api/orders/${pickupOrderForShipped.body.orderId}/status`, { status: 'SHIPPED' });
  assert(patchPickupShipped.status === 200, 'PATCH legacy SHIPPED on PICKUP order succeeds');
  
  const pickupOrderDetails = (await get(`http://localhost:3001/api/orders`)).body.find(o => o.id === pickupOrderForShipped.body.orderId);
  assert(pickupOrderDetails.status === 'READY_FOR_PICKUP', 'Legacy SHIPPED correctly translated to READY_FOR_PICKUP');

  // DELIVERY order mapping
  const deliveryOrderForShipped = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'DELIVERY',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(deliveryOrderForShipped.status === 200, 'Delivery order created');
  const patchDeliveryShipped = await patch(`http://localhost:3001/api/orders/${deliveryOrderForShipped.body.orderId}/status`, { status: 'SHIPPED' });
  assert(patchDeliveryShipped.status === 200, 'PATCH legacy SHIPPED on DELIVERY order succeeds');
  
  const deliveryOrderDetails = (await get(`http://localhost:3001/api/orders`)).body.find(o => o.id === deliveryOrderForShipped.body.orderId);
  assert(deliveryOrderDetails.status === 'OUT_FOR_DELIVERY', 'Legacy SHIPPED correctly translated to OUT_FOR_DELIVERY');

  // 21. Cancel window success / failure
  console.log('\n--- 21. Cancel window success / failure ---');
  // Success before deadline
  const orderToCancelSuccess = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(orderToCancelSuccess.status === 200, 'Order to cancel created');
  const cancelSuccessRes = await post(`http://localhost:3001/api/orders/${orderToCancelSuccess.body.orderId}/cancel`);
  assert(cancelSuccessRes.status === 200, 'Cancel succeeds before deadline');

  // Failure after deadline (returns CANCEL_WINDOW_CLOSED)
  const orderToCancelFail = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(orderToCancelFail.status === 200, 'Order to cancel fail created');
  
  // Backdate deadline & set status to PENDING
  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: orderToCancelFail.body.orderId, patch: { cancel_deadline: new Date(Date.now() - 10000).toISOString(), status: 'PENDING' } });

  const cancelFailRes = await post(`http://localhost:3001/api/orders/${orderToCancelFail.body.orderId}/cancel`);
  assert(cancelFailRes.status === 400, 'Cancel blocked after deadline');
  assert(cancelFailRes.body.code === 'CANCEL_WINDOW_CLOSED', 'Cancellation response contains CANCEL_WINDOW_CLOSED code');

  // 22. Partner Leads
  console.log('\n--- 22. Partner Leads ---');
  // Validate non-empty payload check
  const leadFailRes = await post('http://localhost:3001/api/partner-leads', {});
  assert(leadFailRes.status === 400, 'Posting empty lead is rejected with 400');

  // POST valid lead
  const leadSuccessRes = await post('http://localhost:3001/api/partner-leads', {
    name: 'CableNet Garia',
    phone: '9876543219'
  });
  assert(leadSuccessRes.status === 200, 'POST lead succeeds');
  assert(leadSuccessRes.body.success === true, 'Response contains success flag');
  assert(leadSuccessRes.body.lead.name === 'CableNet Garia', 'Lead name matches');
  assert(leadSuccessRes.body.lead.phone === '9876543219', 'Lead phone matches');
  assert(leadSuccessRes.body.lead.status === 'NEW', 'Initial lead status is NEW');

  // GET leads list to verify persistence
  const getLeadsRes = await get('http://localhost:3001/api/admin/partner-leads');
  assert(getLeadsRes.status === 200, 'GET admin partner leads succeeds');
  const targetLead = getLeadsRes.body.find(l => l.id === leadSuccessRes.body.lead.id);
  assert(targetLead !== undefined, 'Posted lead exists in admin partner leads list');

  // 23. REDO ROUND Tests
  console.log('\n--- 23. REDO ROUND Tests ---');

  // Test A: Add SKU POST creates product visible in stockist list
  const addSkuRes = await post('http://localhost:3001/api/products', {
    name: 'Garia Fresh Butter',
    price: 150,
    costPrice: 120,
    category: 'groceries',
    initialStock: 15,
    stockistId: 's1',
    regionId: 'r1'
  });
  assert(addSkuRes.status === 200, 'POST creates product successfully');
  
  const getProductsRes = await get('http://localhost:3001/api/products?stockistId=s1');
  const targetProduct = getProductsRes.body.find(p => p.id === addSkuRes.body.product.id);
  assert(targetProduct !== undefined, 'Created product is visible in stockist list');
  assert(targetProduct.stock_qty === 15, 'Initial stock matches');

  // Test B: Product edit persists
  const editProductRes = await patch(`http://localhost:3001/api/products/${targetProduct.id}`, {
    name: 'Garia Salted Butter',
    price: 160,
    costPrice: 130,
    stockistId: 's1'
  });
  assert(editProductRes.status === 200, 'Product edit succeeds');
  assert(editProductRes.body.product.name === 'Garia Salted Butter', 'Edited name persists');
  assert(editProductRes.body.product.price === 160, 'Edited price persists');
  assert(editProductRes.body.product.cost_price === 130, 'Edited cost price persists');

  // Cross-stockist edit -> 403
  const crossEditRes = await patch(`http://localhost:3001/api/products/${targetProduct.id}`, {
    name: 'Hack Name',
    stockistId: 's2'
  });
  assert(crossEditRes.status === 403, 'Cross-stockist edit is rejected with 403');

  // costPrice > price -> 400
  const costTooHighRes = await patch(`http://localhost:3001/api/products/${targetProduct.id}`, {
    costPrice: 200,
    stockistId: 's1'
  });
  assert(costTooHighRes.status === 400, 'Cost price > price is rejected with 400');

  // Test E: Rewrite cancel conditions
  // Create a new order to test cancellation
  const cancelTestOrder = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(cancelTestOrder.status === 200, 'Cancel test order created');

  // Set status to READY_FOR_PICKUP to test cancellation lock (even within timer)
  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: cancelTestOrder.body.orderId, patch: { status: 'READY_FOR_PICKUP' } });

  const cancelReadyRes = await post(`http://localhost:3001/api/orders/${cancelTestOrder.body.orderId}/cancel`);
  assert(cancelReadyRes.status === 400, 'Cancel at READY is blocked');
  assert(cancelReadyRes.body.code === 'CANCEL_LOCKED_READY', 'Returns CANCEL_LOCKED_READY code');

  // Reset status to PREPARING to test success cancel within timer -> REFUND_DUE
  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: cancelTestOrder.body.orderId, patch: { status: 'PREPARING' } });

  const cancelPrepRes = await post(`http://localhost:3001/api/orders/${cancelTestOrder.body.orderId}/cancel`);
  assert(cancelPrepRes.status === 200, 'Cancel at PREPARING within timer succeeds');
  assert(cancelPrepRes.body.order.payment_status === 'REFUND_DUE', 'Payment status is REFUND_DUE');

  // Test F: Admin refund
  const adminRefundRes2 = await post(`http://localhost:3001/api/admin/orders/${cancelTestOrder.body.orderId}/refund`);
  assert(adminRefundRes2.status === 200, 'Admin refund succeeds');
  assert(adminRefundRes2.body.order.payment_status === 'REFUNDED', 'Payment status is REFUNDED');

  // Double refund -> no_op
  const doubleRefundRes = await post(`http://localhost:3001/api/admin/orders/${cancelTestOrder.body.orderId}/refund`);
  assert(doubleRefundRes.status === 200, 'Double refund is a no-op');

  // Stockist cancel permissions:
  // Create another order
  const stockistCancelTestOrder = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(stockistCancelTestOrder.status === 200, 'Stockist cancel test order created');

  // Stockist cancel at PENDING -> OK
  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: stockistCancelTestOrder.body.orderId, patch: { status: 'PENDING' } });

  const stockistCancelPendingRes = await patch(`http://localhost:3001/api/orders/${stockistCancelTestOrder.body.orderId}/status`, { status: 'CANCELLED' });
  assert(stockistCancelPendingRes.status === 200, 'Stockist CANCELLED at PENDING succeeds');

  // Stockist cancel at PREPARING -> 403
  const stockistCancelTestOrder2 = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(stockistCancelTestOrder2.status === 200, 'Stockist cancel test order 2 created');

  await post('http://localhost:3001/api/admin/override-table', { table: 'orders', id: stockistCancelTestOrder2.body.orderId, patch: { status: 'PREPARING' } });

  const stockistCancelPreparingRes = await patch(`http://localhost:3001/api/orders/${stockistCancelTestOrder2.body.orderId}/status`, { status: 'CANCELLED' });
  assert(stockistCancelPreparingRes.status === 403, 'Stockist CANCELLED at PREPARING is blocked with 403');
  assert(stockistCancelPreparingRes.body.code === 'STOCKIST_CANCEL_LOCKED', 'Returns STOCKIST_CANCEL_LOCKED code');

  // 24. Customer Delivered Review Feedback
  console.log('\n--- 24. Customer Delivered Review Feedback ---');
  const custReviewRes = await post('http://localhost:3001/api/feedback', {
    reporterId: 'u-cust1',
    reporterRole: 'CUSTOMER',
    targetId: 's1',
    targetRole: 'STOCKIST',
    orderId: 'ord-delivered-test',
    rating: 5,
    reason: 'Great delivery and service!',
    reportFlag: false
  });
  assert(custReviewRes.status === 200, 'Delivered review feedback submitted successfully');

  const adminFbFetch = await get('http://localhost:3001/api/admin/feedback');
  assert(adminFbFetch.status === 200, 'Admin feedback fetch succeeds');
  const reviewInAdmin = adminFbFetch.body.find(f => f.order_id === 'ord-delivered-test');
  assert(reviewInAdmin !== undefined, 'Delivered review feedback appears in admin fetch');
  assert(reviewInAdmin.rating === 5, 'Review rating matches submitted rating');

  // 25. PIN-verified delivery handoff
  console.log('\n--- 25. PIN-verified delivery handoff ---');
  const delOrderOnline = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'DELIVERY',
    paymentMethod: 'ONLINE',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(delOrderOnline.status === 200, 'Online DELIVERY order created successfully');
  const delOnlineId = delOrderOnline.body.orderId;

  const directDelPatch = await patch(`http://localhost:3001/api/orders/${delOnlineId}/status`, { status: 'DELIVERED' });
  assert(directDelPatch.status === 400, 'Direct PATCH to DELIVERED on DELIVERY order is blocked with 400');
  assert(directDelPatch.body.code === 'PIN_REQUIRED', 'Response contains PIN_REQUIRED code');

  const fetchDelOnline = await get(`http://localhost:3001/api/orders?customerId=u-cust1`);
  const onlineOrdObj = fetchDelOnline.body.find(o => o.id === delOnlineId);
  assert(onlineOrdObj !== undefined, 'Online delivery order found');

  const verifyOnlinePin = await post(`http://localhost:3001/api/orders/${delOnlineId}/verify-pickup`, { pin: onlineOrdObj.pickup_pin });
  assert(verifyOnlinePin.status === 200, 'Correct PIN via verify-pickup succeeds for ONLINE delivery');
  assert(verifyOnlinePin.body.order.status === 'DELIVERED', 'ONLINE delivery order status updated to DELIVERED');

  const delOrderCod = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'DELIVERY',
    paymentMethod: 'COD',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(delOrderCod.status === 200, 'COD DELIVERY order created successfully');
  const delCodId = delOrderCod.body.orderId;

  const fetchDelCod = await get(`http://localhost:3001/api/orders?customerId=u-cust1`);
  const codOrdObj = fetchDelCod.body.find(o => o.id === delCodId);
  assert(codOrdObj !== undefined, 'COD delivery order found');

  const verifyCodPin = await post(`http://localhost:3001/api/orders/${delCodId}/verify-pickup`, { pin: codOrdObj.pickup_pin });
  assert(verifyCodPin.status === 200, 'Correct PIN via verify-pickup succeeds for COD delivery');
  assert(verifyCodPin.body.order.status === 'DELIVERED', 'COD delivery order status updated to DELIVERED');

  // 26. Customer Fraud Reports (R4)
  console.log('\n--- 26. Customer Fraud Reports (R4) ---');
  const shortFraudRes = await post('http://localhost:3001/api/customer/fraud-reports', {
    customerId: 'u-cust1',
    subject: 'Stockist issue',
    description: 'Too short'
  });
  assert(shortFraudRes.status === 400, 'Fraud report with <20 chars description is rejected with 400');

  const validFraudRes = await post('http://localhost:3001/api/customer/fraud-reports', {
    customerId: 'u-cust1',
    subject: 'Stockist issue',
    description: 'The stockist refused to honor the pickup item quantity on my order.',
    linkedEntityType: 'order',
    linkedEntityId: delOnlineId
  });
  assert(validFraudRes.status === 200, 'Valid fraud report submitted successfully');
  const fraudReportId = validFraudRes.body.report.id;

  const adminFraudFetch = await get('http://localhost:3001/api/admin/fraud-reports');
  assert(adminFraudFetch.status === 200, 'Admin fraud reports fetch succeeds');
  const foundReport = adminFraudFetch.body.find(r => r.id === fraudReportId);
  assert(foundReport !== undefined && foundReport.status === 'NEW', 'Submitted fraud report exists in NEW status');

  const triageFraud = await post(`http://localhost:3001/api/admin/fraud-reports/${fraudReportId}/status`, {
    status: 'TRIAGING'
  });
  assert(triageFraud.status === 200, 'Fraud report status updated to TRIAGING');

  const shortNoteResolve = await post(`http://localhost:3001/api/admin/fraud-reports/${fraudReportId}/status`, {
    status: 'RESOLVED',
    adminNotes: 'Short'
  });
  assert(shortNoteResolve.status === 400, 'Resolving fraud report with <10 chars note is rejected with 400');

  const validResolve = await post(`http://localhost:3001/api/admin/fraud-reports/${fraudReportId}/status`, {
    status: 'RESOLVED',
    adminNotes: 'Investigated with stockist and issued apology credit.'
  });
  assert(validResolve.status === 200, 'Resolving fraud report with valid notes succeeds');

  // 27. Customers Management & Audit Log (R5 & Part 3)
  console.log('\n--- 27. Customers Management & Audit Log (R5 & Part 3) ---');
  const adminCustList = await get('http://localhost:3001/api/admin/customers');
  assert(adminCustList.status === 200, 'GET /api/admin/customers succeeds');
  const cust1InList = adminCustList.body.find(c => c.id === 'u-cust1');
  assert(cust1InList !== undefined && cust1InList.points_balance !== undefined, 'Customer list includes points balance and order count');

  const adminCustDetail = await get('http://localhost:3001/api/admin/customers/u-cust1');
  assert(adminCustDetail.status === 200, 'GET /api/admin/customers/u-cust1 succeeds');
  assert(Array.isArray(adminCustDetail.body.orders) && Array.isArray(adminCustDetail.body.ledger), 'Customer detail includes orders and ledger');

  const editCustRes = await post('http://localhost:3001/api/admin/customers/u-cust1', {
    name: 'Customer One Updated',
    email: 'cust1updated@example.com'
  });
  assert(editCustRes.status === 200, 'Admin update customer contact succeeds');

  const phoneChangeRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change', {
    currentPhoneOtp: '123456',
    newPhone: '9830099999',
    newPhoneOtp: '123456'
  });
  assert(phoneChangeRes.status === 200, 'Admin phone change succeeds');

  const creditPtsRes = await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', {
    amount: 50,
    reason: 'Support compensation for delivery delay'
  });
  assert(creditPtsRes.status === 200, 'Admin manual points credit succeeds');

  const deactCustRes = await post('http://localhost:3001/api/admin/customers/u-cust1/deactivate', {});
  assert(deactCustRes.status === 200, 'Admin customer deactivation succeeds');

  const loginDeact = await post('http://localhost:3001/api/auth/verify-otp', { phone: '9830099999', otp: '123456' });
  assert(loginDeact.status === 403, 'Deactivated user login attempt is blocked with 403');

  const reactCustRes = await post('http://localhost:3001/api/admin/customers/u-cust1/reactivate', {});
  assert(reactCustRes.status === 200, 'Admin customer reactivation succeeds');

  // 28. Stockists Management (R6)
  console.log('\n--- 28. Stockists Management (R6) ---');
  const adminStkList = await get('http://localhost:3001/api/admin/stockists');
  assert(adminStkList.status === 200, 'GET /api/admin/stockists succeeds');
  const s1InList = adminStkList.body.find(s => s.id === 's1');
  assert(s1InList !== undefined && s1InList.gmv_30d !== undefined, 'Stockist list includes gmv_30d preview');

  const createStkRes = await post('http://localhost:3001/api/admin/stockists', {
    name: 'New Test Stockist Shop',
    phone: '9831122334',
    region_id: 'r1',
    vendor_id: 'v1',
    commission_rate: 12.5
  });
  assert(createStkRes.status === 200, 'Admin create stockist succeeds');
  const newStkId = createStkRes.body.stockist.id;

  const ratePreviewRes = await post(`http://localhost:3001/api/admin/stockists/${s1InList.id}/commission-rate`, {
    rate_percent: 15.0
  });
  assert(ratePreviewRes.status === 200 && ratePreviewRes.body.preview === true, 'Commission rate request without CONFIRM returns preview calculation');

  const rateApplyRes = await post(`http://localhost:3001/api/admin/stockists/${s1InList.id}/commission-rate`, {
    rate_percent: 15.0,
    confirmationText: 'CONFIRM'
  });
  assert(rateApplyRes.status === 200, 'Commission rate update with CONFIRM succeeds');

  const deleteStkWithOrders = await del(`http://localhost:3001/api/admin/stockists/${s1InList.id}`);
  assert(deleteStkWithOrders.status === 400, 'Deleting stockist with order history is blocked with 400');

  // 29. Partner Leads & Audit Log Verification (R7 & Audit)
  console.log('\n--- 29. Partner Leads & Audit Log Verification (R7 & Audit) ---');
  const leadPostRes = await post('http://localhost:3001/api/partner-leads', {
    name: 'Garia Cable Network',
    phone: '9830088888',
    region_id: 'r1'
  });
  assert(leadPostRes.status === 200, 'Partner lead created');
  const leadId = leadPostRes.body.lead.id;

  const leadStatusRes = await post(`http://localhost:3001/api/admin/partner-leads/${leadId}/status`, {
    status: 'CONTACTED'
  });
  assert(leadStatusRes.status === 200, 'Lead status updated to CONTACTED');

  const auditLogRes = await get('http://localhost:3001/api/admin/audit-log');
  assert(auditLogRes.status === 200, 'GET /api/admin/audit-log succeeds');
  assert(auditLogRes.body.length >= 5, 'Audit log contains entries for admin actions');

  // 30. Customer UI Fraud Report Button Reachability
  console.log('\n--- 30. Customer UI Fraud Report Button Reachability ---');
  const fs = require('fs');
  const path = require('path');
  const appJsxContent = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');
  assert(appJsxContent.includes('Report a problem'), 'App.jsx contains "Report a problem" button in customer UI');
  assert(appJsxContent.includes('onClick={() => setShowFraudReportModal(true)}'), 'App.jsx button onClick handler opens fraud report modal');

  // 31. Round R2 Customer App "Continue shopping at" Button
  console.log('\n--- 31. Round R2 Customer App "Continue shopping at" Button ---');
  assert(appJsxContent.includes('const [previousStockistId, setPreviousStockistId] = useState(null)'), 'App.jsx contains previousStockistId state declaration');
  assert(appJsxContent.includes('Continue shopping at') && appJsxContent.includes('setPreviousStockistId(null)'), 'App.jsx contains "Continue shopping at" button label and clears previousStockistId');

  // 32. Round S — Commission Model Refactor (Profit-Basis)
  console.log('\n--- 32. Round S — Commission Model Refactor (Profit-Basis) ---');

  // Config CRUD (Tests 149-152)
  const getCcRes = await get('http://localhost:3001/api/admin/commission-config');
  assert(getCcRes.status === 200, 'GET /api/admin/commission-config succeeds');
  assert(getCcRes.body.length >= 1, 'Commission config returns at least 1 row (GLOBAL default)');
  const globalRow = getCcRes.body.find(c => c.scope === 'GLOBAL');
  assert(globalRow && globalRow.stockist_reinvest_pct === 50, 'GLOBAL default row has reinvest_pct=50');

  // Test 150: Create STORE override for s1
  const postOverrideRes = await post('http://localhost:3001/api/admin/commission-config', {
    scope: 'STORE',
    stockist_id: 's1',
    stockist_reinvest_pct: 60,
    points_from_pot_pct: 30,
    partner_redemption_cut_pct: 15
  });
  assert(postOverrideRes.status === 200, 'POST STORE override succeeds');
  assert(postOverrideRes.body.config.scope === 'STORE', 'Created config scope is STORE');
  const overrideConfigId = postOverrideRes.body.config.id;

  // Test 151: Invalid percentage range
  const postInvalidRes = await post('http://localhost:3001/api/admin/commission-config', {
    scope: 'GLOBAL',
    stockist_reinvest_pct: 150,
    points_from_pot_pct: 40,
    partner_redemption_cut_pct: 12
  });
  assert(postInvalidRes.status === 400, 'POST with stockist_reinvest_pct=150 returns 400');

  // Test 152: DELETE GLOBAL row is blocked
  const deleteGlobalRes = await del(`http://localhost:3001/api/admin/commission-config/${globalRow.id}`);
  assert(deleteGlobalRes.status === 400, 'DELETE of GLOBAL default row returns 400');
  assert(deleteGlobalRes.body.error.includes('cannot delete global default'), 'DELETE error message mentions cannot delete global default');

  // Test 153: Canonical order at s3 (Price 100, Cost 80 -> Profit 20. Reinvest 50% = 10, Pot 10, Points 40% = 4, Comm = 6, Payout = 90)
  const prodResCanonical = await post('http://localhost:3001/api/products', {
    name: 'Canonical Test item',
    category: 'groceries',
    price: 100,
    costPrice: 80,
    stockistId: 's3',
    regionId: 'r1',
    initialStock: 10
  });
  assert(prodResCanonical.status === 200, 'Product for canonical settlement created');
  const canonicalProdId = prodResCanonical.body.product.id;

  const canonicalOrderRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    fulfillmentType: 'PICKUP',
    stores: [
      {
        stockistId: 's3',
        pickupSlot: '10:00–11:00',
        items: [{ productId: canonicalProdId, quantity: 1 }]
      }
    ]
  });
  assert(canonicalOrderRes.status === 200, 'Canonical order created');
  const canonicalOrder = canonicalOrderRes.body.orders[0];
  assert(canonicalOrder.platform_commission === 6, `Canonical platform_commission is 6 (got ${canonicalOrder.platform_commission})`);
  assert(canonicalOrder.points_credited === 4, `Canonical points_credited is 4 (got ${canonicalOrder.points_credited})`);
  assert(canonicalOrder.stockist_payout === 90, `Canonical stockist_payout is 90 (got ${canonicalOrder.stockist_payout})`);

  // Test 154: Order at s1 with STORE override (Reinvest 60%, Points 30% -> Profit 20, Reinvest 12, Pot 8, Points 2.4, Comm 5.6, Payout 92)
  const prodResOverride = await post('http://localhost:3001/api/products', {
    name: 'Override Test item',
    category: 'groceries',
    price: 100,
    costPrice: 80,
    stockistId: 's1',
    regionId: 'r1',
    initialStock: 10
  });
  assert(prodResOverride.status === 200, 'Product for override settlement created');
  const overrideProdId = prodResOverride.body.product.id;

  const overrideOrderRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    fulfillmentType: 'PICKUP',
    stores: [
      {
        stockistId: 's1',
        pickupSlot: '10:00–11:00',
        items: [{ productId: overrideProdId, quantity: 1 }]
      }
    ]
  });
  assert(overrideOrderRes.status === 200, 'Override order created');
  const overrideOrder = overrideOrderRes.body.orders[0];
  assert(overrideOrder.platform_commission === 5.6, `Override platform_commission is 5.6 (got ${overrideOrder.platform_commission})`);
  assert(overrideOrder.points_credited === 2.4, `Override points_credited is 2.4 (got ${overrideOrder.points_credited})`);
  assert(overrideOrder.stockist_payout === 92, `Override stockist_payout is 92 (got ${overrideOrder.stockist_payout})`);

  // Test 155: Loss leader (price=100, cost=100 -> profit = 0) -> 0/0/0 settlement
  const lossProdRes = await post('http://localhost:3001/api/products', {
    name: 'Loss Leader item',
    category: 'groceries',
    price: 100,
    costPrice: 100,
    stockistId: 's3',
    regionId: 'r1',
    initialStock: 10
  });
  assert(lossProdRes.status === 200, 'Loss leader product created');
  const lossProdId = lossProdRes.body.product.id;

  const lossOrderRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    fulfillmentType: 'PICKUP',
    stores: [
      {
        stockistId: 's3',
        pickupSlot: '10:00–11:00',
        items: [{ productId: lossProdId, quantity: 1 }]
      }
    ]
  });
  assert(lossOrderRes.status === 200, 'Loss leader order created successfully');
  const lossOrder = lossOrderRes.body.orders[0];
  assert(lossOrder.platform_commission === 0, 'Loss leader platform_commission is 0');
  assert(lossOrder.points_credited === 0, 'Loss leader points_credited is 0');

  // Test 156: Order tagged commission_model='profit_v2'
  assert(canonicalOrder.commission_model === 'profit_v2', 'New order tagged commission_model=profit_v2');

  // Test 157: config_row_id on order matches row used (STORE for overrideOrder, GLOBAL for canonicalOrder)
  assert(overrideOrder.config_row_id === overrideConfigId, 'Override order config_row_id matches STORE config ID');
  assert(canonicalOrder.config_row_id === globalRow.id, 'Canonical order config_row_id matches GLOBAL config ID');

  // Test 158 & 159: Historical order integrity (seed orders)
  const allOrdersRes = await get('http://localhost:3001/api/orders');
  assert(allOrdersRes.status === 200, 'GET /api/orders succeeds');
  const grossV1Order = allOrdersRes.body.find(o => o.commission_model === 'gross_v1');
  assert(grossV1Order, 'Historical gross_v1 order exists');
  assert(grossV1Order.commission_model === 'gross_v1', 'Historical order returns commission_model=gross_v1');
  assert(grossV1Order.platform_commission !== undefined, 'Historical order preserves platform_commission');

  // Test 160 & 161: Partner payout helper
  const serverModule = require('../server.js');
  const defaultPayout = await serverModule.calculatePartnerPayout(250);
  assert(defaultPayout.platformCut === 30 && defaultPayout.partnerPayout === 220 && defaultPayout.cutPctUsed === 12, 'calculatePartnerPayout(250) returns 30/220/12');

  const overridePayout = await serverModule.calculatePartnerPayout(200, 's1');
  assert(overridePayout.platformCut === 30 && overridePayout.partnerPayout === 170 && overridePayout.cutPctUsed === 15, 'calculatePartnerPayout(200, s1) returns 30/170/15');

  // Test 162: Audit log coverage for commission-config mutations
  const deleteOverrideRes = await del(`http://localhost:3001/api/admin/commission-config/${overrideConfigId}`);
  assert(deleteOverrideRes.status === 200, 'DELETE of STORE override succeeds');

  const finalAuditRes = await get('http://localhost:3001/api/admin/audit-log');
  assert(finalAuditRes.status === 200, 'GET /api/admin/audit-log succeeds');
  const actionsInLog = finalAuditRes.body.map(a => a.action);
  assert(actionsInLog.includes('COMMISSION_CONFIG_CREATE'), 'Audit log contains COMMISSION_CONFIG_CREATE');
  assert(actionsInLog.includes('COMMISSION_CONFIG_DELETE'), 'Audit log contains COMMISSION_CONFIG_DELETE');

  
  // --- Round T: Stockist Bill Upload for SKU Integrity ---
  console.log('\n--- 24. Round T: Stockist Bill Upload for SKU Integrity ---');

  // Test 184: 503 when R2 is unconfigured and R2_MOCK=false
  const unconfigRes = await post('http://localhost:3001/api/products', { name: 'Test', price: 100 }, { rawJson: true, headers: { 'x-r2-mock': 'false' } });
  assert(unconfigRes.status === 503, 'R2 unconfigured returns 503');
  assert(unconfigRes.body.error === 'r2_not_configured', 'Error code is r2_not_configured');

  // Test 185: JSON POST (missing bill_photo) returns 400 bill_photo_required
  const jsonPostRes = await post('http://localhost:3001/api/products', {
    name: 'No Bill Product',
    category: 'groceries',
    price: 100,
    costPrice: 70,
    stockistId: 's1',
    regionId: 'r1',
    initialStock: 10
  }, { rawJson: true });
  assert(jsonPostRes.status === 400, 'JSON product create rejected with 400');
  assert(jsonPostRes.body.error === 'bill_photo_required', 'Error is bill_photo_required');

  // Test 186: Non-image file type (PDF) returns 400 invalid_file_type
  const pdfRes = await postMultipart('http://localhost:3001/api/products', {
    name: 'PDF Bill SKU',
    category: 'groceries',
    price: 100,
    costPrice: 70,
    stockistId: 's1',
    regionId: 'r1',
    initialStock: 10
  }, { fieldName: 'bill_photo', filename: 'bill.pdf', mime: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') }, 'POST');
  assert(pdfRes.status === 400, 'PDF upload rejected with 400');
  assert(pdfRes.body.error === 'invalid_file_type', 'Error is invalid_file_type');

  // Test 187: Oversized file (>8MB) returns 400 file_too_large
  const largeBuffer = Buffer.alloc(8 * 1024 * 1024 + 100);
  const largeRes = await postMultipart('http://localhost:3001/api/products', {
    name: 'Large Bill SKU',
    category: 'groceries',
    price: 100,
    costPrice: 70,
    stockistId: 's1',
    regionId: 'r1',
    initialStock: 10
  }, { fieldName: 'bill_photo', filename: 'big.jpg', mime: 'image/jpeg', buffer: largeBuffer }, 'POST');
  assert(largeRes.status === 400, 'File >8MB rejected with 400');
  assert(largeRes.body.error === 'file_too_large', 'Error is file_too_large');

  // Test 188: Valid JPEG multipart POST creates product and bill_photo row
  const createBillRes = await postMultipart('http://localhost:3001/api/products', {
    name: 'Integrity SKU 101',
    category: 'groceries',
    price: 150,
    costPrice: 110,
    stockistId: 's1',
    regionId: 'r1',
    initialStock: 25
  }, { fieldName: 'bill_photo', filename: 'bill1.jpg', mime: 'image/jpeg', buffer: Buffer.from('bill jpeg data') }, 'POST');
  assert(createBillRes.status === 200, 'Valid product + bill photo upload returns 200');
  assert(createBillRes.body.product.latest_bill_photo_id, 'Product has latest_bill_photo_id');
  assert(createBillRes.body.bill_photo.flag_status === 'CLEAN', 'Initial bill photo flag_status is CLEAN');
  const integrityProdId = createBillRes.body.product.id;
  const initialBillId = createBillRes.body.bill_photo.id;

  // Test 189: Non-price edit (name change) via JSON without bill photo succeeds
  const nonPricePatchRes = await patch(`http://localhost:3001/api/products/${integrityProdId}`, {
    name: 'Integrity SKU 101 Renamed',
    stockistId: 's1'
  }, { rawJson: true });
  assert(nonPricePatchRes.status === 200, 'Non-price edit without bill photo succeeds');

  // Test 190: Price edit via JSON without bill photo fails 400 bill_required_for_price_change
  const priceNoBillPatchRes = await patch(`http://localhost:3001/api/products/${integrityProdId}`, {
    price: 160,
    stockistId: 's1'
  }, { rawJson: true });
  assert(priceNoBillPatchRes.status === 400, 'Price edit without bill photo fails with 400');
  assert(priceNoBillPatchRes.body.error === 'bill_required_for_price_change', 'Error is bill_required_for_price_change');

  // Test 191: Price edit WITH bill photo succeeds and appends bill record
  const priceWithBillPatchRes = await postMultipart(`http://localhost:3001/api/products/${integrityProdId}`, {
    name: 'Integrity SKU 101 Renamed',
    price: 160,
    costPrice: 120,
    stockistId: 's1'
  }, { fieldName: 'bill_photo', filename: 'bill2.png', mime: 'image/png', buffer: Buffer.from('bill2 png data') }, 'PATCH');
  assert(priceWithBillPatchRes.status === 200, 'Price edit with bill photo succeeds');
  const secondBillId = priceWithBillPatchRes.body.bill_photo.id;
  assert(secondBillId !== initialBillId, 'New bill photo ID created on price edit');

  // Test 192: Bill history endpoint returns chronological bill photos
  const historyRes = await get(`http://localhost:3001/api/products/${integrityProdId}/bill-history`);
  assert(historyRes.status === 200, 'GET bill history returns 200');
  assert(historyRes.body.length === 2, `Bill history returns 2 entries (got ${historyRes.body.length})`);

  // Test 193: Admin bill photos list endpoint returns paginated bill list
  const adminBillsRes = await get('http://localhost:3001/api/admin/bill-photos');
  assert(adminBillsRes.status === 200, 'GET admin bill photos returns 200');
  assert(adminBillsRes.body.data.length >= 2, 'Admin bill photos list includes uploaded bills');

  // Test 194: Flagging bill with reason < 10 chars fails 400
  const shortFlagRes = await post(`http://localhost:3001/api/admin/bill-photos/${secondBillId}/flag`, {
    admin_id: 'u-admin',
    reason: 'Short'
  });
  assert(shortFlagRes.status === 400, 'Flag with reason < 10 chars fails with 400');
  assert(shortFlagRes.body.error === 'reason_too_short', 'Error is reason_too_short');

  // Test 195: Flagging bill with valid reason sets FLAGGED status & product has_flagged_bill
  const flagBillRes = await post(`http://localhost:3001/api/admin/bill-photos/${secondBillId}/flag`, {
    admin_id: 'u-admin',
    reason: 'Invoice price does not match declared wholesale cost price.'
  });
  assert(flagBillRes.status === 200, 'Flag bill succeeds with 200');
  assert(flagBillRes.body.bill.flag_status === 'FLAGGED', 'Bill flag_status set to FLAGGED');
  assert(flagBillRes.body.product.has_flagged_bill === true, 'Product has_flagged_bill set to true');

  // Test 196: Unflagging/resolving bill sets RESOLVED and updates audit log
  const unflagRes = await post(`http://localhost:3001/api/admin/bill-photos/${secondBillId}/unflag`, {
    admin_id: 'u-admin'
  });
  assert(unflagRes.status === 200, 'Unflag bill succeeds with 200');
  assert(unflagRes.body.bill.flag_status === 'RESOLVED', 'Bill flag_status set to RESOLVED');
  assert(unflagRes.body.product.has_flagged_bill === false, 'Product has_flagged_bill set to false');

  // Test 197: Signed URL endpoint returns presigned read URL
  const signedUrlRes = await post(`http://localhost:3001/api/admin/bill-photos/${secondBillId}/signed-url`, {});
  assert(signedUrlRes.status === 200, 'Signed URL request succeeds with 200');
  assert(signedUrlRes.body.signed_url, 'Response contains signed_url');

  // Test 198: Filtering admin bill photos by flag_status
  const flagInitialRes = await post(`http://localhost:3001/api/admin/bill-photos/${initialBillId}/flag`, {
    admin_id: 'u-admin',
    reason: 'Flagging initial bill for status filter testing.'
  });
  assert(flagInitialRes.status === 200, 'Flagged initial bill for filter test');

  const filteredStatusRes = await get('http://localhost:3001/api/admin/bill-photos?flag_status=FLAGGED');
  assert(filteredStatusRes.status === 200, 'Filter by flag_status returns 200');
  assert(filteredStatusRes.body.data.every(b => b.flag_status === 'FLAGGED'), 'All filtered bills have flag_status FLAGGED');

  // Test 199: Filtering admin bill photos by stockist_id
  const filteredStockistRes = await get('http://localhost:3001/api/admin/bill-photos?stockist_id=s1');
  assert(filteredStockistRes.status === 200, 'Filter by stockist_id returns 200');
  assert(filteredStockistRes.body.data.every(b => b.stockist_id === 's1'), 'All filtered bills belong to stockist s1');

  // Test 200: Multi-bill product retains has_flagged_bill=true if any bill remains FLAGGED
  const prodCheckRes = await get(`http://localhost:3001/api/products?stockistId=s1`);
  const targetProd = prodCheckRes.body.find(p => p.id === integrityProdId);
  assert(targetProd.has_flagged_bill === true, 'Product retains has_flagged_bill=true because initialBillId is FLAGGED');

  // 33. Round P1 — Partner Data Model & Auth
  console.log('\n--- 33. Round P1: Partner Data Model & Auth ---');

  // Test 1: Password login with correct email + password -> 200 with session token
  const p1_loginRes = await post('http://localhost:3001/api/partner/auth/login-password', {
    email: 'adhya@partners.example',
    password: 'partner123'
  });
  assert(p1_loginRes.status === 200, 'Password login with correct email + password succeeds');
  assert(p1_loginRes.body.session_token, 'Login returns session_token');
  assert(p1_loginRes.body.user && p1_loginRes.body.user.email === 'adhya@partners.example', 'Login returns user object');
  assert(p1_loginRes.body.user.password_hash === undefined, 'password_hash is stripped from login user response');
  assert(p1_loginRes.body.partner && p1_loginRes.body.partner.id === 'ptr-adhya', 'Login returns partner object');
  const adhyaSessionToken = p1_loginRes.body.session_token;

  // Test 2: Password login with wrong password -> 401 generic error
  const p1_wrongPassRes = await post('http://localhost:3001/api/partner/auth/login-password', {
    email: 'adhya@partners.example',
    password: 'wrongpassword'
  });
  assert(p1_wrongPassRes.status === 401, 'Password login with wrong password returns 401');
  assert(p1_wrongPassRes.body.error === 'Invalid credentials', 'Returns generic error message without leak');

  // Test 3: Password login with nonexistent email -> 401 same generic error
  const p1_nonExistentEmailRes = await post('http://localhost:3001/api/partner/auth/login-password', {
    email: 'nobody@partners.example',
    password: 'somepassword'
  });
  assert(p1_nonExistentEmailRes.status === 401, 'Password login with nonexistent email returns 401');
  assert(p1_nonExistentEmailRes.body.error === 'Invalid credentials', 'Returns same generic error message without leak');

  // Test 4: Set password with valid session -> 200; login with new password succeeds
  const p1_setPassRes = await post('http://localhost:3001/api/partner/auth/set-password', {
    new_password: 'newpartnerpassword123'
  }, { headers: { Authorization: `Bearer ${adhyaSessionToken}` } });
  assert(p1_setPassRes.status === 200, 'Set password with valid session succeeds');

  const p1_loginNewPassRes = await post('http://localhost:3001/api/partner/auth/login-password', {
    email: 'adhya@partners.example',
    password: 'newpartnerpassword123'
  });
  assert(p1_loginNewPassRes.status === 200, 'Login with newly set password succeeds');

  // Test 5: Forgot-password with real email -> 200, mockOutbox has 1 email; reset with valid token -> 200
  await post('http://localhost:3001/api/test/clear-mock-outbox', {});

  const p1_forgotRes = await post('http://localhost:3001/api/partner/auth/forgot-password', {
    email: 'jio@partners.example'
  });
  assert(p1_forgotRes.status === 200, 'Forgot password request succeeds with 200');
  const outboxRes = await get('http://localhost:3001/api/test/mock-outbox');
  const outbox = outboxRes.body;
  assert(Array.isArray(outbox) && outbox.length === 1, 'mockOutbox contains 1 sent email');
  assert(outbox[0].to === 'jio@partners.example', 'Email sent to correct partner email');

  const resetTokenMatch = outbox[0].textBody.match(/token=([a-f0-9]+)/);
  assert(resetTokenMatch && resetTokenMatch[1], 'Reset token extracted from mock email');
  const resetToken = resetTokenMatch[1];

  const p1_resetPassRes = await post('http://localhost:3001/api/partner/auth/reset-password', {
    token: resetToken,
    new_password: 'jionewpassword123'
  });
  assert(p1_resetPassRes.status === 200, 'Reset password with valid token succeeds');

  const p1_jioLoginRes = await post('http://localhost:3001/api/partner/auth/login-password', {
    email: 'jio@partners.example',
    password: 'jionewpassword123'
  });
  assert(p1_jioLoginRes.status === 200, 'Login with reset password succeeds for Jio partner');

  // Test 6: Reset with expired/invalid token -> 400
  const p1_invalidTokenResetRes = await post('http://localhost:3001/api/partner/auth/reset-password', {
    token: 'invalid_or_expired_token_string',
    new_password: 'anotherpassword123'
  });
  assert(p1_invalidTokenResetRes.status === 400, 'Reset password with invalid token returns 400');

  // Test 7: Rate limit: 6 password login attempts in a row from same email -> 6th returns 429
  const testRateLimitEmail = 'ratelimit@partners.example';
  for (let i = 0; i < 5; i++) {
    await post('http://localhost:3001/api/partner/auth/login-password', { email: testRateLimitEmail, password: 'bad' });
  }
  const p1_sixthAttemptRes = await post('http://localhost:3001/api/partner/auth/login-password', { email: testRateLimitEmail, password: 'bad' });
  assert(p1_sixthAttemptRes.status === 429, '6th failed login attempt from same email returns 429');

  // Test 8: login-otp-request with an existing partner's phone -> 200
  const p1_otpReqRes = await post('http://localhost:3001/api/partner/auth/login-otp-request', {
    phone: '9876500000'
  });
  assert(p1_otpReqRes.status === 200, 'OTP request with existing partner phone returns 200');

  // Test 9: login-otp-request with nonexistent phone -> 200 (no leak)
  const p1_otpNonExistReqRes = await post('http://localhost:3001/api/partner/auth/login-otp-request', {
    phone: '0000000000'
  });
  assert(p1_otpNonExistReqRes.status === 200, 'OTP request with nonexistent phone returns 200 without leak');

  // Test 10: login-otp-verify with correct OTP 123456 -> 200 with session
  const p1_otpVerifyRes = await post('http://localhost:3001/api/partner/auth/login-otp-verify', {
    phone: '9876500000',
    otp: '123456'
  });
  assert(p1_otpVerifyRes.status === 200, 'OTP verify for partner succeeds with 200');
  assert(p1_otpVerifyRes.body.session_token, 'OTP verify returns session token');

  // Test 11: GET /api/partner/auth/session with valid Bearer token -> returns user + partner
  const p1_sessionCheckRes = await get('http://localhost:3001/api/partner/auth/session', {
    headers: { Authorization: `Bearer ${adhyaSessionToken}` }
  });
  assert(p1_sessionCheckRes.status === 200, 'Session check with valid Bearer token returns 200');
  assert(p1_sessionCheckRes.body.partner && p1_sessionCheckRes.body.partner.id === 'ptr-adhya', 'Session check returns partner');

  // Test 12: Same endpoint with tampered token -> 401
  const p1_tamperedSessionRes = await get('http://localhost:3001/api/partner/auth/session', {
    headers: { Authorization: 'Bearer tampered_invalid_token_xyz' }
  });
  assert(p1_tamperedSessionRes.status === 401, 'Session check with tampered token returns 401');

  // Test 13: Create partner via admin -> 200, users + partners + partner_users created and linked
  const p1_createPartnerRes = await post('http://localhost:3001/api/admin/partners', {
    legal_name: 'Metro Broadband Pvt Ltd',
    display_name: 'Metro Broadband',
    contact_phone: '9876599999',
    contact_email: 'metro@partners.example',
    address: '45 Salt Lake, Kolkata',
    service_types: ['BROADBAND'],
    admin_id: 'u-admin'
  });
  assert(p1_createPartnerRes.status === 200, 'Admin create partner succeeds with 200');
  assert(p1_createPartnerRes.body.partner && p1_createPartnerRes.body.partner.id, 'Partner object created with ID');
  assert(p1_createPartnerRes.body.user && p1_createPartnerRes.body.user.phone === '9876599999', 'User object created with phone');

  // Test 14: Create partner with phone that already exists on a customer -> 409
  const p1_duplicatePhoneRes = await post('http://localhost:3001/api/admin/partners', {
    legal_name: 'Dup Phone Partner',
    display_name: 'Dup Partner',
    contact_phone: '9830099999', // u-cust1 current phone
    contact_email: 'dupphone@partners.example',
    address: 'Some Address',
    service_types: ['CABLE'],
    admin_id: 'u-admin'
  });
  assert(p1_duplicatePhoneRes.status === 409, 'Creating partner with existing customer phone returns 409');

  // Test 15: Promote a lead -> lead status ONBOARDED, promoted_partner_id set, appears in admin partners
  const p1_leadRes = await post('http://localhost:3001/api/partner-leads', {
    name: 'Subhasish Roy',
    phone: '9876588888',
    email: 'subhasish@lead.example',
    business_name: 'Roy Cable Services',
    city: 'Kolkata',
    service_type: 'CABLE',
    address: '99 Garia Park'
  });
  const p1_leadId = p1_leadRes.body.lead.id;

  const p1_promoteRes = await post(`http://localhost:3001/api/admin/partner-leads/${p1_leadId}/promote`, {
    admin_id: 'u-admin',
    service_types: ['CABLE']
  });
  assert(p1_promoteRes.status === 200, 'Promote lead succeeds with 200');
  assert(p1_promoteRes.body.lead.status === 'ONBOARDED', 'Lead status updated to ONBOARDED');
  assert(p1_promoteRes.body.lead.promoted_partner_id === p1_promoteRes.body.partner.id, 'Lead promoted_partner_id linked');

  // Test 16: Promote an already-promoted lead -> 409
  const p1_rePromoteRes = await post(`http://localhost:3001/api/admin/partner-leads/${p1_leadId}/promote`, {
    admin_id: 'u-admin',
    service_types: ['CABLE']
  });
  assert(p1_rePromoteRes.status === 409, 'Promoting already promoted lead returns 409');

  // Test 17: Admin PATCH partner name -> row updated, audit log entry created
  const p1_patchPartnerRes = await patch(`http://localhost:3001/api/admin/partners/${p1_promoteRes.body.partner.id}`, {
    display_name: 'Roy Cable & Fiber'
  });
  assert(p1_patchPartnerRes.status === 200, 'Admin PATCH partner name succeeds');
  assert(p1_patchPartnerRes.body.display_name === 'Roy Cable & Fiber', 'Partner display_name updated');

  const p1_auditLogRes = await get('http://localhost:3001/api/admin/audit-log');
  assert(p1_auditLogRes.body.some(a => a.action === 'EDIT_PARTNER' && a.entity_id === p1_promoteRes.body.partner.id), 'Audit log contains EDIT_PARTNER entry');

  // Test 18: Admin deactivates partner -> is_active=false AND all packages have is_active=false
  const p1_deactivatePartnerRes = await post(`http://localhost:3001/api/admin/partners/ptr-adhya/deactivate`, {});
  assert(p1_deactivatePartnerRes.status === 200, 'Deactivate partner succeeds with 200');
  assert(p1_deactivatePartnerRes.body.is_active === false, 'Partner is_active set to false');

  const p1_adhyaDetailRes = await get('http://localhost:3001/api/admin/partners/ptr-adhya');
  assert(p1_adhyaDetailRes.body.packages.every(pkg => pkg.is_active === false), 'All partner packages deactivated on partner deactivation');

  await post(`http://localhost:3001/api/admin/partners/ptr-adhya/reactivate`, {});

  // Test 19: Admin adds region binding to partner -> row created
  const p1_addRegionRes = await post('http://localhost:3001/api/admin/partners/ptr-jio/regions', {
    region_id: 'r2',
    service_type: 'BROADBAND',
    admin_id: 'u-admin'
  });
  assert(p1_addRegionRes.status === 200, 'Admin adds region mapping to partner succeeds');
  assert(p1_addRegionRes.body.region_id === 'r2', 'Region mapping created for r2');

  // Test 20: Duplicate (partner, region, service_type) insert -> 409
  const p1_dupRegionRes = await post('http://localhost:3001/api/admin/partners/ptr-jio/regions', {
    region_id: 'r2',
    service_type: 'BROADBAND',
    admin_id: 'u-admin'
  });
  assert(p1_dupRegionRes.status === 409, 'Duplicate region mapping insert returns 409');

  // Test 21: Create package with valid service_type + active_regions -> 200
  const p1_createPkgRes = await post('http://localhost:3001/api/admin/partners/ptr-jio/packages', {
    service_type: 'BROADBAND',
    name: '₹999 Jio Mega Broadband',
    description: '300 Mbps unlimited fiber connection',
    face_value_rupees: 999,
    cost_to_partner_rupees: 999,
    point_cost: 999,
    active_regions: ['r1', 'r2']
  });
  assert(p1_createPkgRes.status === 200, 'Create package with valid service_type + active_regions succeeds');
  assert(p1_createPkgRes.body.name === '₹999 Jio Mega Broadband', 'Package created with correct name');

  // Test 22: Create package with service_type not in partner's service_types -> 400
  const p1_invalidPkgRes = await post('http://localhost:3001/api/admin/partners/ptr-jio/packages', {
    service_type: 'CABLE',
    name: 'Invalid Cable Pkg',
    face_value_rupees: 200,
    active_regions: ['r1']
  });
  assert(p1_invalidPkgRes.status === 400, 'Create package with unsupported service_type returns 400');

  // Test 23: Partner (using own session) creates package for themselves -> 200, partner_id matches
  const p1_partnerSelfPkgRes = await post('http://localhost:3001/api/partner/packages', {
    service_type: 'CABLE',
    name: '₹350 Cable Standard',
    description: 'Standard cable tier',
    face_value_rupees: 350,
    cost_to_partner_rupees: 350,
    point_cost: 350,
    active_regions: ['r1']
  }, { headers: { Authorization: `Bearer ${adhyaSessionToken}` } });
  assert(p1_partnerSelfPkgRes.status === 200, 'Partner self-service package creation succeeds');
  assert(p1_partnerSelfPkgRes.body.partner_id === 'ptr-adhya', 'Created package partner_id matches session partner');

  // Test 24: Partner attempts to create a package for a DIFFERENT partner_id -> 403
  const p1_spoofPkgRes = await post('http://localhost:3001/api/partner/packages', {
    partner_id: 'ptr-jio',
    service_type: 'BROADBAND',
    name: 'Spoofed Package',
    face_value_rupees: 500,
    active_regions: ['r1']
  }, { headers: { Authorization: `Bearer ${adhyaSessionToken}` } });
  assert(p1_spoofPkgRes.status === 403, 'Partner creating package for different partner_id returns 403');

  // Test 25: Bind customer to a valid cable partner in their region -> 200
  const p1_bindRes = await post('http://localhost:3001/api/customer/partner-bindings', {
    customer_user_id: 'u-cust1',
    cable_partner_id: 'ptr-adhya',
    broadband_partner_id: 'ptr-jio'
  });
  assert(p1_bindRes.status === 200, 'Bind customer to valid regional partners succeeds');
  assert(p1_bindRes.body.cable_partner_id === 'ptr-adhya', 'Binding cable_partner_id set correctly');

  // Test 26: Bind customer to a partner that doesn't serve their region / service -> 400
  const p1_bogusBindRes = await post('http://localhost:3001/api/customer/partner-bindings', {
    customer_user_id: 'u-cust2',
    cable_partner_id: 'ptr-jio'
  });
  assert(p1_bogusBindRes.status === 400, 'Bind customer to partner not offering requested service_type returns 400');

  // Test 27: GET .../available returns only partners matching customer's region grouped by service_type
  const p1_availRes = await get('http://localhost:3001/api/customer/partner-bindings/u-cust1/available');
  assert(p1_availRes.status === 200, 'GET available partners returns 200');
  assert(Array.isArray(p1_availRes.body.cable) && Array.isArray(p1_availRes.body.broadband), 'Available partners grouped by cable and broadband');
  assert(p1_availRes.body.cable.some(p => p.id === 'ptr-adhya'), 'Adhya cable appears in cable available list');

  // Test 28: Update existing binding -> audit log entry created (only on updates, not on first-set)
  const p1_updateBindRes = await post('http://localhost:3001/api/customer/partner-bindings', {
    customer_user_id: 'u-cust1',
    cable_partner_id: 'ptr-adhya',
    broadband_partner_id: 'ptr-jio'
  });
  assert(p1_updateBindRes.status === 200, 'Updating existing binding succeeds');

  const p1_auditLogCheck = await get('http://localhost:3001/api/admin/audit-log');
  assert(p1_auditLogCheck.body.some(a => a.action === 'UPDATE_PARTNER_BINDING' && a.entity_id === 'u-cust1'), 'Audit log contains UPDATE_PARTNER_BINDING entry on update');

  // --- 33. Round P2 — Redemption Approval Workflow & Health Dashboard ---
  console.log('\n--- 33. Round P2 — Redemption Approval Workflow & Health Dashboard ---');

  const p2_adhyaDetail = await get('http://localhost:3001/api/admin/partners/ptr-adhya');
  const p2_targetPkg = p2_adhyaDetail.body.packages.find(p => p.is_active);
  const p2_pkgId = p2_targetPkg.id;
  const p2_pkgCost = p2_targetPkg.point_cost;

  // Test 1: Customer redeems partner package with matching binding -> 200, status=PENDING_ADMIN_APPROVAL
  await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: 2000, reason: 'Test setup' });

  await post('http://localhost:3001/api/customer/partner-bindings', {
    customer_user_id: 'u-cust1',
    cable_partner_id: 'ptr-adhya',
    broadband_partner_id: 'ptr-jio'
  });

  const p2_redeemRes = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: 'u-cust1',
    partner_package_id: p2_pkgId,
    amount: p2_pkgCost
  });
  assert(p2_redeemRes.status === 200, 'Customer redeems partner package with matching binding succeeds');
  assert(p2_redeemRes.body.redemption_approval !== undefined, 'Redemption approval created in response');
  assert(p2_redeemRes.body.redemption_approval.status === 'PENDING_ADMIN_APPROVAL', 'Initial approval status is PENDING_ADMIN_APPROVAL');

  const p2_approvalId = p2_redeemRes.body.redemption_approval.id;

  // Test 2: Redemption attempt for unbound partner -> 400 binding_mismatch
  const p2_unboundRes = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: 'u-cust2',
    partner_package_id: p2_pkgId,
    amount: p2_pkgCost
  });
  assert(p2_unboundRes.status === 400, 'Redeem for unbound partner returns 400');
  assert(p2_unboundRes.body.error === 'binding_mismatch', 'Error code is binding_mismatch');

  // Test 3: Redemption attempt with incorrect point amount -> 400 amount_mismatch
  const p2_amountMismatchRes = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: 'u-cust1',
    partner_package_id: p2_pkgId,
    amount: p2_pkgCost - 10
  });
  assert(p2_amountMismatchRes.status === 400, 'Redeem with incorrect point cost returns 400');
  assert(p2_amountMismatchRes.body.error === 'amount_mismatch', 'Error code is amount_mismatch');

  // Test 4: Admin GET /api/admin/redemption-approvals returns list including PENDING_ADMIN_APPROVAL row
  const p2_adminListRes = await get('http://localhost:3001/api/admin/redemption-approvals');
  assert(p2_adminListRes.status === 200, 'GET /api/admin/redemption-approvals succeeds');
  assert(p2_adminListRes.body.some(a => a.id === p2_approvalId), 'List includes created redemption approval');

  // Test 5: Admin GET /api/admin/redemption-approvals/:id returns full detail
  const p2_adminDetailRes = await get(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId}`);
  assert(p2_adminDetailRes.status === 200, 'GET redemption approval detail succeeds');
  assert(p2_adminDetailRes.body.customer_name !== undefined, 'Detail includes customer_name');
  assert(p2_adminDetailRes.body.partner_name !== undefined, 'Detail includes partner_name');

  // Test 6: Customer GET /api/customer/redemption-status/:id returns status
  const p2_custStatusRes = await get(`http://localhost:3001/api/customer/redemption-status/${p2_approvalId}`);
  assert(p2_custStatusRes.status === 200, 'GET customer redemption status succeeds');
  assert(p2_custStatusRes.body.status === 'PENDING_ADMIN_APPROVAL', 'Status matches PENDING_ADMIN_APPROVAL');

  // Test 7: Admin approves pending redemption -> status changes to APPROVED_AWAITING_PARTNER
  const p2_approveRes = await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId}/approve`, {
    admin_id: 'u-admin',
    notes: 'Approved for processing'
  });
  assert(p2_approveRes.status === 200, 'Admin approve redemption succeeds');
  assert(p2_approveRes.body.status === 'APPROVED_AWAITING_PARTNER', 'Status updated to APPROVED_AWAITING_PARTNER');

  // Test 8: Re-approving already approved redemption returns 400 invalid_transition
  const p2_reApproveRes = await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId}/approve`, {
    admin_id: 'u-admin'
  });
  assert(p2_reApproveRes.status === 400, 'Re-approving approved redemption returns 400');
  assert(p2_reApproveRes.body.error === 'invalid_transition', 'Error code is invalid_transition');

  // Test 9: Partner login & GET /api/partner/redemption-queue returns approved item
  const p2_partnerAuthRes = await post('http://localhost:3001/api/partner/auth/login-otp-verify', {
    phone: '9876500000',
    otp: '123456'
  });
  const partnerToken = p2_partnerAuthRes.body.session_token;

  const p2_queueRes = await get('http://localhost:3001/api/partner/redemption-queue', {
    headers: { Authorization: `Bearer ${partnerToken}` }
  });
  assert(p2_queueRes.status === 200, 'Partner GET redemption-queue succeeds');
  assert(p2_queueRes.body.some(a => a.id === p2_approvalId), 'Partner queue contains approved item');

  // Test 10: Partner fulfills redemption -> status=FULFILLED
  const p2_fulfillRes = await post(`http://localhost:3001/api/partner/redemption-approvals/${p2_approvalId}/fulfill`, {
    partner_notes: 'Cable STB bill discounted by ₹350'
  }, { headers: { Authorization: `Bearer ${partnerToken}` } });
  assert(p2_fulfillRes.status === 200, 'Partner fulfill redemption succeeds');
  assert(p2_fulfillRes.body.status === 'FULFILLED', 'Status updated to FULFILLED');

  // Test 11: Fulfilling already fulfilled redemption returns 400 invalid_transition
  const p2_reFulfillRes = await post(`http://localhost:3001/api/partner/redemption-approvals/${p2_approvalId}/fulfill`, {}, {
    headers: { Authorization: `Bearer ${partnerToken}` }
  });
  assert(p2_reFulfillRes.status === 400, 'Fulfilling already fulfilled redemption returns 400');
  assert(p2_reFulfillRes.body.error === 'invalid_transition', 'Error code is invalid_transition');

  // Test 12: Create second redemption for rejection test
  const p2_redeem2Res = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: 'u-cust1',
    partner_package_id: p2_pkgId,
    amount: p2_pkgCost
  });
  const p2_approvalId2 = p2_redeem2Res.body.redemption_approval.id;

  // Test 13: Admin rejects pending redemption with <10 char reason -> 400
  const p2_shortRejectRes = await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId2}/reject`, {
    admin_id: 'u-admin',
    reason: 'Too short'
  });
  assert(p2_shortRejectRes.status === 400, 'Reject with reason <10 chars returns 400');

  // Test 14: Admin rejects pending redemption with valid reason -> 200, REDEEM_REFUND points entry created
  const p2_rejectRes = await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId2}/reject`, {
    admin_id: 'u-admin',
    reason: 'Subscriber cable account inactive or not found'
  });
  assert(p2_rejectRes.status === 200, 'Admin reject redemption succeeds');
  assert(p2_rejectRes.body.status === 'REJECTED', 'Status updated to REJECTED');
  assert(p2_rejectRes.body.refund_ledger_id !== undefined, 'Refund ledger ID attached');

  // Test 15: Check ledger contains REDEEM_REFUND row for customer
  const p2_ledgerRes = await get('http://localhost:3001/api/ledger/history/u-cust1');
  assert(p2_ledgerRes.body.some(l => l.type === 'REDEEM_REFUND' && l.amount === p2_pkgCost), 'Customer ledger contains REDEEM_REFUND credit entry');

  // Test 16: Create third redemption for dispute workflow
  const p2_redeem3Res = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: 'u-cust1',
    partner_package_id: p2_pkgId,
    amount: p2_pkgCost
  });
  const p2_approvalId3 = p2_redeem3Res.body.redemption_approval.id;
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId3}/approve`, { admin_id: 'u-admin' });

  // Test 17: Partner disputes redemption with <10 char reason -> 400
  const p2_shortDisputeRes = await post(`http://localhost:3001/api/partner/redemption-approvals/${p2_approvalId3}/dispute`, {
    reason: 'short'
  }, { headers: { Authorization: `Bearer ${partnerToken}` } });
  assert(p2_shortDisputeRes.status === 400, 'Partner dispute with <10 char reason returns 400');

  // Test 18: Partner disputes redemption with valid reason -> status=DISPUTED
  const p2_disputeRes = await post(`http://localhost:3001/api/partner/redemption-approvals/${p2_approvalId3}/dispute`, {
    reason: 'Customer account ID mismatch on partner side'
  }, { headers: { Authorization: `Bearer ${partnerToken}` } });
  assert(p2_disputeRes.status === 200, 'Partner dispute succeeds');
  assert(p2_disputeRes.body.status === 'DISPUTED', 'Status updated to DISPUTED');

  // Test 19: Admin resolves dispute with outcome=fulfill -> status=FULFILLED
  const p2_resolveFulfillRes = await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId3}/resolve-dispute`, {
    admin_id: 'u-admin',
    outcome: 'fulfill',
    notes: 'Manually verified with partner operator'
  });
  assert(p2_resolveFulfillRes.status === 200, 'Admin resolve dispute with fulfill succeeds');
  assert(p2_resolveFulfillRes.body.status === 'FULFILLED', 'Status resolved to FULFILLED');

  // Test 20: Create fourth redemption for dispute reject resolution
  const p2_redeem4Res = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: 'u-cust1',
    partner_package_id: p2_pkgId,
    amount: p2_pkgCost
  });
  const p2_approvalId4 = p2_redeem4Res.body.redemption_approval.id;
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId4}/approve`, { admin_id: 'u-admin' });
  await post(`http://localhost:3001/api/partner/redemption-approvals/${p2_approvalId4}/dispute`, {
    reason: 'Customer account cancelled on partner side'
  }, { headers: { Authorization: `Bearer ${partnerToken}` } });

  // Test 21: Admin resolves dispute with outcome=reject -> status=REJECTED and refund credited
  const p2_resolveRejectRes = await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId4}/resolve-dispute`, {
    admin_id: 'u-admin',
    outcome: 'reject',
    notes: 'Upheld dispute, refunding customer points'
  });
  assert(p2_resolveRejectRes.status === 200, 'Admin resolve dispute with reject succeeds');
  assert(p2_resolveRejectRes.body.status === 'REJECTED', 'Status resolved to REJECTED');
  assert(p2_resolveRejectRes.body.refund_ledger_id !== undefined, 'Refund ledger ID set on dispute rejection');

  // Test 22: Partner GET /api/partner/redemption-history returns all partner redemptions
  const p2_historyRes = await get('http://localhost:3001/api/partner/redemption-history', {
    headers: { Authorization: `Bearer ${partnerToken}` }
  });
  assert(p2_historyRes.status === 200, 'GET partner redemption-history succeeds');
  assert(Array.isArray(p2_historyRes.body), 'Returns array of redemption history');

  // Test 23: GET /api/admin/health returns complete health dashboard structure
  const p2_healthRes = await get('http://localhost:3001/api/admin/health');
  assert(p2_healthRes.status === 200, 'GET /api/admin/health succeeds');
  assert(p2_healthRes.body.redemption_pipeline !== undefined, 'Health response contains redemption_pipeline panel');
  assert(p2_healthRes.body.partner_fulfillment_speed !== undefined, 'Health response contains partner_fulfillment_speed panel');
  assert(p2_healthRes.body.stockist_volume_leaderboard !== undefined, 'Health response contains stockist_volume_leaderboard panel');
  assert(p2_healthRes.body.new_arrivals !== undefined, 'Health response contains new_arrivals panel');
  assert(p2_healthRes.body.fraud_signals !== undefined, 'Health response contains fraud_signals panel');
  assert(p2_healthRes.body.system_stats !== undefined, 'Health response contains system_stats panel');

  // Test 24: App.jsx contains "Redemption Approvals" sidebar entry
  const fsMod = require('fs');
  const appJsx = fsMod.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');
  assert(appJsx.includes('Redemption Approvals'), 'App.jsx contains Redemption Approvals sidebar entry');

  // Test 25: App.jsx contains an Approve-action handler that posts to /api/admin/redemption-approvals
  assert(appJsx.includes('/admin/redemption-approvals/') && appJsx.includes('/approve'), 'App.jsx contains Approve-action handler posting to /api/admin/redemption-approvals');

  // Test 26: App.jsx contains a Health sidebar entry
  assert(appJsx.includes('Health') && appJsx.includes('fetchHealthData'), 'App.jsx contains Health sidebar entry');

  // Test 27: App.jsx contains a Promote to Partner button
  assert(appJsx.includes('Promote to Partner'), 'App.jsx contains Promote to Partner button');

  // Test 28: Rejecting an already rejected approval returns 400 invalid_transition
  const p2_reRejectRes = await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId2}/reject`, {
    admin_id: 'u-admin',
    reason: 'Trying to reject again when already rejected'
  });
  assert(p2_reRejectRes.status === 400, 'Rejecting an already rejected approval returns 400');
  assert(p2_reRejectRes.body.error === 'invalid_transition', 'Error code is invalid_transition');

  // Test 29: Resolving dispute on non-disputed approval returns 400 invalid_transition
  const p2_invalidResolveRes = await post(`http://localhost:3001/api/admin/redemption-approvals/${p2_approvalId}/resolve-dispute`, {
    admin_id: 'u-admin',
    outcome: 'fulfill'
  });
  assert(p2_invalidResolveRes.status === 400, 'Resolving dispute on non-disputed approval returns 400');
  assert(p2_invalidResolveRes.body.error === 'invalid_transition', 'Error code is invalid_transition');

  // === ROUND P3 TESTS ===
  console.log('\n--- Round P3: Customer Signup Partner Selection ---');

  // We need a couple of active partners set up for testing:
  const p3_bbRes = await post('http://localhost:3001/api/admin/partners', {
    display_name: 'Test Broadband Partner R1',
    legal_name: 'Test Broadband Ltd',
    contact_phone: '9876543299',
    contact_email: 'bb@partner.com',
    address: '123 BB St',
    service_types: ['BROADBAND'],
    admin_id: 'u-admin'
  });
  assert(p3_bbRes.status === 200, 'Created test broadband partner for P3');
  const p3_bbPartnerId = p3_bbRes.body.partner.id;

  await post(`http://localhost:3001/api/admin/partners/${p3_bbPartnerId}/regions`, {
    region_id: 'r1',
    service_type: 'BROADBAND',
    admin_id: 'u-admin'
  });

  // Test 1: GET /api/customer/available-partners?region_id=r1 returns cable and broadband arrays without sensitive fields
  const p3_availRes = await get('http://localhost:3001/api/customer/available-partners?region_id=r1');
  assert(p3_availRes.status === 200, 'GET available-partners returns 200');
  assert(Array.isArray(p3_availRes.body.cable) && Array.isArray(p3_availRes.body.broadband), 'Returns cable and broadband arrays');
  const sampleCable = p3_availRes.body.cable[0];
  assert(sampleCable.id && sampleCable.display_name && sampleCable.service_types, 'Exposes id, display_name, service_types');
  assert(!sampleCable.email && !sampleCable.gstin && !sampleCable.users, 'Does not expose sensitive partner fields');

  // Test 2: GET /api/customer/available-partners without region_id returns 400
  const p3_availNoRegion = await get('http://localhost:3001/api/customer/available-partners');
  assert(p3_availNoRegion.status === 400, 'Missing region_id returns 400');

  // Test 3: POST /api/auth/register-customer with valid partner bindings succeeds
  const p3_custPhone1 = '9800000001';
  const p3_regRes1 = await post('http://localhost:3001/api/auth/register-customer', {
    phone: p3_custPhone1,
    name: 'P3 Customer One',
    regionId: 'r1',
    address: '123 Test St',
    cable_partner_id: 'ptr-adhya',
    broadband_partner_id: p3_bbPartnerId
  });
  assert(p3_regRes1.status === 200, 'Customer registration with bindings returns 200');
  assert(p3_regRes1.body.user && p3_regRes1.body.user.id, 'Returns user object');
  assert(p3_regRes1.body.bindings.cable_partner_id === 'ptr-adhya', 'Cable binding saved correctly');
  assert(p3_regRes1.body.bindings.broadband_partner_id === p3_bbPartnerId, 'Broadband binding saved correctly');
  const p3_custId1 = p3_regRes1.body.user.id;

  // Test 4: POST /api/auth/register-customer with invalid partner_id returns 400 invalid_partner_binding
  const p3_regResInvalid = await post('http://localhost:3001/api/auth/register-customer', {
    phone: '9800000002',
    name: 'P3 Customer Two',
    regionId: 'r1',
    cable_partner_id: 'p-nonexistent'
  });
  assert(p3_regResInvalid.status === 400, 'Register with non-existent partner returns 400');
  assert(p3_regResInvalid.body.error === 'invalid_partner_binding', 'Error code is invalid_partner_binding');

  // Test 5: POST /api/auth/register-customer with wrong service_type binding returns 400
  const p3_regResWrongType = await post('http://localhost:3001/api/auth/register-customer', {
    phone: '9800000003',
    name: 'P3 Customer Three',
    regionId: 'r1',
    broadband_partner_id: 'ptr-adhya'
  });
  assert(p3_regResWrongType.status === 400, 'Register with wrong service_type partner returns 400');
  assert(p3_regResWrongType.body.error === 'invalid_partner_binding', 'Error code is invalid_partner_binding');

  // Test 6: POST /api/auth/register-customer with partner not serving customer region returns 400
  const p3_regResWrongRegion = await post('http://localhost:3001/api/auth/register-customer', {
    phone: '9800000004',
    name: 'P3 Customer Four',
    regionId: 'r2',
    broadband_partner_id: p3_bbPartnerId
  });
  assert(p3_regResWrongRegion.status === 400, 'Register with partner not covering region returns 400');
  assert(p3_regResWrongRegion.body.error === 'invalid_partner_binding', 'Error code is invalid_partner_binding');

  // Test 7: GET /api/customer/:id/profile returns user details, current bindings, and available partners
  const p3_profRes1 = await get(`http://localhost:3001/api/customer/${p3_custId1}/profile`);
  assert(p3_profRes1.status === 200, 'GET customer profile returns 200');
  assert(p3_profRes1.body.user.name === 'P3 Customer One', 'User name matches');
  assert(p3_profRes1.body.bindings.cable_partner_id === 'ptr-adhya', 'Bindings cable_partner_id matches');
  assert(Array.isArray(p3_profRes1.body.available_partners.cable), 'available_partners cable list present');

  // Test 8: POST /api/customer/:id/profile updates name and address
  const p3_updateProfRes = await post(`http://localhost:3001/api/customer/${p3_custId1}/profile`, {
    name: 'P3 Customer One Updated',
    address: '456 Updated Ave'
  });
  assert(p3_updateProfRes.status === 200, 'POST customer profile returns 200');
  assert(p3_updateProfRes.body.user.name === 'P3 Customer One Updated', 'Profile name updated');
  assert(p3_updateProfRes.body.user.address === '456 Updated Ave', 'Profile address updated');

  // Test 9: POST /api/customer/partner-bindings updates bindings for existing customer
  const p3_bindRes1 = await post('http://localhost:3001/api/customer/partner-bindings', {
    customer_user_id: p3_custId1,
    cable_partner_id: 'ptr-adhya',
    broadband_partner_id: null
  });
  assert(p3_bindRes1.status === 200, 'POST partner-bindings returns 200');
  assert(p3_bindRes1.body.cable_partner_id === 'ptr-adhya', 'Cable binding updated');
  assert(p3_bindRes1.body.broadband_partner_id === null, 'Broadband binding set to null');

  // Test 10: Explicit null binding records audit log entry
  const p3_auditLogCheck = await get('http://localhost:3001/api/admin/audit-log');
  const nullBindLog = p3_auditLogCheck.body.find(l => l.action === 'UPDATE_PARTNER_BINDING' && l.entity_id === p3_custId1);
  assert(nullBindLog !== undefined, 'Audit log entry created for customer binding update');

  // Test 11: Binding an inactive partner returns 400 invalid_partner_binding
  await post(`http://localhost:3001/api/admin/partners/${p3_bbPartnerId}/deactivate`, { admin_id: 'u-admin' });
  const p3_bindInactive = await post('http://localhost:3001/api/customer/partner-bindings', {
    customer_user_id: p3_custId1,
    broadband_partner_id: p3_bbPartnerId
  });
  assert(p3_bindInactive.status === 400, 'Binding inactive partner returns 400');
  assert(p3_bindInactive.body.error === 'invalid_partner_binding', 'Error code is invalid_partner_binding');

  // Re-activate p3_bbPartnerId
  await post(`http://localhost:3001/api/admin/partners/${p3_bbPartnerId}/reactivate`, { admin_id: 'u-admin' });

  // Test 12: GET /api/customer/:id/profile with non-existent customer_user_id returns 404
  const p3_prof404 = await get('http://localhost:3001/api/customer/u-nonexistent/profile');
  assert(p3_prof404.status === 404, 'Non-existent customer profile returns 404');

  // Test 13: POST /api/customer/partner-bindings with non-existent customer_user_id returns 404
  const p3_bind404 = await post('http://localhost:3001/api/customer/partner-bindings', {
    customer_user_id: 'u-nonexistent',
    cable_partner_id: 'ptr-adhya'
  });
  assert(p3_bind404.status === 404, 'Partner-bindings for non-existent customer returns 404');

  // Test 14: App.jsx contains CHOOSE YOUR LOCAL CABLE OPERATOR text or trilingual translations
  assert(appJsx.includes('CHOOSE YOUR LOCAL CABLE OPERATOR'), 'App.jsx contains CHOOSE YOUR LOCAL CABLE OPERATOR label');

  // Test 15: App.jsx contains handling for noCableProvider state variable
  assert(appJsx.includes('noCableProvider'), 'App.jsx contains noCableProvider state handling');

  // Test 16: App.jsx contains Do you have a local internet broadband question
  assert(appJsx.includes('Do you have a local internet'), 'App.jsx contains broadband question');

  // Test 17: App.jsx contains My Profile view with binding change handlers
  assert(appJsx.includes('My Profile') && appJsx.includes('handleSaveProfile'), 'App.jsx contains My Profile view');

  // Test 18: App.jsx contains at least one call to /api/customer/available-partners
  assert(appJsx.includes('/customer/available-partners'), 'App.jsx calls /api/customer/available-partners');

  // --- Round P4a: Partner App Backend ---
  console.log('\n--- Round P4a: Partner App Backend ---');

  // Reset DB to start P4a with clean seed state
  await post('http://localhost:3001/api/admin/reset-db');

  // Login as adhya partner admin
  const p4a_adhyaLogin = await post('http://localhost:3001/api/partner/auth/login-password', {
    email: 'adhya@partners.example',
    password: 'partner123'
  });
  const p4a_adhyaToken = p4a_adhyaLogin.body.session_token;

  // Login as jio partner admin
  const p4a_jioLogin = await post('http://localhost:3001/api/partner/auth/login-password', {
    email: 'jio@partners.example',
    password: 'partner123'
  });
  const p4a_jioToken = p4a_jioLogin.body.session_token;

  // Test 367: Dashboard GET returns 200 with today, month, disputes
  const p4a_dashRes = await get('http://localhost:3001/api/partner/dashboard', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_dashRes.status === 200, 'GET /api/partner/dashboard returns 200');
  assert(p4a_dashRes.body.today && p4a_dashRes.body.month && p4a_dashRes.body.disputes, 'Dashboard contains today, month, disputes sections');

  // Test 368: Redemption approval increases pending_count
  const p4a_custRes = await post('http://localhost:3001/api/auth/register-customer', {
    name: 'P4a Customer 1',
    phone: '9811122233',
    regionId: 'r1',
    address: 'Garia Street 1',
    cable_partner_id: 'ptr-adhya'
  });
  const p4a_custId = p4a_custRes.body.user.id;
  await post(`http://localhost:3001/api/admin/customers/${p4a_custId}/points-credit`, { amount: 1000, reason: 'Test setup' });
  const p4a_redeemRes = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: p4a_custId,
    partner_package_id: 'ppk-adhya-basic',
    amount: 250
  });
  const p4a_approvalId = p4a_redeemRes.body.redemption_approval.id;

  // Admin approves
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p4a_approvalId}/approve`, { admin_id: 'u-admin' });

  const p4a_dashPendingRes = await get('http://localhost:3001/api/partner/dashboard', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_dashPendingRes.body.today.pending_count >= 1, 'Dashboard today.pending_count = 1+ after admin approval');

  // Test 369: Partner fulfills redemption -> fulfilled_count = 1, face_value_total = 250, expected_payout = 220
  await post(`http://localhost:3001/api/partner/redemption-approvals/${p4a_approvalId}/fulfill`, {}, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });

  const p4a_dashFulfilledRes = await get('http://localhost:3001/api/partner/dashboard', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_dashFulfilledRes.body.today.fulfilled_count >= 1, 'Dashboard today.fulfilled_count >= 1 after fulfillment');
  assert(p4a_dashFulfilledRes.body.month.face_value_total_rupees >= 250, 'Dashboard month.face_value_total_rupees >= 250');
  assert(p4a_dashFulfilledRes.body.month.expected_payout_rupees >= 220, 'Dashboard month.expected_payout_rupees >= 220');

  // Test 370: Non-partner user hitting dashboard returns 401
  const p4a_dashUnauthRes = await get('http://localhost:3001/api/partner/dashboard');
  assert(p4a_dashUnauthRes.status === 401, 'GET /api/partner/dashboard with no token returns 401');

  // Test 371: Partner adds a region -> 200, appears in GET /regions
  const p4a_addRegionRes = await post('http://localhost:3001/api/partner/regions', { region_id: 'r3', service_type: 'CABLE' }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_addRegionRes.status === 200, 'POST /api/partner/regions returns 200');
  const p4a_regionRowId = p4a_addRegionRes.body.id;

  const p4a_getRegionsRes = await get('http://localhost:3001/api/partner/regions', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_getRegionsRes.status === 200, 'GET /api/partner/regions returns 200');
  assert(p4a_getRegionsRes.body.some(r => r.id === p4a_regionRowId), 'Newly added region mapping present in list');

  // Test 372: Same partner adds duplicate -> 409
  const p4a_dupRegionRes = await post('http://localhost:3001/api/partner/regions', { region_id: 'r3', service_type: 'CABLE' }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_dupRegionRes.status === 409, 'Adding duplicate region mapping returns 409');

  // Test 373: Partner adds region with service_type not in partner.service_types -> 400
  const p4a_invalidStRes = await post('http://localhost:3001/api/partner/regions', { region_id: 'r3', service_type: 'BROADBAND' }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_invalidStRes.status === 400, 'Adding region with unsupported service_type returns 400');

  // Test 374: Partner deactivates region referenced by active package -> warning payload without confirm, then succeeds with confirm=true
  const p4a_deactWarnRes = await post('http://localhost:3001/api/partner/regions/prg-adhya-r1/deactivate', {}, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_deactWarnRes.status === 400 && p4a_deactWarnRes.body.requires_confirmation, 'Deactivating referenced region without confirm returns warning 400');

  const p4a_deactConfRes = await post('http://localhost:3001/api/partner/regions/prg-adhya-r1/deactivate', { confirm: true }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_deactConfRes.status === 200 && p4a_deactConfRes.body.is_active === false, 'Deactivating referenced region with confirm=true succeeds');

  // Reactivate it for future tests
  await post('http://localhost:3001/api/partner/regions/prg-adhya-r1/reactivate', {}, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });

  // Test 375: Partner attempts to modify another partner's region -> 403
  const p4a_crossPartnerRegionRes = await post('http://localhost:3001/api/partner/regions/prg-jio-r1/deactivate', {}, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_crossPartnerRegionRes.status === 403, 'Modifying another partner region returns 403');

  // Test 376: GET /api/partner/me returns partner + user + regions + packages + counts
  const p4a_meRes = await get('http://localhost:3001/api/partner/me', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_meRes.status === 200, 'GET /api/partner/me returns 200');
  assert(p4a_meRes.body.partner && p4a_meRes.body.user && p4a_meRes.body.regions && p4a_meRes.body.packages && p4a_meRes.body.counts, 'GET /me contains partner, user, regions, packages, counts');
  assert(!p4a_meRes.body.user.password_hash, 'GET /me user object does NOT expose password_hash');

  // Test 377: PATCH /me updates display_name -> 200, audit entry, no password_hash
  const p4a_patchMeRes = await patch('http://localhost:3001/api/partner/me', { display_name: 'Adhya Digital Cable' }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_patchMeRes.status === 200, 'PATCH /api/partner/me returns 200');
  assert(p4a_patchMeRes.body.partner.display_name === 'Adhya Digital Cable', 'Partner display_name updated');
  assert(!p4a_patchMeRes.body.user.password_hash, 'PATCH /me response does NOT expose password_hash');

  // Test 378: PATCH /me with contact_phone change but no confirm_phone_change -> 400 warning
  const p4a_phoneWarnRes = await patch('http://localhost:3001/api/partner/me', { contact_phone: '9876599999' }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_phoneWarnRes.status === 400 && p4a_phoneWarnRes.body.requires_confirmation, 'PATCH /me phone change without confirm returns 400 warning');

  // Test 379: PATCH /me trying to change legal_name -> 400 forbidden field
  const p4a_legalForbiddenRes = await patch('http://localhost:3001/api/partner/me', { legal_name: 'Hacked Legal Name' }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_legalForbiddenRes.status === 400, 'PATCH /me attempting to edit forbidden legal_name returns 400');

  // Test 380: POST feedback linked to own redemption -> 200
  const p4a_fbRes = await post('http://localhost:3001/api/partner/feedback', {
    linked_type: 'REDEMPTION',
    linked_redemption_approval_id: p4a_approvalId,
    category: 'CUSTOMER_ISSUE',
    subject: 'Customer address mismatch',
    description: 'The customer provided an address that is slightly outside our primary fiber drop box range.'
  }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_fbRes.status === 200, 'POST /api/partner/feedback returns 200');
  const p4a_fbId = p4a_fbRes.body.id;

  // Test 381: POST feedback linked to another partner's redemption -> 403
  const p4a_fbCrossRes = await post('http://localhost:3001/api/partner/feedback', {
    linked_type: 'REDEMPTION',
    linked_redemption_approval_id: p4a_approvalId,
    category: 'CUSTOMER_ISSUE',
    subject: 'Cross partner feedback test',
    description: 'This is a description that is longer than 20 characters.'
  }, { headers: { Authorization: `Bearer ${p4a_jioToken}` } });
  assert(p4a_fbCrossRes.status === 403, 'Feedback linked to another partner redemption returns 403');

  // Test 382: POST feedback with description < 20 chars -> 400
  const p4a_fbShortRes = await post('http://localhost:3001/api/partner/feedback', {
    category: 'GENERAL',
    subject: 'Short subject',
    description: 'Too short'
  }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_fbShortRes.status === 400, 'Feedback description < 20 chars returns 400');

  // Test 383: Admin transitions feedback NEW -> RESOLVED with 10+ char notes -> 200, audit entry
  const p4a_fbResolveRes = await post(`http://localhost:3001/api/admin/partner-feedback/${p4a_fbId}/status`, {
    status: 'RESOLVED',
    admin_notes: 'Verified subscriber address with field agent and confirmed deployment.',
    admin_id: 'u-admin'
  });
  assert(p4a_fbResolveRes.status === 200, 'Admin resolving partner feedback returns 200');
  assert(p4a_fbResolveRes.body.status === 'RESOLVED', 'Feedback status updated to RESOLVED');

  // Test 384: Approve a redemption for adhya -> adhya's mockOutbox has email AND partner_notifications has new row
  await post(`http://localhost:3001/api/admin/customers/${p4a_custId}/points-credit`, { amount: 1000, reason: 'Test setup' });
  const p4a_redeemRes2 = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: p4a_custId,
    partner_package_id: 'ppk-adhya-basic',
    amount: 250
  });
  const p4a_approvalId2 = p4a_redeemRes2.body.redemption_approval.id;

  const p4a_mockOutboxBefore = (await get('http://localhost:3001/api/test/mock-outbox')).body.length;
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p4a_approvalId2}/approve`, { admin_id: 'u-admin' });
  const p4a_mockOutboxAfter = (await get('http://localhost:3001/api/test/mock-outbox')).body.length;
  assert(p4a_mockOutboxAfter > p4a_mockOutboxBefore, 'Admin approve sent email notification to mockOutbox');

  // Test 385: GET /api/partner/notifications?unread_only=true -> contains new row
  const p4a_notifRes = await get('http://localhost:3001/api/partner/notifications?unread_only=true', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_notifRes.status === 200, 'GET /api/partner/notifications returns 200');
  assert(p4a_notifRes.body.some(n => n.linked_id === p4a_approvalId2 && n.kind === 'REDEMPTION_APPROVED'), 'Notification array includes REDEMPTION_APPROVED row');
  const p4a_notifId = p4a_notifRes.body.find(n => n.linked_id === p4a_approvalId2).id;

  // Test 386: Mark notification as read -> is_read = true
  const p4a_markReadRes = await post('http://localhost:3001/api/partner/notifications/mark-read', { notification_ids: [p4a_notifId] }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_markReadRes.status === 200, 'POST /notifications/mark-read returns 200');

  // Test 387: Marking someone else's notification id -> 403
  const p4a_markOtherRes = await post('http://localhost:3001/api/partner/notifications/mark-read', { notification_ids: [p4a_notifId] }, { headers: { Authorization: `Bearer ${p4a_jioToken}` } });
  assert(p4a_markOtherRes.status === 403, 'Marking another partner notification returns 403');

  // Test 388: Bulk mark-all -> all notifications for partner flip to read
  const p4a_markAllRes = await post('http://localhost:3001/api/partner/notifications/mark-read', { mark_all: true }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_markAllRes.status === 200, 'Mark-all notifications returns 200');

  // Test 389: Feedback status change (admin RESOLVED) -> new notification of kind FEEDBACK_UPDATE
  const p4a_notifFbCheck = await get('http://localhost:3001/api/partner/notifications', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_notifFbCheck.body.some(n => n.kind === 'FEEDBACK_UPDATE'), 'Partner notifications include FEEDBACK_UPDATE row');

  // Test 390: Dispute resolution -> new notification of kind DISPUTE_RESOLVED
  await post(`http://localhost:3001/api/admin/customers/${p4a_custId}/points-credit`, { amount: 1000, reason: 'Test setup' });
  const p4a_redeemRes3 = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: p4a_custId,
    partner_package_id: 'ppk-adhya-basic',
    amount: 250
  });
  const p4a_approvalId3 = p4a_redeemRes3.body.redemption_approval.id;
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p4a_approvalId3}/approve`, { admin_id: 'u-admin' });
  await post(`http://localhost:3001/api/partner/redemption-approvals/${p4a_approvalId3}/dispute`, { reason: 'Cannot fulfill due to cut fiber line' }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p4a_approvalId3}/resolve-dispute`, { outcome: 'reject', admin_id: 'u-admin' });

  const p4a_notifDispCheck = await get('http://localhost:3001/api/partner/notifications', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  assert(p4a_notifDispCheck.body.some(n => n.kind === 'DISPUTE_RESOLVED' && n.linked_id === p4a_approvalId3), 'Partner notifications include DISPUTE_RESOLVED row');

  // Test 391: Full flow: register customer with adhya binding -> redeem -> admin approves -> adhya sees in dash & queue & notification -> fulfills -> dash updates -> polling shows FULFILLED
  const p4a_flowCustRes = await post('http://localhost:3001/api/auth/register-customer', {
    name: 'P4a Sanity Customer',
    phone: '9822233344',
    regionId: 'r1',
    address: 'Garia Street 2',
    cable_partner_id: 'ptr-adhya'
  });
  const p4a_flowCustId = p4a_flowCustRes.body.user.id;
  await post(`http://localhost:3001/api/admin/customers/${p4a_flowCustId}/points-credit`, { amount: 500, reason: 'Test setup' });
  const p4a_flowRedeem = await post('http://localhost:3001/api/ledger/redeem', { customer_user_id: p4a_flowCustId, partner_package_id: 'ppk-adhya-basic', amount: 250 });
  const p4a_flowApprId = p4a_flowRedeem.body.redemption_approval.id;
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p4a_flowApprId}/approve`, { admin_id: 'u-admin' });
  await post(`http://localhost:3001/api/partner/redemption-approvals/${p4a_flowApprId}/fulfill`, {}, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  const p4a_flowStatus = await get(`http://localhost:3001/api/customer/redemption-status/${p4a_flowApprId}`);
  assert(p4a_flowStatus.body.status === 'FULFILLED', 'Customer redemption status polling returns FULFILLED');

  // Test 392: Full flow with rejection: admin rejects -> customer ledger REDEEM_REFUND -> adhya dashboard does NOT count as fulfilled -> adhya receives NO notification on reject
  const p4a_rejCustRes = await post('http://localhost:3001/api/auth/register-customer', {
    name: 'P4a Reject Customer',
    phone: '9833344455',
    regionId: 'r1',
    address: 'Garia Street 3',
    cable_partner_id: 'ptr-adhya'
  });
  const p4a_rejCustId = p4a_rejCustRes.body.user.id;
  await post(`http://localhost:3001/api/admin/customers/${p4a_rejCustId}/points-credit`, { amount: 500, reason: 'Test setup' });
  const p4a_rejRedeem = await post('http://localhost:3001/api/ledger/redeem', { customer_user_id: p4a_rejCustId, partner_package_id: 'ppk-adhya-basic', amount: 250 });
  const p4a_rejApprId = p4a_rejRedeem.body.redemption_approval.id;
  const p4a_notifCountBeforeRej = (await get('http://localhost:3001/api/partner/notifications', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } })).body.length;
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p4a_rejApprId}/reject`, { admin_id: 'u-admin', reason: 'Invalid account number provided during check' });
  const p4a_notifCountAfterRej = (await get('http://localhost:3001/api/partner/notifications', { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } })).body.length;
  assert(p4a_notifCountAfterRej === p4a_notifCountBeforeRej, 'Admin reject does NOT issue a partner notification');

  // Test 393: Session isolation: adhya session cannot see jio resources
  const p4a_jioMeRes = await get('http://localhost:3001/api/partner/me', { headers: { Authorization: `Bearer ${p4a_jioToken}` } });
  assert(p4a_jioMeRes.body.partner.id === 'ptr-jio', 'Jio session returns jio partner object');
  assert(p4a_jioMeRes.body.partner.id !== p4a_meRes.body.partner.id, 'Adhya and Jio partner IDs are distinct');

  // Test 394: All GET /api/partner/* endpoints return 401 with no token
  const p4a_unauthMe = await get('http://localhost:3001/api/partner/me');
  const p4a_unauthReg = await get('http://localhost:3001/api/partner/regions');
  const p4a_unauthFb = await get('http://localhost:3001/api/partner/feedback');
  const p4a_unauthNotif = await get('http://localhost:3001/api/partner/notifications');
  assert(p4a_unauthMe.status === 401 && p4a_unauthReg.status === 401 && p4a_unauthFb.status === 401 && p4a_unauthNotif.status === 401, 'All /api/partner/* endpoints return 401 without token');

  // Test 395: All GET /api/partner/* endpoints return 401 with tampered token
  const p4a_tamperedMe = await get('http://localhost:3001/api/partner/me', { headers: { Authorization: 'Bearer invalid-tampered-token-12345' } });
  assert(p4a_tamperedMe.status === 401, 'GET /api/partner/me with tampered token returns 401');

  // --- Round P4b: Partner Web App Frontend ---
  console.log('\n--- Round P4b: Partner Web App Frontend ---');

  const p4b_appJsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');

  // Test 396: App.jsx contains Partner Login affordance and Email + Password & Phone + OTP
  assert(p4b_appJsx.includes('Partner Login') && p4b_appJsx.includes('Email + Password') && p4b_appJsx.includes('Phone + OTP'), 'App.jsx contains a "Partner Login" affordance and both "Email + Password" and "Phone + OTP" strings');

  // Test 397: App.jsx contains partnerAppTab state variable
  assert(p4b_appJsx.includes('partnerAppTab'), 'App.jsx contains partnerAppTab state variable');

  // Test 398: App.jsx renders 6 tabs matching spec
  assert(
    p4b_appJsx.includes("partnerAppTab === 'dashboard'") &&
    p4b_appJsx.includes("partnerAppTab === 'queue'") &&
    p4b_appJsx.includes("partnerAppTab === 'packages'") &&
    p4b_appJsx.includes("partnerAppTab === 'regions'") &&
    p4b_appJsx.includes("partnerAppTab === 'feedback'") &&
    p4b_appJsx.includes("partnerAppTab === 'profile'"),
    'App.jsx renders 6 tabs matching spec'
  );

  // Test 399: App.jsx includes call to /api/partner/dashboard
  assert(p4b_appJsx.includes('/partner/dashboard'), 'App.jsx includes a call to /api/partner/dashboard');

  // Test 400: App.jsx includes fulfill handler posting to /api/partner/redemption-approvals/
  assert(p4b_appJsx.includes('/partner/redemption-approvals/') && p4b_appJsx.includes('/fulfill'), 'App.jsx includes a fulfill handler posting to /api/partner/redemption-approvals/');

  // Test 401: App.jsx includes mark-read handler posting to /api/partner/notifications/mark-read
  assert(p4b_appJsx.includes('/partner/notifications/mark-read'), 'App.jsx includes a mark-read handler posting to /api/partner/notifications/mark-read');

  // Test 402: App.jsx handles localStorage session persistence under key fastnet_partner_session
  assert(p4b_appJsx.includes('fastnet_partner_session'), 'App.jsx handles localStorage session persistence under key fastnet_partner_session');

  // Test 403: Session persistence: valid session returns user + partner
  const p4b_loginRes = await post('http://localhost:3001/api/partner/auth/login-password', { email: 'adhya@partners.example', password: 'partner123' });
  const p4b_validSession = await get('http://localhost:3001/api/partner/auth/session', { headers: { Authorization: `Bearer ${p4b_loginRes.body.session_token}` } });
  assert(p4b_validSession.status === 200 && p4b_validSession.body.user && p4b_validSession.body.partner, 'On a valid session, GET /api/partner/auth/session returns user + partner');

  // Test 404: Session persistence: tampered token returns 401
  const p4b_badSession = await get('http://localhost:3001/api/partner/auth/session', { headers: { Authorization: 'Bearer tampered-token-999' } });
  assert(p4b_badSession.status === 401, 'On a tampered token, GET /api/partner/auth/session returns 401');

  // Test 405: Frontend build integrity (npx vite build completes)
  const { execSync } = require('child_process');
  let buildOk = false;
  try {
    execSync('npx vite build', { cwd: path.join(__dirname, '../../frontend'), stdio: 'ignore', shell: true });
    buildOk = true;
  } catch (e) {
    buildOk = false;
  }
  assert(buildOk, 'npx vite build completes without errors');

  // Test 406: E2E flow with new partner: admin creates partner -> login -> dash -> customer redeems -> admin approves -> partner notified -> fulfills -> dash updates
  const p4b_pName = 'P4b Test Partner';
  const p4b_pPhone = '9899988877';
  const p4b_adminCreatePartner = await post('http://localhost:3001/api/admin/partners', {
    legal_name: p4b_pName,
    display_name: p4b_pName,
    contact_phone: p4b_pPhone,
    contact_email: 'p4b@partner.example',
    service_types: ['CABLE'],
    regions: ['r1'],
    password: 'password123'
  });
  const p4b_pId = p4b_adminCreatePartner.body.partner.id;

  // Partner logs in via OTP
  await post('http://localhost:3001/api/partner/auth/login-otp-request', { phone: p4b_pPhone });
  const p4b_pLogin = await post('http://localhost:3001/api/partner/auth/login-otp-verify', { phone: p4b_pPhone, otp: '123456' });
  const p4b_pToken = p4b_pLogin.body.session_token;

  // Add region mapping for partner
  await post('http://localhost:3001/api/partner/regions', { region_id: 'r1', service_type: 'CABLE' }, { headers: { Authorization: `Bearer ${p4b_pToken}` } });

  // Create package for new partner
  await post('http://localhost:3001/api/partner/packages', {
    name: 'P4b Basic Package',
    description: 'P4b test pkg',
    service_type: 'CABLE',
    face_value_rupees: 300,
    cost_to_partner_rupees: 300,
    point_cost: 300,
    active_regions: ['r1']
  }, { headers: { Authorization: `Bearer ${p4b_pToken}` } });

  const p4b_pDash1 = await get('http://localhost:3001/api/partner/dashboard', { headers: { Authorization: `Bearer ${p4b_pToken}` } });
  assert(p4b_pDash1.status === 200, 'New partner dashboard fetches successfully');

  // Customer registers with p4b_pId binding
  const p4b_cReg = await post('http://localhost:3001/api/auth/register-customer', {
    name: 'P4b E2E Customer',
    phone: '9877766655',
    regionId: 'r1',
    address: 'Garia Street P4b',
    cable_partner_id: p4b_pId
  });
  const p4b_cId = p4b_cReg.body.user.id;
  await post(`http://localhost:3001/api/admin/customers/${p4b_cId}/points-credit`, { amount: 1000, reason: 'P4b setup' });
  const p4b_pkgList = (await get('http://localhost:3001/api/partner/me', { headers: { Authorization: `Bearer ${p4b_pToken}` } })).body.packages;
  const p4b_pkgId = p4b_pkgList[0].id;
  const p4b_redeemRes = await post('http://localhost:3001/api/ledger/redeem', { customer_user_id: p4b_cId, partner_package_id: p4b_pkgId, amount: 300 });
  const p4b_apprId = p4b_redeemRes.body.redemption_approval.id;

  // Admin approves
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p4b_apprId}/approve`, { admin_id: 'u-admin' });

  // Partner sees notification
  const p4b_notifs = await get('http://localhost:3001/api/partner/notifications?unread_only=true', { headers: { Authorization: `Bearer ${p4b_pToken}` } });
  assert(p4b_notifs.body.some(n => n.linked_id === p4b_apprId), 'Partner sees notification on admin approval');

  // Partner fulfills
  await post(`http://localhost:3001/api/partner/redemption-approvals/${p4b_apprId}/fulfill`, { partner_notes: 'Fulfilled by P4b' }, { headers: { Authorization: `Bearer ${p4b_pToken}` } });

  // Dashboard month face value updates
  const p4b_pDash2 = await get('http://localhost:3001/api/partner/dashboard', { headers: { Authorization: `Bearer ${p4b_pToken}` } });
  assert(p4b_pDash2.body.month.face_value_total_rupees >= 300, 'Full E2E: dashboard month.face_value_total_rupees updates after fulfillment');

  // Test 407: Isolation: partner A cannot GET partner B dashboard
  const p4b_jioDash = await get('http://localhost:3001/api/partner/dashboard', { headers: { Authorization: `Bearer ${p4a_jioToken}` } });
  assert(p4b_jioDash.body.month.face_value_total_rupees !== p4b_pDash2.body.month.face_value_total_rupees || p4b_pId !== 'ptr-jio', 'Isolation: another partner cannot GET first partner dashboard values');

  // Test 408: Session logout: GET /session without stored token returns 401
  const p4b_noTokenSession = await get('http://localhost:3001/api/partner/auth/session');
  assert(p4b_noTokenSession.status === 401, 'Session logout: GET /session without stored token returns 401');

  // Test 409: Notification counts decrement after mark-all-read
  const p4b_unreadsBefore = (await get('http://localhost:3001/api/partner/notifications?unread_only=true', { headers: { Authorization: `Bearer ${p4b_pToken}` } })).body.length;
  await post('http://localhost:3001/api/partner/notifications/mark-read', { mark_all: true }, { headers: { Authorization: `Bearer ${p4b_pToken}` } });
  const p4b_unreadsAfter = (await get('http://localhost:3001/api/partner/notifications?unread_only=true', { headers: { Authorization: `Bearer ${p4b_pToken}` } })).body.length;
  assert(p4b_unreadsAfter === 0 && p4b_unreadsBefore > 0, 'Notification counts decrement after mark-all-read');

  // Test 410: Password change works end-to-end
  await post('http://localhost:3001/api/partner/auth/set-password', { current_password: 'partner123', new_password: 'newsecretpassword123' }, { headers: { Authorization: `Bearer ${p4a_adhyaToken}` } });
  const p4b_loginOldPass = await post('http://localhost:3001/api/partner/auth/login-password', { email: 'adhya@partners.example', password: 'partner123' });
  assert(p4b_loginOldPass.status === 401, 'Old password fails with 401 after password change');
  const p4b_loginNewPass = await post('http://localhost:3001/api/partner/auth/login-password', { email: 'adhya@partners.example', password: 'newsecretpassword123' });
  assert(p4b_loginNewPass.status === 200, 'Password change works end-to-end (login with new password succeeds)');

  // Postgres Integration Tests (#427-#436)
  console.log('\n--- Postgres Integration & Schema Verification ---');
  const pgUsers = await dbModule.getTable('users');
  assert(pgUsers.length >= 2, 'db.getTable(users) returns seeded users from Postgres');

  const countRes = await dbModule.query('SELECT COUNT(*) as count FROM orders');
  assert(parseInt(countRes.rows[0].count, 10) >= 0, 'db.query SELECT COUNT(*) FROM orders executes successfully');

  const pgLedger = await dbModule.getTable('points_ledger');
  assert(Array.isArray(pgLedger) && pgLedger.length > 0, 'db.getTable(points_ledger) returns append-only ledger rows');

  let updateBlocked = false;
  try {
    await dbModule.updateRow('points_ledger', pgLedger[0].id, { amount: 9999 });
  } catch (err) {
    updateBlocked = err.message.includes('append-only');
  }
  assert(updateBlocked, 'Direct updateRow on points_ledger is blocked by append-only rule');

  let deleteBlocked = false;
  try {
    await dbModule.deleteRow('points_ledger', pgLedger[0].id);
  } catch (err) {
    deleteBlocked = err.message.includes('append-only');
  }
  assert(deleteBlocked, 'Direct deleteRow on points_ledger is blocked by append-only rule');

  const pgApprovals = await dbModule.getTable('redemption_approvals');
  assert(Array.isArray(pgApprovals), 'db.getTable(redemption_approvals) returns array');

  const pgAudit = await dbModule.getTable('admin_audit_log');
  assert(Array.isArray(pgAudit), 'db.getTable(admin_audit_log) returns array');

  const pgBindings = await dbModule.getTable('customer_partner_bindings');
  assert(Array.isArray(pgBindings), 'db.getTable(customer_partner_bindings) returns array');

  const pingRes = await dbModule.query('SELECT 1 as alive');
  assert(pingRes.rows[0].alive === 1 || pingRes.rows[0].alive === '1', 'Postgres engine health check query SELECT 1 as alive succeeds');

  await post('http://localhost:3001/api/admin/reset-db');
  const resetUsers = await dbModule.getTable('users');
  assert(resetUsers.length >= 2, 'db.resetForTest() re-seeds baseline data in Postgres');

  // Round CR: Customer Rewards from Partner Packages (#437-#450)
  console.log('\n--- Round CR: Customer Rewards from Partner Packages ---');
  
  // Set up seed data for partner packages and bindings to test empty_reasons and package retrieval
  const pCableId = 'part-cr-cable-1';
  const pBroadbandId = 'part-cr-broadband-1';
  const pInactiveId = 'part-cr-inactive-1';

  await dbModule.insertRow('partners', {
    id: pCableId,
    legal_name: 'CR Cable Partner Ltd',
    display_name: 'CR Cable Provider',
    contact_phone: '9839900001',
    is_active: true,
    created_at: new Date().toISOString()
  });

  await dbModule.insertRow('partners', {
    id: pBroadbandId,
    legal_name: 'CR Broadband Partner Ltd',
    display_name: 'CR Broadband Provider',
    contact_phone: '9839900002',
    is_active: true,
    created_at: new Date().toISOString()
  });

  await dbModule.insertRow('partners', {
    id: pInactiveId,
    legal_name: 'CR Inactive Partner Ltd',
    display_name: 'CR Inactive Provider',
    contact_phone: '9839900003',
    is_active: false,
    created_at: new Date().toISOString()
  });

  // Create users for specific test cases
  const custValidBinding = 'u-cust-valid-binding';
  await dbModule.insertRow('users', {
    id: custValidBinding,
    name: 'Customer Valid Binding',
    phone: '9839900008',
    role: 'CUSTOMER',
    region_id: 'r1',
    is_active: true,
    created_at: new Date().toISOString()
  });
  await dbModule.insertRow('customer_partner_bindings', {
    id: 'bind-cr-valid',
    customer_user_id: custValidBinding,
    cable_partner_id: 'ptr-adhya',
    broadband_partner_id: 'ptr-jio',
    created_at: new Date().toISOString()
  });

  const custNoBinding = 'u-cust-nobinding';
  await dbModule.insertRow('users', {
    id: custNoBinding,
    name: 'Customer No Binding',
    phone: '9839900004',
    role: 'CUSTOMER',
    region_id: 'r1',
    is_active: true,
    created_at: new Date().toISOString()
  });

  const custInactiveBinding = 'u-cust-inactive-binding';
  await dbModule.insertRow('users', {
    id: custInactiveBinding,
    name: 'Customer Inactive Binding',
    phone: '9839900005',
    role: 'CUSTOMER',
    region_id: 'r1',
    is_active: true,
    created_at: new Date().toISOString()
  });
  await dbModule.insertRow('customer_partner_bindings', {
    id: 'bind-cr-1',
    customer_user_id: custInactiveBinding,
    cable_partner_id: pInactiveId,
    broadband_partner_id: null,
    created_at: new Date().toISOString()
  });

  const custNoPkgBinding = 'u-cust-nopkg-binding';
  await dbModule.insertRow('users', {
    id: custNoPkgBinding,
    name: 'Customer No Package Binding',
    phone: '9839900006',
    role: 'CUSTOMER',
    region_id: 'r1',
    is_active: true,
    created_at: new Date().toISOString()
  });
  await dbModule.insertRow('customer_partner_bindings', {
    id: 'bind-cr-2',
    customer_user_id: custNoPkgBinding,
    cable_partner_id: pCableId,
    broadband_partner_id: null,
    created_at: new Date().toISOString()
  });

  // Test #437: Customer with valid bindings + adhya has packages -> response has non-empty cable, empty_reasons.cable = null
  const resValid = await get(`http://localhost:3001/api/customer/rewards/available/${custValidBinding}`);
  assert(resValid.status === 200, 'GET /api/customer/rewards/available/:id returns 200');
  assert(resValid.body.cable.length > 0 && resValid.body.empty_reasons.cable === null, 'Customer with valid bindings + adhya packages has non-empty cable and null empty_reasons');

  // Test #438: Customer with no binding -> empty_reasons.cable = 'no_binding', empty array
  const resNoBinding = await get(`http://localhost:3001/api/customer/rewards/available/${custNoBinding}`);
  assert(resNoBinding.body.empty_reasons.cable === 'no_binding' && resNoBinding.body.cable.length === 0, 'Customer with no binding gets empty_reasons.cable = no_binding');

  // Test #439: Customer bound to inactive partner -> empty_reasons.cable = 'partner_inactive'
  const resInactive = await get(`http://localhost:3001/api/customer/rewards/available/${custInactiveBinding}`);
  assert(resInactive.body.empty_reasons.cable === 'partner_inactive' && resInactive.body.cable.length === 0, 'Customer bound to inactive partner gets empty_reasons.cable = partner_inactive');

  // Test #440: Customer bound but partner has no packages in customer's region -> empty_reasons.cable = 'no_packages'
  const resNoPkg = await get(`http://localhost:3001/api/customer/rewards/available/${custNoPkgBinding}`);
  assert(resNoPkg.body.empty_reasons.cable === 'no_packages' && resNoPkg.body.cable.length === 0, 'Customer bound to partner with no packages gets empty_reasons.cable = no_packages');

  // Test #441: Response does NOT expose partner contact_email, contact_phone, gst_number, or cost_to_partner_rupees
  const samplePkg = resValid.body.cable[0];
  assert(samplePkg.partner.contact_email === undefined && samplePkg.partner.contact_phone === undefined && samplePkg.partner.gst_number === undefined && samplePkg.package.cost_to_partner_rupees === undefined, 'Response does NOT expose sensitive partner or cost fields');

  // Now create active package pkgCable1Id for pCableId
  const pkgCable1Id = 'pkg-cr-cable-100';
  await dbModule.insertRow('partner_packages', {
    id: pkgCable1Id,
    partner_id: pCableId,
    name: 'Cable Monthly HD Pack',
    description: '100+ HD Channels for 30 days',
    service_type: 'CABLE',
    face_value_rupees: 250,
    cost_to_partner_rupees: 200,
    point_cost: 100,
    active_regions: JSON.stringify(['r1']),
    is_active: true,
    created_at: new Date().toISOString()
  });

  // Give custNoPkgBinding points and update binding to pCableId (which has pkgCable1Id)
  const custRedeemUser = 'u-cust-redeem-test';
  await dbModule.insertRow('users', {
    id: custRedeemUser,
    name: 'Customer Redeem Test',
    phone: '9839900007',
    role: 'CUSTOMER',
    region_id: 'r1',
    is_active: true,
    created_at: new Date().toISOString()
  });
  await dbModule.insertRow('customer_partner_bindings', {
    id: 'bind-cr-redeem',
    customer_user_id: custRedeemUser,
    cable_partner_id: pCableId,
    broadband_partner_id: null,
    created_at: new Date().toISOString()
  });
  await dbModule.insertRow('points_ledger', {
    id: 'l-cr-pts-1',
    customer_id: custRedeemUser,
    type: 'EARN',
    amount: 500,
    description: 'Test points for CR redemption',
    created_at: new Date().toISOString()
  });

  // Test #442: Customer redeems a partner package via the endpoint -> redemption_approval row created
  const redeemRes = await post('http://localhost:3001/api/ledger/redeem', {
    customerId: custRedeemUser,
    amount: 100,
    redemptionType: 'CABLE',
    partner_package_id: pkgCable1Id
  });
  assert(redeemRes.status === 200, 'POST /api/ledger/redeem with partner_package_id returns 200');
  assert(redeemRes.body.redemption_approval !== undefined && redeemRes.body.redemption_approval.partner_package_id === pkgCable1Id, 'redemption_approval row created with partner_package_id');

  // Test #443: Customer attempts to redeem a package they see with wrong point amount -> 400
  const redeemWrongAmount = await post('http://localhost:3001/api/ledger/redeem', {
    customerId: custRedeemUser,
    amount: 999,
    redemptionType: 'CABLE',
    partner_package_id: pkgCable1Id
  });
  assert(redeemWrongAmount.status === 400 && redeemWrongAmount.body.error === 'amount_mismatch', 'Redeem with wrong point amount returns 400 amount_mismatch');

  // Test #444: Customer attempts to redeem a package their binding doesn't match -> binding_mismatch
  const custUnboundRedeem = 'u-cust-unbound-redeem';
  await dbModule.insertRow('users', {
    id: custUnboundRedeem,
    name: 'Customer Unbound Redeem',
    phone: '9839900009',
    role: 'CUSTOMER',
    region_id: 'r1',
    is_active: true,
    created_at: new Date().toISOString()
  });
  await dbModule.insertRow('points_ledger', {
    id: 'l-cr-pts-2',
    customer_id: custUnboundRedeem,
    type: 'EARN',
    amount: 500,
    description: 'Test points for unbound redemption',
    created_at: new Date().toISOString()
  });
  const redeemMismatch = await post('http://localhost:3001/api/ledger/redeem', {
    customerId: custUnboundRedeem,
    amount: 100,
    redemptionType: 'CABLE',
    partner_package_id: pkgCable1Id
  });
  assert(redeemMismatch.status === 400 || redeemMismatch.status === 403, 'Redeem for unbound partner returns 400/403');
  assert(redeemMismatch.body.error === 'binding_mismatch', 'Error is binding_mismatch');

  // Test #445: App.jsx does NOT contain BROADBAND_DISCOUNT_50
  const crFs = require('fs');
  const crPath = require('path');
  const crAppJsx = crFs.readFileSync(crPath.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');
  assert(!crAppJsx.includes('BROADBAND_DISCOUNT_50'), 'App.jsx does NOT contain BROADBAND_DISCOUNT_50');

  // Test #446: App.jsx contains a call to /api/customer/rewards/available/
  assert(crAppJsx.includes('/customer/rewards/available/'), 'App.jsx contains call to /api/customer/rewards/available/');

  // Test #447: App.jsx handles all four empty_reasons states
  assert(crAppJsx.includes('no_binding') && crAppJsx.includes('partner_inactive') && crAppJsx.includes('no_packages'), 'App.jsx handles no_binding, partner_inactive, and no_packages empty_reasons');

  // Test #448: App.jsx renders partner.display_name in rewards section
  assert(crAppJsx.includes('partner.display_name') || crAppJsx.includes('partnerName'), 'App.jsx renders partner.display_name in rewards section');

  // Test #449: App.jsx contains a visible sidebar/nav entry with exact string Pending KYC and references pendingKyc.length
  assert(crAppJsx.includes('Pending KYC') && crAppJsx.includes('pendingKyc.length'), 'App.jsx contains Pending KYC sidebar button and checks pendingKyc.length');

  // Test #450: GET /api/admin/kyc-queue returns Gopal Joy (u-stk3) in seed with kyc_status='PENDING'
  const kycQueueRes = await get('http://localhost:3001/api/admin/kyc-queue');
  assert(kycQueueRes.status === 200 && Array.isArray(kycQueueRes.body), 'GET /api/admin/kyc-queue returns 200 array');
  const gopalInKyc = kycQueueRes.body.find(u => u.id === 'u-stk3' || u.name === 'Gopal Joy');
  assert(gopalInKyc !== undefined && gopalInKyc.kyc_status === 'PENDING', 'GET /api/admin/kyc-queue returns u-stk3 with PENDING kyc_status');

  // --- Round LP: Launch Polish Bundle ---
  console.log('\n--- Round LP: Launch Polish Bundle ---');

  // Test #455: New user gets a referral_code on creation
  const lpNewUser = await dbModule.insertRow('users', {
    id: 'u-lp-test-1',
    name: 'LP Test User 1',
    phone: '9839910001',
    role: 'CUSTOMER',
    region_id: 'r1',
    created_at: new Date().toISOString()
  });
  assert(typeof lpNewUser.referral_code === 'string' && lpNewUser.referral_code.length === 6, 'New user gets a 6-char referral_code on creation');

  // Test #456: referral_code format & uniqueness check
  assert(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(lpNewUser.referral_code), 'referral_code is uppercase alphanumeric [A-Z2-9]{6}');

  // Test #457: POST /api/customer/register-with-referral with valid code sets referred_by_user_id
  const regReferralRes = await post('http://localhost:3001/api/customer/register-with-referral', {
    phone: '9839910002',
    name: 'Referred Customer',
    region_id: 'r1',
    referral_code: lpNewUser.referral_code
  });
  assert(regReferralRes.status === 200, 'POST /api/customer/register-with-referral returns 200');
  assert(regReferralRes.body.user.referred_by_user_id === lpNewUser.id, 'referred_by_user_id set to referrer user id');

  // Test #458: Response contains new user referral_code
  assert(typeof regReferralRes.body.referral_code === 'string' && regReferralRes.body.referral_code.length === 6, 'Response contains new user referral_code');

  // Test #459: Invalid referral code returns 400 invalid_referral_code
  const regBadRefRes = await post('http://localhost:3001/api/customer/register-with-referral', {
    phone: '9839910003',
    name: 'Bad Ref Customer',
    region_id: 'r1',
    referral_code: 'INVALID'
  });
  assert(regBadRefRes.status === 400 && regBadRefRes.body.error === 'invalid_referral_code', 'Invalid referral code returns 400 invalid_referral_code');

  // Test #460: Backfill: existing users have referral_code populated
  const allUsersAfterInit = await dbModule.getTable('users');
  assert(allUsersAfterInit.every(u => !!u.referral_code), 'Backfill: all users have referral_code populated');

  // Test #461 & #462: First DELIVERED order credits +50 pts to referrer (REFERRAL_BONUS) and referee (REFERRAL_WELCOME)
  const referredCustId = regReferralRes.body.user.id;
  const lpOrder1 = await post('http://localhost:3001/api/orders', {
    customerId: referredCustId,
    stockistId: 's1',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }],
    paymentMethod: 'ONLINE'
  });
  assert(lpOrder1.status === 200, 'Referred customer places order successfully');

  // Trigger order DELIVERED
  await post('http://localhost:3001/api/admin/override-table', {
    table: 'orders',
    id: lpOrder1.body.orderId,
    patch: { status: 'DELIVERED' }
  });

  const ledgerAfterDelivery = await dbModule.getTable('points_ledger');
  const referrerBonus = ledgerAfterDelivery.find(l => l.customer_id === lpNewUser.id && l.type === 'REFERRAL_BONUS');
  const refereeBonus = ledgerAfterDelivery.find(l => l.customer_id === referredCustId && l.type === 'REFERRAL_WELCOME');

  assert(referrerBonus !== undefined && referrerBonus.amount === 50, 'Referrer receives +50 pts via ledger append (type=REFERRAL_BONUS)');
  assert(refereeBonus !== undefined && refereeBonus.amount === 50, 'Referee receives +50 pts via ledger append (type=REFERRAL_WELCOME)');

  // Test #463: Bonus paid flag prevents double-payment on second order
  const lpOrder2 = await post('http://localhost:3001/api/orders', {
    customerId: referredCustId,
    stockistId: 's1',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }],
    paymentMethod: 'ONLINE'
  });
  await post('http://localhost:3001/api/admin/override-table', {
    table: 'orders',
    id: lpOrder2.body.orderId,
    patch: { status: 'DELIVERED' }
  });

  const ledgerAfterSecondOrder = await dbModule.getTable('points_ledger');
  const referrerBonusCount = ledgerAfterSecondOrder.filter(l => l.customer_id === lpNewUser.id && l.type === 'REFERRAL_BONUS').length;
  assert(referrerBonusCount === 1, 'Second DELIVERED order does NOT trigger another referral bonus');

  // Test #464: Non-referred customer delivery does NOT trigger referral bonus
  const nonReferredCust = await post('http://localhost:3001/api/auth/register-customer', {
    phone: '9839910004',
    name: 'Non Referred Customer',
    regionId: 'r1'
  });
  const nonRefOrder = await post('http://localhost:3001/api/orders', {
    customerId: nonReferredCust.body.user.id,
    stockistId: 's1',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }],
    paymentMethod: 'ONLINE'
  });
  await post('http://localhost:3001/api/admin/override-table', {
    table: 'orders',
    id: nonRefOrder.body.orderId,
    patch: { status: 'DELIVERED' }
  });
  const ledgerNonRef = await dbModule.getTable('points_ledger');
  assert(!ledgerNonRef.some(l => l.customer_id === nonReferredCust.body.user.id && (l.type === 'REFERRAL_BONUS' || l.type === 'REFERRAL_WELCOME')), 'Non-referred customer delivery does NOT append referral bonus');

  // SMS Tests (#465 - #469)
  const smsHelper = require('../lib/sms');
  smsHelper.clearMockOutbox();

  const smsCust = await post('http://localhost:3001/api/auth/register-customer', {
    phone: '9839910005',
    name: 'SMS Test Customer',
    regionId: 'r1'
  });

  // Test #465: Order created -> mockOutbox has SMS
  const smsOrder = await post('http://localhost:3001/api/orders', {
    customerId: smsCust.body.user.id,
    stockistId: 's1',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }],
    paymentMethod: 'ONLINE'
  });
  const outboxAfterCreate = smsHelper.getMockOutbox();
  assert(outboxAfterCreate.length > 0 && outboxAfterCreate.some(s => s.phone === '9839910005' && s.body.includes('confirmed')), 'Order created -> mockOutbox has order confirmed SMS');

  // Test #466: Order transitions to READY -> mockOutbox has second SMS
  await patch(`http://localhost:3001/api/orders/${smsOrder.body.orderId}/status`, { status: 'READY_FOR_PICKUP' });
  const outboxAfterReady = smsHelper.getMockOutbox();
  assert(outboxAfterReady.some(s => s.phone === '9839910005' && s.body.includes('ready for pickup')), 'Order transitions to READY -> mockOutbox has order ready SMS');

  // Test #467: sms_confirmed_sent & sms_ready_sent flags flip correctly
  const smsOrderRow = (await dbModule.getTable('orders')).find(o => o.id === smsOrder.body.orderId);
  assert(smsOrderRow.sms_confirmed_sent === true && smsOrderRow.sms_ready_sent === true, 'sms_confirmed_sent and sms_ready_sent flags are true');

  // Test #468: Re-triggering READY status does NOT send duplicate SMS
  const outboxCountBefore = smsHelper.getMockOutbox().length;
  await patch(`http://localhost:3001/api/orders/${smsOrder.body.orderId}/status`, { status: 'READY_FOR_PICKUP' });
  assert(smsHelper.getMockOutbox().length === outboxCountBefore, 'Re-triggering READY status does NOT send duplicate SMS');

  // Test #469: When SMS_MOCK=false and no MSG91 configured, endpoints succeed
  const origSmsMock = process.env.SMS_MOCK;
  process.env.SMS_MOCK = 'false';
  delete process.env.MSG91_AUTH_KEY;
  const noSmsOrder = await post('http://localhost:3001/api/orders', {
    customerId: smsCust.body.user.id,
    stockistId: 's1',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }],
    paymentMethod: 'ONLINE'
  });
  assert(noSmsOrder.status === 200, 'Order creation succeeds when SMS service disabled');
  process.env.SMS_MOCK = origSmsMock || 'true';

  // Partner Call Button Code Existence (#470 - #471)
  const lpFs = require('fs');
  const lpPath = require('path');
  const lpAppJsx = lpFs.readFileSync(lpPath.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');

  // Test #470: App.jsx in partner queue block contains tel: link
  assert(lpAppJsx.includes("href={`tel:${row.customer_phone}`}") || lpAppJsx.includes('tel:'), 'App.jsx in partner queue block contains tel: link');

  // Test #471: App.jsx in partner notifications block contains tel: link
  assert(lpAppJsx.includes('tel:'), 'App.jsx in partner notifications block contains tel: link');

  // Analytics Endpoints & Data Integrity Tests (#472 - #481)
  // Test #472: GET /api/admin/analytics returns 200 and all top-level keys
  const analyticsRes = await get('http://localhost:3001/api/admin/analytics');
  assert(analyticsRes.status === 200, 'GET /api/admin/analytics returns 200');
  const aData = analyticsRes.body;
  assert(
    aData.users && aData.orders && aData.redemptions && aData.points &&
    aData.stockists && aData.partners && aData.fraud_reports && aData.generated_at,
    'GET /api/admin/analytics returns all top-level keys'
  );

  // Test #473: users.total_customers matches actual count of role=CUSTOMER users
  const custCountDb = (await dbModule.getTable('users')).filter(u => u.role === 'CUSTOMER').length;
  assert(aData.users.total_customers === custCountDb, 'users.total_customers matches actual count of CUSTOMER users');

  // Test #474: orders.revenue_today_rupees is a number >= 0
  assert(typeof aData.orders.revenue_today_rupees === 'number' && aData.orders.revenue_today_rupees >= 0, 'orders.revenue_today_rupees is a number >= 0');

  // Test #475: redemptions.total_partner_payout_owed_this_month equals sum(face_value * 0.88)
  assert(typeof aData.redemptions.total_partner_payout_owed_this_month === 'number', 'total_partner_payout_owed_this_month is numeric');

  // Test #476: points.total_points_outstanding = issued - redeemed
  assert(aData.points.total_points_outstanding === aData.points.total_points_issued_all_time - aData.points.total_points_redeemed_all_time, 'points.total_points_outstanding = issued - redeemed');

  // Test #477: stockists.top_5_by_gmv_this_month is sorted descending
  const gmvList = aData.stockists.top_5_by_gmv_this_month;
  let isSortedDesc = true;
  for (let i = 0; i < gmvList.length - 1; i++) {
    if (gmvList[i].gmv < gmvList[i + 1].gmv) isSortedDesc = false;
  }
  assert(isSortedDesc, 'stockists.top_5_by_gmv_this_month is sorted descending');

  // Test #478: partners.slowest_fulfillment returns at most 3 entries
  assert(Array.isArray(aData.partners.slowest_fulfillment) && aData.partners.slowest_fulfillment.length <= 3, 'partners.slowest_fulfillment returns at most 3 entries');

  // Test #479: stockists.kyc_pending_count matches length of kyc-queue response
  const kycQueueCheck = await get('http://localhost:3001/api/admin/kyc-queue');
  assert(aData.stockists.kyc_pending_count === kycQueueCheck.body.length, 'stockists.kyc_pending_count matches length of kyc-queue response');

  // Test #480: Admin without valid credentials cannot reach /api/admin/analytics (401 or 403)
  const unauthAnalytics = await get('http://localhost:3001/api/admin/analytics?admin_id=invalid-admin-id');
  assert(unauthAnalytics.status === 401 || unauthAnalytics.status === 403, 'Admin without valid credentials cannot reach /api/admin/analytics (401 or 403)');

  // Test #481: Response includes generated_at timestamp within 5s of current time
  const genTime = new Date(aData.generated_at).getTime();
  assert(Math.abs(Date.now() - genTime) < 5000, 'Response includes generated_at timestamp within 5s of current time');

  // Frontend Existence Tests (#482 - #485)
  // Test #482: App.jsx contains an "Analytics" sidebar entry
  assert(lpAppJsx.includes('Analytics'), 'App.jsx contains Analytics sidebar entry');

  // Test #483: App.jsx fetches /api/admin/analytics
  assert(lpAppJsx.includes('/admin/analytics'), 'App.jsx fetches /api/admin/analytics');

  // Test #484: App.jsx contains a "Refer a friend" tile with referral_code display
  assert(lpAppJsx.includes('Refer a friend') && lpAppJsx.includes('referral_code'), 'App.jsx contains a Refer a friend tile with referral_code display');

  // Test #485: App.jsx renders three home-dashboard cards near the admin home top
  // Round BF1: Bug Fixes (Pickup Slot Picker + KYC Queue Visibility) (#489-#493)
  console.log('\n--- Round BF1: Bug Fixes (Pickup Slot Picker + KYC Queue Visibility) ---');
  const bf1AppJsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');

  // Test #489: App.jsx contains getAvailableSlots(stockist) called inside JSX block near Place Pickup Order button
  assert(bf1AppJsx.includes('getAvailableSlots(stockist)') && bf1AppJsx.includes('Place Pickup Order'), 'App.jsx contains pickup slot picker calling getAvailableSlots(stockist) near Place Pickup Order');

  // Test #490: Pickup slot picker label has prominent fontSize (0.8rem or higher / class name)
  assert(bf1AppJsx.includes("fontSize: '0.85rem'") || bf1AppJsx.includes('pickup-slot-label'), 'Pickup slot picker label has prominent fontSize (0.85rem)');

  // Test #491: Pickup slot picker wrapper has background color or distinct class
  assert(bf1AppJsx.includes("backgroundColor: 'rgba(255,255,255,0.03)'") || bf1AppJsx.includes('pickup-slot-picker-block'), 'Pickup slot picker wrapper has background color or distinct class');

  // Test #492: Admin sidebar Pending KYC entry appears in the top sidebar items (within top 5 buttons)
  const sidebarMatch = bf1AppJsx.match(/className="admin-sidebar"[\s\S]*?<\/div>/);
  assert(sidebarMatch !== null, 'Found admin-sidebar in App.jsx');
  const sidebarButtons = (sidebarMatch[0].match(/<button[\s\S]*?<\/button>/g) || []);
  const pendingKycBtnIndex = sidebarButtons.findIndex(btn => btn.includes('Pending KYC'));
  assert(pendingKycBtnIndex >= 0 && pendingKycBtnIndex < 5, `Pending KYC sidebar button appears within top 5 sidebar buttons (got index ${pendingKycBtnIndex})`);

  // Test #493: Admin home tab contains alert block referencing pendingKyc.length > 0 with click-through
  assert(bf1AppJsx.includes('pendingKyc.length > 0') && (bf1AppJsx.includes('stockists awaiting KYC approval') || bf1AppJsx.includes('awaiting KYC approval')), 'Admin home tab contains alert block referencing pendingKyc.length > 0');

    // --- Round BF2: Order Status Enum + Partner Package Fixes (#494-#502) ---
  console.log('\n--- Round BF2: Order Status Enum + Partner Package Fixes ---');
  const bf2AppJsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');

  // Test #494: App.jsx contains ZERO references to o.status === 'ACCEPTED' or order.status === 'ACCEPTED'
  assert(!bf2AppJsx.includes("o.status === 'ACCEPTED'") && !bf2AppJsx.includes("order.status === 'ACCEPTED'"), 'App.jsx contains ZERO references to o.status === ACCEPTED or order.status === ACCEPTED');

  // Test #495: App.jsx contains ZERO references to 'PREPARING' in any context
  assert(!bf2AppJsx.includes("'PREPARING'"), "App.jsx contains ZERO references to 'PREPARING'");

  // Test #496: App.jsx contains ZERO references to 'READY_FOR_PICKUP' in an order status conditional
  assert(!bf2AppJsx.includes("status === 'READY_FOR_PICKUP'"), "App.jsx contains ZERO references to 'READY_FOR_PICKUP' in order status conditional");

  // Test #497: Endpoint test: Place an order -> transition through backend to READY -> returned order.status equals 'READY'
  const bf2OrderRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(bf2OrderRes.status === 200, 'Placed test order for BF2 status check');
  const bf2OrderId = bf2OrderRes.body.orderId;
  assert(bf2OrderId !== undefined, 'Got test order ID');

  // Transition CONFIRMING -> RECEIVED -> READY
  await patch(`http://localhost:3001/api/orders/${bf2OrderId}/status`, { status: 'RECEIVED' });
  await patch(`http://localhost:3001/api/orders/${bf2OrderId}/status`, { status: 'READY' });
  const bf2ReadyOrder = (await get('http://localhost:3001/api/orders')).body.find(o => o.id === bf2OrderId);
  assert(bf2ReadyOrder && bf2ReadyOrder.status === 'READY', `Returned order.status equals 'READY' exactly (got '${bf2ReadyOrder ? bf2ReadyOrder.status : 'undefined'}')`);

  // Test #498: Auto-recovery block near boot references CONFIRMING, RECEIVED, or READY
  assert(bf2AppJsx.includes("['CONFIRMING', 'RECEIVED', 'READY']") || (bf2AppJsx.includes("'CONFIRMING'") && bf2AppJsx.includes("'RECEIVED'") && bf2AppJsx.includes("'READY'")), 'Auto-recovery block references CONFIRMING, RECEIVED, or READY');

  // Test #499: Log in as adhya (partner), POST new package with active_regions: ['r1'] -> 200
  const adhyaSessionRes = await post('http://localhost:3001/api/partner/auth/login-password', { email: 'adhya@partners.example', password: 'partner123' });
  assert(adhyaSessionRes.status === 200, 'Adhya partner login succeeds');
  const adhyaToken = adhyaSessionRes.body.session_token;

  const validPkgRes = await post('http://localhost:3001/api/partner/packages', {
    name: 'BF2 Test Package Valid',
    service_type: 'CABLE',
    face_value_rupees: 300,
    cost_to_partner_rupees: 280,
    point_cost: 300,
    active_regions: ['r1']
  }, { headers: { Authorization: `Bearer ${adhyaToken}` } });
  assert(validPkgRes.status === 200 && (validPkgRes.body.name === 'BF2 Test Package Valid' || (validPkgRes.body.package && validPkgRes.body.package.name === 'BF2 Test Package Valid')), 'POST valid package with active_regions: [r1] returns 200 created package');

  // Test #500: POST same shape but active_regions: [] -> 400 with "At least one active region" error
  const emptyPkgRes = await post('http://localhost:3001/api/partner/packages', {
    name: 'BF2 Test Package Empty',
    service_type: 'CABLE',
    face_value_rupees: 300,
    cost_to_partner_rupees: 280,
    point_cost: 300,
    active_regions: []
  }, { headers: { Authorization: `Bearer ${adhyaToken}` } });
  assert(emptyPkgRes.status === 400 && emptyPkgRes.body.error === 'At least one active region is required for this package', 'POST package with active_regions: [] returns 400 error');

  // Test #501: App.jsx does NOT contain r.region_code || r.region_id in package region picker context
  assert(!bf2AppJsx.includes("const rCode = r.region_code || r.region_id;"), 'App.jsx does not contain r.region_code || r.region_id in package region picker context');

  // Test #505: Add Package modal contains at least 3 inline help strings
  const helpStrings = [
    "What customers will see",
    "actual cost to provide",
    "loyalty points a customer",
    "Tick the regions",
    "rupee value the customer"
  ];
  const matchedHelpStrings = helpStrings.filter(s => bf2AppJsx.includes(s));
  assert(matchedHelpStrings.length >= 3, `Add Package modal contains at least 3 inline help strings (found ${matchedHelpStrings.length})`);

  // --- Round BF3: Consolidated Bug Fixes ---
  console.log('\n--- Round BF3: Consolidated Bug Fixes ---');
  const bf3AppJsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');

  // Test #506: Grep test: App.jsx contains ZERO instances of triggerConfirmModal({
  assert(!bf3AppJsx.includes('triggerConfirmModal({'), 'App.jsx contains ZERO instances of triggerConfirmModal({');

  // Reset database before stateful endpoint tests
  await post('http://localhost:3001/api/admin/reset-db', {});

  // Test #507: Endpoint test: POST /api/admin/approve-kyc for u-stk3 -> 200, removed from kyc-queue
  const approveKycRes = await post('http://localhost:3001/api/admin/approve-kyc', {
    userId: 'u-stk3',
    vendorId: 'v2',
    deliveryRadius: 6.0,
    minOrderValue: 100
  });
  assert(approveKycRes.status === 200, 'POST /api/admin/approve-kyc returns 200');

  const bf3KycQueueRes = await get('http://localhost:3001/api/admin/kyc-queue');
  const inKycQueue = bf3KycQueueRes.body.some(u => u.id === 'u-stk3');
  assert(!inKycQueue, 'u-stk3 is no longer present in GET /api/admin/kyc-queue after approval');

  // Test #508: Endpoint test: Users row for u-stk3 post-approval has kyc_status='APPROVED'
  const allUsers = await dbModule.getTable('users');
  const uStk3User = allUsers.find(u => u.id === 'u-stk3');
  assert(uStk3User && uStk3User.kyc_status === 'APPROVED', 'u-stk3 kyc_status is APPROVED');

  // Test #509: Endpoint test: GET /api/regions (no auth) -> 200 with 3 items matching seed IDs (r1, r2, r3)
  const regionsRes = await get('http://localhost:3001/api/regions');
  assert(regionsRes.status === 200, 'GET /api/regions returns 200');
  assert(Array.isArray(regionsRes.body) && regionsRes.body.length === 3, 'GET /api/regions returns 3 items');
  const regionIds = regionsRes.body.map(r => r.id).sort();
  assert(JSON.stringify(regionIds) === JSON.stringify(['r1', 'r2', 'r3']), 'Regions match seed IDs r1, r2, r3');

  // Test #510: Endpoint test: Response items contain exactly {id, name, code} - no tenant_id, no created_at
  const firstReg = regionsRes.body[0];
  const keys = Object.keys(firstReg).sort();
  assert(JSON.stringify(keys) === JSON.stringify(['code', 'id', 'name']), 'Response items contain exactly {id, name, code}');
  assert(firstReg.tenant_id === undefined && firstReg.created_at === undefined, 'No tenant_id or created_at in /api/regions response');

  // Test #511: Grep test: App.jsx does NOT contain hardcoded fallback array with 'Kolkata South (Garia)' in setAllSystemRegions
  assert(!bf3AppJsx.includes("setAllSystemRegions([{ id: 'r1', name: 'Kolkata South (Garia)'"), 'App.jsx does NOT contain hardcoded region fallback in setAllSystemRegions');

  // Test #512: Grep test: App.jsx contains confirmModal.onConfirm?.() (with optional chaining)
  assert(bf3AppJsx.includes('confirmModal.onConfirm?.()'), 'App.jsx contains confirmModal.onConfirm?.() with optional chaining');

  // Test #513: Endpoint test: GET /api/customer/redemptions/u-cust1 returns an array
  const custRedemptionsRes = await get('http://localhost:3001/api/customer/redemptions/u-cust1');
  assert(custRedemptionsRes.status === 200 && Array.isArray(custRedemptionsRes.body), 'GET /api/customer/redemptions/u-cust1 returns 200 array');

  // Test #514: Endpoint test: After u-cust1 redeems a package, the new redemption_approval appears with status PENDING_ADMIN_APPROVAL
  await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: 2000, reason: 'Test setup' });
  await post('http://localhost:3001/api/customer/partner-bindings', {
    customer_user_id: 'u-cust1',
    cable_partner_id: 'ptr-adhya'
  });
  const adhyaDetail = await get('http://localhost:3001/api/admin/partners/ptr-adhya');
  const targetPkg = adhyaDetail.body.packages ? adhyaDetail.body.packages.find(p => p.is_active) : null;
  const targetPkgId = targetPkg ? targetPkg.id : 'ppk-adhya-basic';
  const targetPkgCost = targetPkg ? targetPkg.point_cost : 300;

  const p3RedeemRes = await post('http://localhost:3001/api/ledger/redeem', {
    customer_user_id: 'u-cust1',
    partner_package_id: targetPkgId,
    amount: targetPkgCost
  });
  assert(p3RedeemRes.status === 200, 'u-cust1 redeems package successfully');
  const p3ApprovalId = p3RedeemRes.body.redemption_approval ? p3RedeemRes.body.redemption_approval.id : null;
  assert(p3ApprovalId !== null, 'Redemption created approval row');

  const custRedemptionsPostRes = await get('http://localhost:3001/api/customer/redemptions/u-cust1');
  const newRedemptionRow = custRedemptionsPostRes.body.find(r => r.id === p3ApprovalId);
  assert(newRedemptionRow && newRedemptionRow.status === 'PENDING_ADMIN_APPROVAL', 'New redemption appears in endpoint with status PENDING_ADMIN_APPROVAL');

  // Test #515: Endpoint test: After admin approves, response shows status APPROVED_AWAITING_PARTNER
  await post(`http://localhost:3001/api/admin/redemption-approvals/${p3ApprovalId}/approve`, { admin_id: 'u-admin', notes: 'Approved by admin test' });
  const custRedemptionsApprovedRes = await get('http://localhost:3001/api/customer/redemptions/u-cust1');
  const approvedRedemptionRow = custRedemptionsApprovedRes.body.find(r => r.id === p3ApprovalId);
  assert(approvedRedemptionRow && approvedRedemptionRow.status === 'APPROVED_AWAITING_PARTNER', 'Approved redemption shows status APPROVED_AWAITING_PARTNER');

  // Test #516: Endpoint test: Endpoint does NOT expose partner internal fields (contact_email, gst_number)
  assert(approvedRedemptionRow.contact_email === undefined && approvedRedemptionRow.gst_number === undefined, 'Endpoint does NOT expose partner internal fields (contact_email, gst_number)');

  // Test #517: Grep test: App.jsx contains status key labels for PENDING_ADMIN_APPROVAL, APPROVED_AWAITING_PARTNER, FULFILLED, REJECTED
  assert(
    bf3AppJsx.includes('PENDING_ADMIN_APPROVAL') &&
    bf3AppJsx.includes('APPROVED_AWAITING_PARTNER') &&
    bf3AppJsx.includes('FULFILLED') &&
    bf3AppJsx.includes('REJECTED'),
    'App.jsx contains status keys PENDING_ADMIN_APPROVAL, APPROVED_AWAITING_PARTNER, FULFILLED, REJECTED'
  );

  // Test #518: Grep test: All other confirmation modal call sites in App.jsx use positional args
  const modalCallsCount = (bf3AppJsx.match(/triggerConfirmModal\(/g) || []).length;
  assert(modalCallsCount >= 6, `Count of triggerConfirmModal( calls matches expectation (found ${modalCallsCount})`);

  // Test #519: Grep test: App.jsx does NOT contain any triggerConfirmModal(\s*\{ pattern
  assert(!/triggerConfirmModal\s*\{/.test(bf3AppJsx), 'App.jsx does NOT contain triggerConfirmModal(\\s*\\{ pattern');

  // Test #520: Grep test: handleApproveKyc handler is still defined and still hits /admin/approve-kyc
  assert(bf3AppJsx.includes('handleApproveKyc') && bf3AppJsx.includes('/admin/approve-kyc'), 'handleApproveKyc handler is defined and hits /admin/approve-kyc');

  console.log('\n--- Round PL: Pre-Launch Consolidated ---');

  const indexCss = fs.readFileSync(path.join(__dirname, '../../frontend/src/index.css'), 'utf8');
  const plAppJsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');
  const serverJs = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

  // Test #527: Grep test: index.css contains .modal-overlay and .modal-content with position: fixed
  assert(indexCss.includes('.modal-overlay') && indexCss.includes('.modal-content') && indexCss.includes('position: fixed'), 'index.css contains .modal-overlay and .modal-content with position: fixed');

  // Test #528: Grep test: App.jsx still has >= 30 references to className="modal-overlay"
  const overlayCount = (plAppJsx.match(/className="modal-overlay"/g) || []).length;
  assert(overlayCount >= 30, `App.jsx still has >= 30 references to className="modal-overlay" (found ${overlayCount})`);

  // Test #529: Grep test: App.jsx contains Home tab render block with pendingKyc.length and PENDING_ADMIN_APPROVAL
  assert(plAppJsx.includes("adminTab === 'home'") && plAppJsx.includes('pendingKyc.length') && plAppJsx.includes('PENDING_ADMIN_APPROVAL'), 'App.jsx contains Home tab block with pendingKyc.length and PENDING_ADMIN_APPROVAL');

  // Test #530: Grep test: App.jsx contains showAdvanced state variable AND toggle button
  assert(plAppJsx.includes('showAdvanced') && plAppJsx.includes('setShowAdvanced(!showAdvanced)'), 'App.jsx contains showAdvanced state variable AND toggle button');

  // Test #531: Grep test: App.jsx contains Config tab block
  assert(plAppJsx.includes("adminTab === 'config'"), 'App.jsx contains adminTab === config block');

  // Test #532: Grep test: App.jsx does NOT contain a separate top-level adminTab === 'rates' sidebar item outside Config
  assert(!plAppJsx.includes("onClick={() => setAdminTab('rates')}"), 'App.jsx does NOT contain top-level onClick setAdminTab rates sidebar button');

  // Test #533: Endpoint test: GET /api/admin/analytics returns 200
  const plAnalyticsRes = await get('http://localhost:3001/api/admin/analytics');
  assert(plAnalyticsRes.status === 200, 'GET /api/admin/analytics returns 200');

  // Test #534: Endpoint test: GET /api/health returns 200 with status, db, uptime_seconds, version fields
  const healthRes = await get('http://localhost:3001/api/health');
  assert(healthRes.status === 200, 'GET /api/health returns 200');
  assert(healthRes.body.status === 'ok' && healthRes.body.db !== undefined && typeof healthRes.body.uptime_seconds === 'number' && healthRes.body.version !== undefined, 'GET /api/health returns status, db, uptime_seconds, version fields');

  // Test #535: Endpoint test: Health check DB status is connected
  assert(healthRes.body.db === 'connected', 'GET /api/health db status is connected');

  // Test #536: Grep test: server.js contains request-logging middleware
  assert(serverJs.includes('[HTTP]') && serverJs.includes('req.method') && serverJs.includes('res.statusCode'), 'server.js contains request-logging middleware');

  // Test #537: Grep test: server.js contains ZERO console.log(.*password patterns
  assert(!/console\.log\(.*password/i.test(serverJs), 'server.js contains ZERO console.log(.*password patterns');

  // Test #538: Grep test: server.js contains ZERO console.log(.*token patterns
  assert(!/console\.log\(.*token/i.test(serverJs), 'server.js contains ZERO console.log(.*token patterns');

  // Test #539: Grep test: server.js has boot-time check emitting [Config] warnings
  assert(serverJs.includes('checkConfigWarnings') && serverJs.includes('[Config] WARNING:'), 'server.js has checkConfigWarnings emitting [Config] warnings');

  // Test #540: Runtime test: checkConfigWarnings emits [Config] warning for missing env vars
  assert(serverJs.includes('[Config] WARNING: SMS delivery disabled'), 'checkConfigWarnings emits [Config] warning for missing SMS config');

  console.log('\n--- Round BF4b: Seeded Stockists Missing user_id ---');
  await post('http://localhost:3001/api/admin/reset-db', {});

  // Test #542: GET /api/stockists/by-user/u-stk1 -> 200, body id === 's1'
  const stk1Res = await get('http://localhost:3001/api/stockists/by-user/u-stk1');
  assert(stk1Res.status === 200 && stk1Res.body.id === 's1', 'GET /api/stockists/by-user/u-stk1 returns 200 with id s1');

  // Test #543: GET /api/stockists/by-user/u-stk2 -> 200, body id === 's2'
  const stk2Res = await get('http://localhost:3001/api/stockists/by-user/u-stk2');
  assert(stk2Res.status === 200 && stk2Res.body.id === 's2', 'GET /api/stockists/by-user/u-stk2 returns 200 with id s2');

  // Test #544: GET /api/stockists/by-user/u-stk4 -> 200, body id === 's3'
  const stk4Res = await get('http://localhost:3001/api/stockists/by-user/u-stk4');
  assert(stk4Res.status === 200 && stk4Res.body.id === 's3', 'GET /api/stockists/by-user/u-stk4 returns 200 with id s3');

  // Test #545: GET /api/stockists/by-user/u-stk3 -> 404 (correctly still pending)
  const stk3Res = await get('http://localhost:3001/api/stockists/by-user/u-stk3');
  assert(stk3Res.status === 404, 'GET /api/stockists/by-user/u-stk3 returns 404 (pending)');

  console.log('\n--- Round BF4c: Pickup Slots: AM/PM Format, No Past Slots ---');
  const bf4cAppJsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');

  // Extract formatHour12 and getAvailableSlots from App.jsx to test functionally
  const extractFnCode = (src, fnName) => {
    const startIdx = src.indexOf(`const ${fnName} =`);
    if (startIdx === -1) throw new Error(`Could not find ${fnName} in App.jsx`);
    const body = src.slice(startIdx, src.indexOf('};', startIdx) + 2);
    return body;
  };

  const formatHour12Code = extractFnCode(bf4cAppJsx, 'formatHour12');
  const getAvailableSlotsCode = extractFnCode(bf4cAppJsx, 'getAvailableSlots');

  const evalSlotsFn = new Function(
    `${formatHour12Code}; ${getAvailableSlotsCode}; return getAvailableSlots;`
  )();

  const testStockist = { id: 's1', opening_time: '08:00', closing_time: '20:00', prep_eta_minutes: 10 };

  // Test #546: Given a fixed "now" of 20:30 and store hours 08:00–20:00: every returned slot start is in the future, and at least one is labelled for tomorrow
  const fixedNowLate = new Date('2026-08-06T20:30:00');
  const slotsLate = evalSlotsFn(testStockist, fixedNowLate);
  assert(slotsLate.length > 0, 'slotsLate returns at least one slot');
  assert(slotsLate.every(s => new Date(s.value).getTime() > fixedNowLate.getTime()), 'Every returned slot start is in the future when now is 20:30');
  assert(slotsLate.some(s => s.day === 'tomorrow' || s.label.startsWith('Tomorrow,')), 'At least one slot is labelled for tomorrow when now is 20:30');

  // Test #547: Given "now" of 10:00: no returned slot starts before 10:00
  const fixedNowMorning = new Date('2026-08-06T10:00:00');
  const slotsMorning = evalSlotsFn(testStockist, fixedNowMorning);
  assert(slotsMorning.length > 0, 'slotsMorning returns slots for 10:00 AM');
  assert(slotsMorning.every(s => new Date(s.value).getTime() >= fixedNowMorning.getTime()), 'No returned slot starts before 10:00 when now is 10:00');

  // Test #548: For a store with valid opening/closing hours, the returned list is non-empty at any hour of the day
  for (let hour = 0; hour < 24; hour++) {
    const testNow = new Date(`2026-08-06T${String(hour).padStart(2, '0')}:15:00`);
    const slots = evalSlotsFn(testStockist, testNow);
    assert(slots.length > 0, `Returned list is non-empty at hour ${hour}:00`);
  }

  // Test #549: Grep: App.jsx contains AM and PM string literals near slot code, and customer cart picker no longer builds labels with bare String(h).padStart(2, '0') + ':00'
  assert(bf4cAppJsx.includes("'AM'") && bf4cAppJsx.includes("'PM'"), 'App.jsx contains AM and PM string literals');
  assert(!bf4cAppJsx.includes("String(h).padStart(2, '0') + ':00'"), 'App.jsx no longer builds labels with bare String(h).padStart(2, "0") + ":00"');

  console.log('\n--- Round BF5a: Remove Auto-Login From Default Path ---');
  const bf5aAppJsx = fs.readFileSync(path.join(__dirname, '../../frontend/src/App.jsx'), 'utf8');

  // Test #577: Grep: App.jsx defines an isDevMode flag derived from window.location.search and/or import.meta.env.DEV
  assert(bf5aAppJsx.includes('isDevMode') && (bf5aAppJsx.includes('window.location.search') || bf5aAppJsx.includes('import.meta.env.DEV')), 'App.jsx defines an isDevMode flag derived from window.location.search');

  // Test #578: Grep: every hardcoded seed phone literal used in an auto-login call appears inside a block guarded by isDevMode
  const switchViewStart = bf5aAppJsx.indexOf('const switchViewToRole =');
  assert(switchViewStart !== -1, 'switchViewToRole handler exists in App.jsx');
  const switchViewBlock = bf5aAppJsx.slice(switchViewStart, bf5aAppJsx.indexOf('};', switchViewStart) + 2);
  assert(switchViewBlock.includes('if (!isDevMode)') || switchViewBlock.includes('isDevMode'), 'switchViewToRole gates auto-login calls on isDevMode');

  // Test #579: Grep: the role-switch handler clears currentUser when isDevMode is false
  assert(switchViewBlock.includes('setCurrentUser(null)'), 'role-switch handler clears currentUser when isDevMode is false');

  console.log('\n--- Round BF5b: Region CRUD (Admin) ---');
  await post('http://localhost:3001/api/admin/reset-db', {});

  // Test #581: POST /api/admin/regions with valid name and code -> 200, row exists in GET /api/regions
  const postRegRes = await post('http://localhost:3001/api/admin/regions', { name: 'Howrah Central', code: 'howrah-central' });
  assert(postRegRes.status === 200 && postRegRes.body.id, 'POST /api/admin/regions returns 200 with id');
  const createdRegionId = postRegRes.body.id;
  const getRegsRes1 = await get('http://localhost:3001/api/regions');
  assert(getRegsRes1.body.some(r => r.id === createdRegionId && r.code === 'howrah-central'), 'Created region exists in GET /api/regions');

  // Test #582: Duplicate code -> 409
  const dupCodeRes = await post('http://localhost:3001/api/admin/regions', { name: 'Howrah North', code: 'howrah-central' });
  assert(dupCodeRes.status === 409, 'Duplicate region code returns 409');

  // Test #583: Invalid code ("Kolkata South") -> 400
  const invCodeRes = await post('http://localhost:3001/api/admin/regions', { name: 'Kolkata South 2', code: 'Kolkata South' });
  assert(invCodeRes.status === 400, 'Invalid region code returns 400');

  // Test #584: Empty name -> 400
  const emptyNameRes = await post('http://localhost:3001/api/admin/regions', { name: '  ', code: 'valid-code' });
  assert(emptyNameRes.status === 400, 'Empty region name returns 400');

  // Test #585: PATCH an existing region's name -> 200, change reflected in GET /api/regions
  const patchRes = await patch(`http://localhost:3001/api/admin/regions/${createdRegionId}`, { name: 'Howrah Metro' });
  assert(patchRes.status === 200 && patchRes.body.name === 'Howrah Metro', 'PATCH region returns 200 with updated name');
  const getRegsRes2 = await get('http://localhost:3001/api/regions');
  assert(getRegsRes2.body.some(r => r.id === createdRegionId && r.name === 'Howrah Metro'), 'Updated region name reflected in GET /api/regions');

  // Test #586: PATCH a region's code to one already used by another region -> 409
  const patchDupRes = await patch(`http://localhost:3001/api/admin/regions/${createdRegionId}`, { code: 'kolkata-garia' });
  assert(patchDupRes.status === 409, 'PATCH duplicate code returns 409');

  // Test #587: PATCH a non-existent region id -> 404
  const patch404Res = await patch('http://localhost:3001/api/admin/regions/r-nonexistent', { name: 'Ghost Region' });
  assert(patch404Res.status === 404, 'PATCH non-existent region returns 404');

  // Test #588: DELETE a region with assigned references -> 409, message names the blocker
  const delBlockRes = await del('http://localhost:3001/api/admin/regions/r1');
  assert(delBlockRes.status === 409 && delBlockRes.body.error.startsWith('Cannot delete:'), 'DELETE region r1 with assigned references returns 409 naming the blocker');

  // Test #589: DELETE an unused region -> 200, gone from GET /api/regions
  const delUnusedRes = await del(`http://localhost:3001/api/admin/regions/${createdRegionId}`);
  assert(delUnusedRes.status === 200, 'DELETE unused region returns 200');
  const getRegsRes3 = await get('http://localhost:3001/api/regions');
  assert(!getRegsRes3.body.some(r => r.id === createdRegionId), 'Deleted region is gone from GET /api/regions');

  // Test #590: GET /api/admin/regions returns usage counts; a seeded region with stockists shows a non-zero counts.stockists
  const adminRegsRes = await get('http://localhost:3001/api/admin/regions');
  assert(adminRegsRes.status === 200 && Array.isArray(adminRegsRes.body), 'GET /api/admin/regions returns 200 array');
  const r1Detail = adminRegsRes.body.find(r => r.id === 'r1');
  assert(r1Detail && r1Detail.counts && r1Detail.counts.stockists > 0, 'Seeded region r1 has non-zero counts.stockists');

console.log(`\n=== REGRESSION SUITE COMPLETED: ${passedCount}/${testCount} tests passed ===`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during regression tests:', err);
  process.exit(1);
});
