const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8').replace(/\r\n/g, '\n');

function authRoute(method, path) {
  const def = `app.${method}('${path}', async`;
  code = code.replace(def, `app.${method}('${path}', requireAuth, async`);
}

authRoute('get', '/api/orders');
authRoute('post', '/api/orders/:id/cancel');
authRoute('post', '/api/orders/:id/noshw-action');
authRoute('post', '/api/orders/:id/verify-pickup');
authRoute('patch', '/api/orders/:id/acknowledge');
authRoute('patch', '/api/orders/:id/fulfillment');
authRoute('post', '/api/orders/sync');

// Patch GET /api/orders body
const getOrdersRegex = /app\.get\('\/api\/orders', requireAuth, async \(req, res\) => \{\n  const \{ customerId, stockistId \} = req\.query;/;
const getOrdersReplacement = `app.get('/api/orders', requireAuth, async (req, res) => {
  let { customerId, stockistId } = req.query;
  if (req.user.role === 'CUSTOMER') {
    if (customerId && customerId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
    customerId = req.user.userId;
  } else if (req.user.role === 'STOCKIST') {
    const callerStockist = await getCallerStockist(req);
    if (!callerStockist) return res.status(403).json({ error: 'Forbidden' });
    if (stockistId && stockistId !== callerStockist.id) return res.status(403).json({ error: 'Forbidden' });
    stockistId = callerStockist.id;
  }`;
code = code.replace(getOrdersRegex, getOrdersReplacement);

// Patch POST /api/orders/:id/cancel
const cancelRegex = /app\.post\('\/api\/orders\/:id\/cancel', requireAuth, async \(req, res\) => \{\n  const \{ id \} = req\.params;\n  const orders = await db\.getTable\('orders'\);\n  const order = orders\.find\(o => o\.id === id\);\n  if \(!order\) return res\.status\(404\)\.json\(\{ error: 'Order not found' \}\);/;
const cancelReplacement = `app.post('/api/orders/:id/cancel', requireAuth, async (req, res) => {\n  const { id } = req.params;\n  const orders = await db.getTable('orders');\n  const order = orders.find(o => o.id === id);\n  if (!order) return res.status(404).json({ error: 'Order not found' });\n  if (req.user.role !== 'ADMIN' && req.user.userId !== order.customer_id) return res.status(403).json({ error: 'Forbidden' });`;
code = code.replace(cancelRegex, cancelReplacement);

// Patch POST /api/orders/:id/verify-pickup
const verifyRegex = /app\.post\('\/api\/orders\/:id\/verify-pickup', requireAuth, async \(req, res\) => \{\n  const \{ id \} = req\.params;\n  const \{ pin \} = req\.body;\n\n  const orders = await db\.getTable\('orders'\);\n  const order = orders\.find\(o => o\.id === id\);\n  if \(!order\) return res\.status\(404\)\.json\(\{ error: 'Order not found' \}\);/;
const verifyReplacement = `app.post('/api/orders/:id/verify-pickup', requireAuth, async (req, res) => {\n  const { id } = req.params;\n  const { pin } = req.body;\n\n  const orders = await db.getTable('orders');\n  const order = orders.find(o => o.id === id);\n  if (!order) return res.status(404).json({ error: 'Order not found' });\n  if (req.user.role !== 'ADMIN') {\n    const callerStockist = await getCallerStockist(req);\n    if (!callerStockist || callerStockist.id !== order.stockist_id) return res.status(403).json({ error: 'Forbidden' });\n  }`;
code = code.replace(verifyRegex, verifyReplacement);

// Patch POST /api/orders/:id/noshw-action
const noshwRegex = /app\.post\('\/api\/orders\/:id\/noshw-action', requireAuth, async \(req, res\) => \{\n  const \{ id \} = req\.params;\n  const \{ action, newSlot \} = req\.body;\n\n  if \(!\['RESCHEDULE', 'CANCEL'\]\.includes\(action\)\) \{\n    return res\.status\(400\)\.json\(\{ error: 'action must be RESCHEDULE or CANCEL' \}\);\n  \}\n\n  const orders = await db\.getTable\('orders'\);\n  const order = orders\.find\(o => o\.id === id\);\n  if \(!order\) return res\.status\(404\)\.json\(\{ error: 'Order not found' \}\);/;
const noshwReplacement = `app.post('/api/orders/:id/noshw-action', requireAuth, async (req, res) => {\n  const { id } = req.params;\n  const { action, newSlot } = req.body;\n\n  if (!['RESCHEDULE', 'CANCEL'].includes(action)) {\n    return res.status(400).json({ error: 'action must be RESCHEDULE or CANCEL' });\n  }\n\n  const orders = await db.getTable('orders');\n  const order = orders.find(o => o.id === id);\n  if (!order) return res.status(404).json({ error: 'Order not found' });\n  if (!await assertOrderAccess(req, res, order)) return;\n  if (req.user.role === 'STOCKIST') return res.status(403).json({ error: 'Forbidden' });`;
code = code.replace(noshwRegex, noshwReplacement);

// Patch PATCH /api/orders/:id/acknowledge
const ackRegex = /app\.patch\('\/api\/orders\/:id\/acknowledge', requireAuth, async \(req, res\) => \{\n  const stockistId = req\.headers\['x-user-id'\];\n  if \(!stockistId\) return res\.status\(403\)\.json\(\{ error: 'Unauthorized' \}\);\n  \n  const orders = await db\.getTable\('orders'\);\n  const order = orders\.find\(o => o\.id === req\.params\.id\);\n  if \(!order || order\.stockist_id !== stockistId\) \{\n    return res\.status\(404\)\.json\(\{ error: 'Order not found' \}\);\n  \}/;
const ackReplacement = `app.patch('/api/orders/:id/acknowledge', requireAuth, async (req, res) => {\n  const orders = await db.getTable('orders');\n  const order = orders.find(o => o.id === req.params.id);\n  if (!order) return res.status(404).json({ error: 'Order not found' });\n  if (req.user.role !== 'ADMIN') {\n    const callerStockist = await getCallerStockist(req);\n    if (!callerStockist || callerStockist.id !== order.stockist_id) return res.status(403).json({ error: 'Forbidden' });\n  }`;
code = code.replace(ackRegex, ackReplacement);

// Patch PATCH /api/orders/:id/fulfillment
const fulRegex = /app\.patch\('\/api\/orders\/:id\/fulfillment', requireAuth, async \(req, res\) => \{\n  const \{ id \} = req\.params;\n  const \{ fulfillmentType, pickupSlot \} = req\.body;\n\n  const orders = await db\.getTable\('orders'\);\n  const order = orders\.find\(o => o\.id === id\);\n  if \(!order\) return res\.status\(404\)\.json\(\{ error: 'Order not found' \}\);/;
const fulReplacement = `app.patch('/api/orders/:id/fulfillment', requireAuth, async (req, res) => {\n  const { id } = req.params;\n  const { fulfillmentType, pickupSlot } = req.body;\n\n  const orders = await db.getTable('orders');\n  const order = orders.find(o => o.id === id);\n  if (!order) return res.status(404).json({ error: 'Order not found' });\n  if (!await assertOrderAccess(req, res, order)) return;\n  if (req.user.role === 'STOCKIST') return res.status(403).json({ error: 'Forbidden' });`;
code = code.replace(fulRegex, fulReplacement);

// Patch POST /api/orders/sync
const syncRegex = /app\.post\('\/api\/orders\/sync', requireAuth, async \(req, res\) => \{\n  const \{ updates \} = req\.body;\n  if \(!Array\.isArray\(updates\)\) return res\.status\(400\)\.json\(\{ error: 'Invalid updates format' \}\);/;
const syncReplacement = `app.post('/api/orders/sync', requireAuth, async (req, res) => {\n  const { updates } = req.body;\n  if (!Array.isArray(updates)) return res.status(400).json({ error: 'Invalid updates format' });\n  if (req.user.role !== 'ADMIN') {\n    for (const update of updates) {\n      if (update.customer_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });\n    }\n  }`;
code = code.replace(syncRegex, syncReplacement);


fs.writeFileSync('backend/server.js', code);
