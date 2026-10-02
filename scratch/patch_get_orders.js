const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const targetGetOrders = `app.get('/api/orders', requireAuth, async (req, res) => {
  const { customerId, stockistId, status, dateFrom, dateTo } = req.query;`;
const replaceGetOrders = `app.get('/api/orders', requireAuth, async (req, res) => {
  let { customerId, stockistId, status, dateFrom, dateTo } = req.query;
  if (req.user.role === 'CUSTOMER') {
    if (customerId && customerId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
    customerId = req.user.userId;
  } else if (req.user.role === 'STOCKIST') {
    const callerStockist = await getCallerStockist(req);
    if (!callerStockist) return res.status(403).json({ error: 'Forbidden' });
    if (stockistId && stockistId !== callerStockist.id) return res.status(403).json({ error: 'Forbidden' });
    stockistId = callerStockist.id;
  }`;

code = code.replace(targetGetOrders, replaceGetOrders);

fs.writeFileSync('backend/server.js', code, 'utf8');
console.log('GET /api/orders patched');
