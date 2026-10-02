const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const t = "headers: { 'x-admin-id': 'u-nonexistent-admin-999' }";
const r = "headers: { 'Authorization': 'Bearer bad_token' }";

code = code.replace(t, r);
fs.writeFileSync('backend/tests/regression.js', code, 'utf8');
