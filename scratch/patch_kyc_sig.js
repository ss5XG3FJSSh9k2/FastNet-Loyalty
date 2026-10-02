const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const target = `app.get('/api/kyc/documents/:filename', (req, res) => {
  const filename = req.params.filename;
  const ext = path.extname(filename).toLowerCase();`;

const replacement = `app.get('/api/kyc/documents/:filename', (req, res) => {
  const { expires, sig } = req.query;
  if (!expires || !sig) return res.status(403).json({ error: 'Missing signature' });
  if (Date.now() > parseInt(expires, 10)) return res.status(403).json({ error: 'Link expired' });
  const crypto = require('crypto');
  const secret = process.env.JWT_SECRET || 'secret';
  const expectedSig = crypto.createHmac('sha256', secret).update(req.path + ':' + expires).digest('hex');
  if (sig !== expectedSig) return res.status(403).json({ error: 'Invalid signature' });

  const filename = req.params.filename;
  const ext = path.extname(filename).toLowerCase();`;

code = code.replace(target, replacement);
fs.writeFileSync('backend/server.js', code, 'utf8');
