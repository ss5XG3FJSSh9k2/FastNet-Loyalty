const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const t = `  assert(docFileRes401.status === 401, 'GET /api/kyc/documents/sample-aadhaar.jpg without token returns 401 (Test #811)');`;
const r = `  assert(docFileRes401.status === 401, 'GET /api/kyc/documents/sample-aadhaar.jpg without token returns 401 (Test #811)');
  loginAs('u-admin', 'ADMIN');`;

code = code.replace(t, r);
fs.writeFileSync('backend/tests/regression.js', code);
console.log('Fixed');
