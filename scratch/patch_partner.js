const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const partnerRoutesRegex = /app\.(get|post|patch|delete|put)\('(\/api\/partner\/(?!auth\/)[^']+)', async \(req, res\) => \{/g;
code = code.replace(partnerRoutesRegex, "app.$1('$2', requireAuth, async (req, res) => {");

// Manually patch /api/partner/auth/session if needed? Let's leave it as is if it's auth/

fs.writeFileSync('backend/server.js', code);
console.log('PATCHED PARTNER ROUTES');
