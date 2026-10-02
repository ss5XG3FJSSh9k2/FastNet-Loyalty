const http = require('http');

function post(url, data, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(data);
    const headers = Object.assign({
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }, options.headers || {});

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
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
    req.write(postData);
    req.end();
  });
}

(async () => {
  const loginRes = await post('http://localhost:3001/api/auth/login', { email: 'customer1@test.com', password: 'password123' });
  const token = loginRes.body.token;

  const res = await post('http://localhost:3001/api/orders', {
    customerId: 'u-cust1',
    fulfillmentType: 'PICKUP',
    paymentMethod: 'ONLINE',
    stores: [{ stockistId: 's1', items: [{ productId: 'p1', quantity: 1 }], pickupSlot: '10:00 AM - 11:00 AM' }]
  }, { headers: { Authorization: 'Bearer ' + token } });
  
  console.log(res.status, res.body);
})();
