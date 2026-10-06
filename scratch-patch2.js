const fs = require('fs');
let c = fs.readFileSync('backend/tests/regression.js', 'utf8');

c = c.replace(/contact_phone:\s*'(\d+)',\s*email:\s*'[^']+'/g, (match, phone) => {
  return `contact_phone: '${phone}'`;
});

fs.writeFileSync('backend/tests/regression.js', c);
