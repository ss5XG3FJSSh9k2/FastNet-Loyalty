const fs = require('fs');
let code = fs.readFileSync('backend/config.js', 'utf8');

code = code.replace("};\r\n\r\n  KYC_DOC_URL_TTL_SECONDS: 300, // BF-SEC-3", "  KYC_DOC_URL_TTL_SECONDS: 300, // BF-SEC-3\n};");
code = code.replace("};\n\n  KYC_DOC_URL_TTL_SECONDS: 300, // BF-SEC-3", "  KYC_DOC_URL_TTL_SECONDS: 300, // BF-SEC-3\n};");

fs.writeFileSync('backend/config.js', code, 'utf8');
console.log('Fixed config.js');
