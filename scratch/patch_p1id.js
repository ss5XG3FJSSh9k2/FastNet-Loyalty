const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

// replace 'test-p1' with p1Id in BF-SEC-4 chunk
code = code.replace(/'test-p1'/g, 'p1Id');

fs.writeFileSync('backend/tests/regression.js', code);
console.log('Replaced test-p1 with p1Id');
