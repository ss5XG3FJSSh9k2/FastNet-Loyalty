const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

function rep(target, replacement) {
  if (code.includes(target)) {
    code = code.replace(target, replacement);
  } else {
    console.log('NOT FOUND:', target.slice(0, 50));
  }
}

// Fix POST /api/customer/:id/profile
rep(
  "app.post('/api/customer/:id/profile', async",
  "app.post('/api/customer/:id/profile', requireAuth, async"
);

// STOCKIST ENDPOINTS
rep(
  "app.patch('/api/stockist/profile', async",
  "app.patch('/api/stockist/profile', requireAuth, async"
);
rep(
  "const stockistId = req.headers['x-user-id'];\n  if (!stockistId) return res.status(403).json({ error: 'Unauthorized' });\n  const updates = req.body;",
  "const stockistId = req.headers['x-user-id'];\n  if (!await assertOwnsStockist(req, res, stockistId)) return;\n  const updates = req.body;"
);

rep(
  "app.post('/api/stockist/push-subscription', async",
  "app.post('/api/stockist/push-subscription', requireAuth, async"
);
rep(
  "const stockistId = req.headers['x-user-id'];\n  if (!stockistId) return res.status(403).json({ error: 'Unauthorized' });\n  const subscription",
  "const stockistId = req.headers['x-user-id'];\n  if (!await assertOwnsStockist(req, res, stockistId)) return;\n  const subscription"
);

rep(
  "app.post('/api/stockists/restock', async",
  "app.post('/api/stockists/restock', requireAuth, async"
);
rep(
  "const { restockItems } = req.body;\n  const stockistId = req.headers['x-user-id'] || req.body.stockistId || req.body.stockist_id;\n\n  if (!stockistId)",
  "const { restockItems } = req.body;\n  const stockistId = req.headers['x-user-id'] || req.body.stockistId || req.body.stockist_id;\n  if (!await assertOwnsStockist(req, res, stockistId)) return;\n\n  if (!stockistId)"
);

rep(
  "app.get('/api/stockists/:id/stats', async",
  "app.get('/api/stockists/:id/stats', requireAuth, async"
);
rep(
  "const { id } = req.params;\n  const stockists",
  "const { id } = req.params;\n  if (!await assertOwnsStockist(req, res, id)) return;\n  const stockists"
);

rep(
  "app.patch('/api/products/:id', async",
  "app.patch('/api/products/:id', requireAuth, async"
);
rep(
  "const product = products.find(p => p.id === id);\n  if (!product) return res.status(404).json({ error: 'Product not found' });",
  "const product = products.find(p => p.id === id);\n  if (!product) return res.status(404).json({ error: 'Product not found' });\n  if (!await assertOwnsStockist(req, res, product.stockist_id)) return;"
);

rep(
  "app.get('/api/products/:id/bill-history', async",
  "app.get('/api/products/:id/bill-history', requireAuth, async"
);
rep(
  "const product = products.find(p => p.id === id);\n  if (!product) return res.status(404).json({ error: 'Product not found' });",
  "const product = products.find(p => p.id === id);\n  if (!product) return res.status(404).json({ error: 'Product not found' });\n  if (!await assertOwnsStockist(req, res, product.stockist_id)) return;"
);

// POST products
rep(
  "app.post(['/api/products', '/api/stockist/products'], async",
  "app.post(['/api/products', '/api/stockist/products'], requireAuth, async"
);
rep(
  "let stockistId = req.headers['x-user-id'] || req.body.stockistId || req.body.stockist_id;\n\n  if (!stockistId)",
  "let stockistId = req.headers['x-user-id'] || req.body.stockistId || req.body.stockist_id;\n  if (!await assertOwnsStockist(req, res, stockistId)) return;\n\n  if (!stockistId)"
);

// Hiding pickup_pin in enrichOrder
rep(
  "const platformPayout = payout ? parseFloat(payout.platform_amount) : (platformCommission + (o.low_order_fee || 0));\n\n  return {\n    ...o,",
  "const platformPayout = payout ? parseFloat(payout.platform_amount) : (platformCommission + (o.low_order_fee || 0));\n\n  let strippedPin = o.pickup_pin;\n  if (req && req.user && req.user.role !== 'ADMIN' && req.user.role !== 'CUSTOMER') {\n    strippedPin = undefined;\n  } else if (!req || !req.user) {\n    strippedPin = undefined;\n  }\n\n  return {\n    ...o,\n    pickup_pin: strippedPin,"
);


fs.writeFileSync('backend/server.js', code);
