const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const target = `app.post('/api/admin/customers/:id/points-credit', async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason is required' });
  }`;

const replacement = `app.post('/api/admin/customers/:id/points-credit', async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || !Number.isFinite(numAmount) || numAmount <= 0 || numAmount > cfg.MANUAL_CREDIT_MAX_POINTS) {
    return res.status(400).json({ error: 'validation_failed', message: 'Amount must be positive and within limits', fields: { amount: 'Must be > 0 and <= ' + cfg.MANUAL_CREDIT_MAX_POINTS } });
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return res.status(400).json({ error: 'validation_failed', message: 'Reason is required', fields: { reason: 'Must be at least 5 chars' } });
  }`;

code = code.replace(target, replacement);
fs.writeFileSync('backend/server.js', code, 'utf8');
