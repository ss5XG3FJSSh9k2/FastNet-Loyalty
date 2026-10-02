const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8').replace(/\r\n/g, '\n');

const orig = `// Serve KYC document photo
app.get('/api/kyc/documents/:filename', (req, res) => {
  const filename = req.params.filename;
  const ext = path.extname(filename).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : ext === '.pdf' ? 'application/pdf' : 'image/jpeg';
  const filepath = path.join(__dirname, 'uploads', 'kyc', filename);
  if (fs.existsSync(filepath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', mimeType);
    return res.sendFile(filepath);
  }
  const tmpPath = path.join('/tmp/kyc-uploads', filename);
  if (fs.existsSync(tmpPath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', mimeType);
    return res.sendFile(tmpPath);
  }
  return res.status(404).json({ error: 'File not found' });
});`;

const replaced = `// Serve KYC document photo
app.get('/api/kyc/documents/:filename', async (req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = 'Bearer ' + req.query.token;
  }
  next();
}, requireAuth, async (req, res) => {
  const filename = req.params.filename;
  
  // Verify ownership
  let ownerId = null;
  const match = filename.match(/^kyc_([^_]+)_/);
  if (match) {
    ownerId = match[1];
  } else {
    const users = await db.getTable('users');
    const owner = users.find(u => {
      if (u.kyc_details && typeof u.kyc_details === 'string') {
        return u.kyc_details.includes(filename);
      } else if (u.kyc_details && u.kyc_details.document_photo_url) {
        return u.kyc_details.document_photo_url.includes(filename);
      } else if (u.document_photo_url) {
        return u.document_photo_url.includes(filename);
      }
      return false;
    });
    if (owner) ownerId = owner.id;
  }

  // The prompt says "Require CUSTOMER owner or ADMIN."
  if (req.user.role !== 'ADMIN' && req.user.userId !== ownerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : ext === '.webp' ? 'image/webp' : ext === '.pdf' ? 'application/pdf' : 'image/jpeg';
  const filepath = path.join(__dirname, 'uploads', 'kyc', filename);
  if (fs.existsSync(filepath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', mimeType);
    return res.sendFile(filepath);
  }
  const tmpPath = path.join('/tmp/kyc-uploads', filename);
  if (fs.existsSync(tmpPath)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', mimeType);
    return res.sendFile(tmpPath);
  }
  return res.status(404).json({ error: 'File not found' });
});`;

if (code.includes(orig)) {
  fs.writeFileSync('backend/server.js', code.replace(orig, replaced));
  console.log('PATCHED');
} else {
  console.log('NOT FOUND');
}
