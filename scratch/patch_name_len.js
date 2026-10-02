const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

code = code.replace(/if \(name\.length < 1 \|\| name\.length > cfg\.PRODUCT_NAME_MAX_LENGTH\) \{/g,
  `if (name.length < 2 || name.length > cfg.PRODUCT_NAME_MAX_LENGTH) {`);

code = code.replace(/if \(pName\.length < 1 \|\| pName\.length > cfg\.PRODUCT_NAME_MAX_LENGTH\) \{/g,
  `if (pName.length < 2 || pName.length > cfg.PRODUCT_NAME_MAX_LENGTH) {`);

fs.writeFileSync('backend/server.js', code);
console.log('Fixed product name min length in server.js');
