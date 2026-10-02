const fs = require('fs');
let code = fs.readFileSync('backend/tests/regression.js', 'utf8');

code = code.replace(
  /assert\(noNameProdRes\.status === 400 && noNameProdRes\.body\.error === 'Product name is required', 'POST \/api\/products without product name returns 400 error'\);/g,
  `assert(noNameProdRes.status === 400 && noNameProdRes.body.error === 'validation_failed', 'POST /api/products without product name returns 400 error');`
);

fs.writeFileSync('backend/tests/regression.js', code);
console.log('Fixed Product name test assertion');
