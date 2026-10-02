const http = require('http');

async function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = http.request(options, (res) => {
      let r = '';
      res.on('data', c => r += c);
      res.on('end', () => resolve({ status: res.statusCode, body: r }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const adminRes = await req('POST', '/api/auth/login-password', { email: 'admin@fastnet.example.com', password: 'securepassword' });
  const adminToken = JSON.parse(adminRes.body).token;
  
  const custRes = await req('POST', '/api/auth/login-password', { phone: '9839910001', password: 'securepassword' });
  const custToken = JSON.parse(custRes.body).token;
  
  // 1. Order creation bad quantity
  console.log("=== Order creation ===");
  const o1 = await req('POST', '/api/orders', {
    stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: -5 }] }]
  });
  console.log("POST /api/orders with quantity -5 =>", o1.status, o1.body.substring(0, 50));

  // 2. Generic rewards bad point_cost
  console.log("\n=== Generic rewards ===");
  const g1 = await req('POST', '/api/admin/generic-rewards', {
    name: 'test', point_cost: '-50', value_rupees: 9999
  });
  console.log("POST /api/admin/generic-rewards with point_cost -50 =>", g1.status, g1.body.substring(0, 50));

  // 3. Manual points credit
  console.log("\n=== Manual points credit ===");
  const m1 = await req('POST', '/api/admin/customers/u-cust1/points-credit', {
    amount: 100000, reason: 'test'
  });
  console.log("POST /api/admin/customers/u-cust1/points-credit 100000 =>", m1.status, m1.body.substring(0, 50));
}

run().catch(console.error);
