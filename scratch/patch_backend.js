const fs = require('fs');
const file = 'x:/app/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    search: `const userResults = rejectedOrBlacklistedUsers.map(u => {
    const record = blacklistRecords.find(b => b.user_id === u.id) || {};
    return {
      id: u.id,`,
    replace: `const userResults = rejectedOrBlacklistedUsers.map(u => {
    const record = blacklistRecords.find(b => b.user_id === u.id) || {};
    return {
      source: 'USER',
      id: u.id,`
  },
  {
    search: `const leadResults = rejectedOrBlacklistedLeads.map(l => ({
    id: l.id,`,
    replace: `const leadResults = rejectedOrBlacklistedLeads.map(l => ({
    source: 'LEAD',
    id: l.id,`
  },
  {
    search: `  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
  const user = users[userIndex];`,
    replace: `  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    const partnerLeads = await db.getTable('partner_leads') || [];
    if (partnerLeads.some(l => l.id === userId)) {
      return res.status(409).json({ error: 'wrong_record_type', message: 'This is a partner lead. Use the lead actions.' });
    }
    return res.status(404).json({ error: 'User not found' });
  }
  const user = users[userIndex];`
  },
  {
    search: `  const users = await db.getTable('users');
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });`,
    replace: `  const users = await db.getTable('users');
  const user = users.find(u => u.id === userId);
  if (!user) {
    const partnerLeads = await db.getTable('partner_leads') || [];
    if (partnerLeads.some(l => l.id === userId)) {
      return res.status(409).json({ error: 'wrong_record_type', message: 'This is a partner lead. Use the lead actions.' });
    }
    return res.status(404).json({ error: 'User not found' });
  }`
  }
];

let ok = true;
for (const r of replacements) {
  const normalizedSearch = r.search.replace(/\r\n/g, '\n');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  if (normalizedContent.includes(normalizedSearch)) {
    content = normalizedContent.replace(normalizedSearch, r.replace);
  } else {
    console.log("NOT FOUND:", r.search.slice(0, 50));
    ok = false;
  }
}

if (ok) {
  fs.writeFileSync(file, content);
  console.log("Backend replaced successfully.");
}
