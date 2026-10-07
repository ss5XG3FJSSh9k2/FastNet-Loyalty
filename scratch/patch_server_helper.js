const fs = require('fs');
const file = 'x:/app/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add require
content = content.replace(
  "const db = require('./db');",
  "const db = require('./db');\nconst { validatePayoutFields } = require('./lib/payout');"
);

// 2. Add capturePayoutEvent
const captureFn = `
async function capturePayoutEvent(req, entityType, entityId, before, finalEntity, userId) {
  const fields = [];
  if ((before.payout_upi_id || '') !== (finalEntity.payout_upi_id || '')) fields.push('UPI');
  const ifscKey = entityType === 'partner' ? 'payout_bank_ifsc' : 'payout_ifsc';
  if ((before[ifscKey] || '') !== (finalEntity[ifscKey] || '')) fields.push('IFSC');
  if ((before.payout_bank_account || '') !== (finalEntity.payout_bank_account || '')) fields.push('Bank Account');
  if ((before.payout_account_name || '') !== (finalEntity.payout_account_name || '')) fields.push('Account Name');

  if (fields.length > 0) {
    const mask = (acc) => acc && acc.length > 4 ? '...' + acc.slice(-4) : acc;
    const beforeMasked = { ...before, payout_bank_account: mask(before.payout_bank_account) };
    const finalMasked = { ...finalEntity, payout_bank_account: mask(finalEntity.payout_bank_account) };
    await appendAudit(req, 'PAYOUT_DETAILS_CHANGED', entityType, entityId, beforeMasked, finalMasked, 'Fields changed: ' + fields.join(', '));
  }
}
`;
content = content.replace('async function appendAudit', captureFn + '\nasync function appendAudit');

// 3. Admin routes
const adminRoutes = `
app.get('/api/admin/payout-notices', requireRole('ADMIN'), async (req, res) => {
  const auditLog = await db.getTable('admin_audit_log');
  const notices = auditLog
    .filter(a => a.action === 'PAYOUT_DETAILS_CHANGED')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ notices });
});

app.post('/api/admin/payout-notices/:id/review', requireRole('ADMIN'), async (req, res) => {
  const auditLog = await db.getTable('admin_audit_log');
  const notice = auditLog.find(a => a.id === req.params.id && a.action === 'PAYOUT_DETAILS_CHANGED');
  if (!notice) return res.status(404).json({ error: 'Notice not found' });
  
  notice.reviewed_at = new Date().toISOString();
  notice.reviewed_by = req.user.userId;
  await db.saveTable('admin_audit_log', auditLog);
  res.json({ success: true });
});
`;
content = content.replace("app.get('/api/admin/dashboard'", adminRoutes + "\napp.get('/api/admin/dashboard'");

// Write back temporarily to check the structure
fs.writeFileSync(file, content);
console.log('Added helper and admin routes.');
