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
  const ordersListReversal = dbModule.getTable('orders');
  const ord = ordersListReversal.find(o => o.id === orderId);
  ord.status = 'PENDING';
  dbModule.saveTable('orders', ordersListReversal);

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
  const ordersList = dbModule.getTable('orders');
  const targetOrder = ordersList.find(o => o.id === testOrder.body.orderId);
  targetOrder.cancel_deadline = new Date(Date.now() - 10000).toISOString();
  targetOrder.status = 'PENDING'; // cancel deadline doesn't apply to CONFIRMING status
  dbModule.saveTable('orders', ordersList);
  
  const cancelRes = await post(`http://localhost:3001/api/orders/${testOrder.body.orderId}/cancel`);
  assert(cancelRes.status === 400, 'Cancellation blocked after deadline/window closed');

  // 14. No-show flow (Reschedule or Cancel)
  console.log('\n--- 14. No-Show flow ---');
  // Order status needs to be SHIPPED/READY to simulate missed pickup
  targetOrder.status = 'SHIPPED';
  dbModule.saveTable('orders', ordersList);
  
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
  const usersList = dbModule.getTable('users');
  const customerUser = usersList.find(u => u.id === 'u-cust1');
  customerUser.no_show_count = 3;
  customerUser.prepaid_pickup_restricted = true;
  dbModule.saveTable('users', usersList);

  const restrictedRes = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    stockistId: 's1',
    fulfillmentType: 'PICKUP',
    pickupSlot: 'Morning (8AM–12PM)',
    items: [{ productId: 'p1', quantity: 1 }]
  });
  assert(restrictedRes.status === 400, 'Prepaid pickup is restricted after 3 no-shows');

  // Reset no-shows
  customerUser.no_show_count = 0;
  customerUser.prepaid_pickup_restricted = false;
  dbModule.saveTable('users', usersList);

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
  const multiOrders = dbModule.getTable('orders');
  const multiO = multiOrders.find(o => o.id === multiOrderId);
  multiO.status = 'DELIVERED';
  dbModule.saveTable('orders', multiOrders);

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
  
  const codLedger = dbModule.getTable('cod_commission_ledger');
  const codEntry = codLedger.find(e => e.order_id === codOrder.body.orderId);
  assert(codEntry !== undefined, 'COD commission entry added to ledger');

  // 18. Fraud Flag Dismissals
  console.log('\n--- 18. Fraud Flag Dismissals ---');
  const anomaliesList = dbModule.getTable('anomaly_logs');
  const targetAnomaly2 = anomaliesList[0];
  
  const dismissRes = await post(`http://localhost:3001/api/admin/anomalies/${targetAnomaly2.id}/dismiss`, {
    reason: 'Legitimate regular customer'
  });
  assert(dismissRes.status === 200, 'Anomaly flag dismissed');
  
  const auditAnomalies = dbModule.getTable('anomaly_logs');
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
  const ordersList2 = dbModule.getTable('orders');
  const targetOrder2 = ordersList2.find(o => o.id === orderToCancelFail.body.orderId);
  targetOrder2.cancel_deadline = new Date(Date.now() - 10000).toISOString();
  targetOrder2.status = 'PENDING';
  dbModule.saveTable('orders', ordersList2);

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
  const ordersList3 = dbModule.getTable('orders');
  const cancelOrd = ordersList3.find(o => o.id === cancelTestOrder.body.orderId);
  cancelOrd.status = 'READY_FOR_PICKUP';
  dbModule.saveTable('orders', ordersList3);

  const cancelReadyRes = await post(`http://localhost:3001/api/orders/${cancelTestOrder.body.orderId}/cancel`);
  assert(cancelReadyRes.status === 400, 'Cancel at READY is blocked');
  assert(cancelReadyRes.body.code === 'CANCEL_LOCKED_READY', 'Returns CANCEL_LOCKED_READY code');

  // Reset status to PREPARING to test success cancel within timer -> REFUND_DUE
  const ordersList4 = dbModule.getTable('orders');
  const cancelOrd2 = ordersList4.find(o => o.id === cancelTestOrder.body.orderId);
  cancelOrd2.status = 'PREPARING';
  dbModule.saveTable('orders', ordersList4);

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
  const ordersList5 = dbModule.getTable('orders');
  const targetOrd5 = ordersList5.find(o => o.id === stockistCancelTestOrder.body.orderId);
  targetOrd5.status = 'PENDING';
  dbModule.saveTable('orders', ordersList5);

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

  const ordersList6 = dbModule.getTable('orders');
  const targetOrd6 = ordersList6.find(o => o.id === stockistCancelTestOrder2.body.orderId);
  targetOrd6.status = 'PREPARING';
  dbModule.saveTable('orders', ordersList6);

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
  const defaultPayout = serverModule.calculatePartnerPayout(250);
  assert(defaultPayout.platformCut === 30 && defaultPayout.partnerPayout === 220 && defaultPayout.cutPctUsed === 12, 'calculatePartnerPayout(250) returns 30/220/12');

  const overridePayout = serverModule.calculatePartnerPayout(200, 's1');
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
  const appJsx = fsMod.readFileSync('frontend/src/App.jsx', 'utf8');
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

  console.log(`\n=== REGRESSION SUITE COMPLETED: ${passedCount}/${testCount} tests passed ===`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during regression tests:', err);
  process.exit(1);
});
