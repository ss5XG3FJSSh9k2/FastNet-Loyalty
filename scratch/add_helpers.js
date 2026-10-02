const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const helpers = `
// BF-SEC-3 Helpers
function assertSelfOrAdmin(req, res, userId) {
  if (!req.user || !req.user.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  if (req.user.role === 'ADMIN' || req.user.userId === userId) {
    return true;
  }
  res.status(403).json({ error: 'Forbidden' });
  return false;
}

async function getCallerStockist(req) {
  if (!req.user || !req.user.userId) return null;
  const stockists = await db.getTable('stockists');
  return stockists.find(s => s.user_id === req.user.userId) || null;
}

async function assertOwnsStockist(req, res, stockistId) {
  if (!req.user || !req.user.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  if (req.user.role === 'ADMIN') return true;
  const callerStockist = await getCallerStockist(req);
  if (callerStockist && callerStockist.id === stockistId) return true;
  res.status(403).json({ error: 'Forbidden' });
  return false;
}

async function assertOrderAccess(req, res, order) {
  if (!req.user || !req.user.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  if (req.user.role === 'ADMIN') return true;
  if (req.user.role === 'CUSTOMER' && req.user.userId === order.customer_id) return true;
  if (req.user.role === 'STOCKIST') {
    const callerStockist = await getCallerStockist(req);
    if (callerStockist && callerStockist.id === order.stockist_id) return true;
  }
  res.status(403).json({ error: 'Forbidden' });
  return false;
}
`;

// Insert after 'const db = require('./db');' to ensure 'db' is available
code = code.replace(/const db = require\('\.\/db'\);/, "const db = require('./db');\n" + helpers);

fs.writeFileSync('backend/server.js', code, 'utf8');
console.log('Helpers added successfully');
