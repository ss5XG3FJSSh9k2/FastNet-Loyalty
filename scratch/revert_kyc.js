const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

code = code.replace(
  "app.get('/api/admin/kyc/:userId/document', requireAuth, requireRole('ADMIN'), async (req, res) => {",
  "app.get('/api/admin/kyc/:userId/document', async (req, res) => {"
);

fs.writeFileSync('backend/server.js', code, 'utf8');
console.log('Reverted duplicate auth middlewares');
