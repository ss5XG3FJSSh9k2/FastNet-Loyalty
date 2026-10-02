const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

const targetStr = "const tokenForTest = adminLoginRes.body.token; // admin token";
const replaceStr = "const tokenForTest = currentToken;";
code = code.replace(targetStr, replaceStr);

fs.writeFileSync('backend/tests/regression.js', code);
