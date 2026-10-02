const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const t = "const unauthAnalytics = await get('http://localhost:3001/api/admin/analytics?admin_id=invalid-admin-id');";
const r = "const unauthAnalytics = await get('http://localhost:3001/api/admin/analytics?admin_id=invalid-admin-id', { headers: { Authorization: 'Bearer bad_token' } });";

code = code.replace(t, r);
fs.writeFileSync('backend/tests/regression.js', code, 'utf8');
