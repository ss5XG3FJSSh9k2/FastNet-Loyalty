const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');
code = code.replace(
  /await post\('http:\/\/localhost:3001\/api\/admin\/customers\/u-cust1\/points-credit', \{ amount: 2000, reason: 'Test setup' \}\);/,
  `await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: 1000, reason: 'Test setup 1' });
  await post('http://localhost:3001/api/admin/customers/u-cust1/points-credit', { amount: 1000, reason: 'Test setup 2' });`
);
fs.writeFileSync('backend/tests/regression.js', code);
console.log('Fixed Test 281 setup');
