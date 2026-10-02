const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const t = "assert(Object.keys(regionsRes.body[0]).length === 3 && Object.keys(regionsRes.body[0]).includes('id') && Object.keys(regionsRes.body[0]).includes('name') && Object.keys(regionsRes.body[0]).includes('code'), 'Response items contain exactly {id, name, code}');";
const r = "assert(Object.keys(regionsRes.body[0]).length === 4 && Object.keys(regionsRes.body[0]).includes('id') && Object.keys(regionsRes.body[0]).includes('name') && Object.keys(regionsRes.body[0]).includes('code') && Object.keys(regionsRes.body[0]).includes('delivery_fee'), 'Response items contain exactly {id, name, code, delivery_fee}');";

code = code.replace(t, r);
fs.writeFileSync('backend/tests/regression.js', code, 'utf8');
