const fs = require('fs');
let c = fs.readFileSync('backend/tests/regression.js', 'utf8');

c = c.replace(/phone:\s*['"]([0-9]+)['"]/g, (match, phone) => {
  return `${match}, email: 'test_${phone}@fastnet.test'`;
});
c = c.replace(/phone:\s*([a-zA-Z0-9_]+)/g, (match, phoneVar) => {
  return `${match}, email: 'test_' + ${phoneVar} + '@fastnet.test'`;
});

fs.writeFileSync('backend/tests/regression.js', c);
