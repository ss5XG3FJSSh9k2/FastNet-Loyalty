const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const test693_target = /  \/\/ Test #693: Endpoint: GET \/api\/admin\/analytics with header set to real setup-created admin's ID -> 200[\s\S]*?assert\(realAdminAnalyticsRes\.status === 200 && realAdminAnalyticsRes\.body\.orders, 'GET \/api\/admin\/analytics with real setup admin ID header returns 200'\);/;
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
fs.writeFileSync('backend/tests/regression.js', code);
