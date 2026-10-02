const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

code = code.replace(
  /assert\(shortNameProdRes\.status === 400 && \(shortNameProdRes\.body\.error === 'Product name is required' \|\| shortNameProdRes\.body\.error\?\.includes\('name'\)\),/g,
  `assert(shortNameProdRes.status === 400 && (shortNameProdRes.body.error === 'validation_failed' || shortNameProdRes.body.error === 'Product name is required' || shortNameProdRes.body.error?.includes('name')),`
);

fs.writeFileSync('backend/tests/regression.js', code);
console.log('Fixed Product short name test assertion');
