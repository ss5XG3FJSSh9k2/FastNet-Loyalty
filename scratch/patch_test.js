const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const t = "assert(badAdminAnalyticsRes.status === 401, 'GET /api/admin/analytics with non-existent ID header returns 401');";
const r = "if (badAdminAnalyticsRes.status !== 401) console.error('Status was:', badAdminAnalyticsRes.status, badAdminAnalyticsRes.body);\n  assert(badAdminAnalyticsRes.status === 401, 'GET /api/admin/analytics with non-existent ID header returns 401');";

code = code.replace(t, r);
fs.writeFileSync('backend/tests/regression.js', code, 'utf8');
