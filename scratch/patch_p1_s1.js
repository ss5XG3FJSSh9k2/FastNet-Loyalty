const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

code = code.replace(/p1Id/g, "'p1'");
code = code.replace(/'u-stk1'/g, "'s1'");

fs.writeFileSync('backend/tests/regression.js', code);
console.log('Replaced p1Id with p1 and u-stk1 with s1');
