const http = require('http');

async function req(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const request = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

async function run() {
  const loginRes = await req('/api/auth/login', 'POST', { phone: '9999999999', otp: '123456' });
  const loginData = JSON.parse(loginRes.body);
  const token = loginData.token;
  const adminTokenRes = await req('/api/auth/login', 'POST', { phone: '9999999998', otp: '123456' });
  const adminToken = JSON.parse(adminTokenRes.body).token;
  
  // 1. Order negative quantity
  console.log("Order negative quantity:");
  console.log(await req('/api/orders', 'POST', {
    customerId: 'u1',
    stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: -5 }], pickupSlot: 'Morning' }],
    fulfillmentType: 'PICKUP', paymentMethod: 'UPI'
  }, token));

  // 1. Order string quantity
  console.log("Order string quantity:");
  console.log(await req('/api/orders', 'POST', {
    customerId: 'u1',
    stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: "abc" }], pickupSlot: 'Morning' }],
    fulfillmentType: 'PICKUP', paymentMethod: 'UPI'
  }, token));

  // 1. Duplicate lines stock check
  console.log("Order duplicate lines exceeding stock:");
  console.log(await req('/api/orders', 'POST', {
    customerId: 'u1',
    stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: 45 }, { productId: 'p1', quantity: 45 }], pickupSlot: 'Morning' }],
    fulfillmentType: 'PICKUP', paymentMethod: 'UPI'
  }, token));

  // 2. Generic rewards negative point_cost, etc
  console.log("Generic rewards create bad input:");
  console.log(await req('/api/admin/generic-rewards', 'POST', {
    name: 'Test', point_cost: "-50", value_rupees: 9999, cooldown_type: 'NONE'
  }, adminToken));

  // 3. Manual points credit
  console.log("Manual points credit:");
  console.log(await req('/api/admin/customers/u1/points-credit', 'POST', {
    amount: 100000, reason: 'test credit'
  }, adminToken));

  // 4. Product negative price
  console.log("Product negative price:");
  console.log(await req('/api/products', 'POST', {
    name: 'Test product', price: -10, initialStock: 50, category: 'groceries'
  }, adminToken));
}

run().catch(console.error);
