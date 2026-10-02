const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8').replace(/\r\n/g, '\n');

// 1. POST /api/products and /api/stockist/products
const pRegex = /app\.post\(\['\/api\/products', '\/api\/stockist\/products'\], async \(req, res\) => \{\n  let stockistId = req\.headers\['x-user-id'\] \|\| req\.body\.stockistId \|\| req\.body\.stockist_id;/;
const pReplace = `app.post(['/api/products', '/api/stockist/products'], requireAuth, async (req, res) => {\n  let stockistId = req.body.stockistId || req.body.stockist_id;\n  if (!await assertOwnsStockist(req, res, stockistId)) return;`;
code = code.replace(pRegex, pReplace);

// 2. PATCH /api/products/:id
const patchPRegex = /app\.patch\('\/api\/products\/:id', async \(req, res\) => \{\n  const \{ id \} = req\.params;\n  const updates = req\.body;\n\n  const products = await db\.getTable\('products'\);\n  const product = products\.find\(p => p\.id === id\);\n  if \(!product\) return res\.status\(404\)\.json\(\{ error: 'Product not found' \}\);/;
const patchPReplace = `app.patch('/api/products/:id', requireAuth, async (req, res) => {\n  const { id } = req.params;\n  const updates = req.body;\n\n  const products = await db.getTable('products');\n  const product = products.find(p => p.id === id);\n  if (!product) return res.status(404).json({ error: 'Product not found' });\n  if (!await assertOwnsStockist(req, res, product.stockist_id)) return;`;
code = code.replace(patchPRegex, patchPReplace);

// 3. GET /api/products/:id/bill-history
const bhRegex = /app\.get\('\/api\/products\/:id\/bill-history', async \(req, res\) => \{\n  const \{ id \} = req\.params;\n  const products = await db\.getTable\('products'\);\n  const product = products\.find\(p => p\.id === id\);\n  if \(!product\) return res\.status\(404\)\.json\(\{ error: 'Product not found' \}\);/;
const bhReplace = `app.get('/api/products/:id/bill-history', requireAuth, async (req, res) => {\n  const { id } = req.params;\n  const products = await db.getTable('products');\n  const product = products.find(p => p.id === id);\n  if (!product) return res.status(404).json({ error: 'Product not found' });\n  if (!await assertOwnsStockist(req, res, product.stockist_id)) return;`;
code = code.replace(bhRegex, bhReplace);

// 4. PATCH /api/stockist/profile
const spRegex = /app\.patch\('\/api\/stockist\/profile', async \(req, res\) => \{\n  const stockistId = req\.headers\['x-user-id'\];/;
const spReplace = `app.patch('/api/stockist/profile', requireAuth, async (req, res) => {\n  const stockistId = req.headers['x-user-id'] || req.body.stockistId || req.body.stockist_id;\n  if (!await assertOwnsStockist(req, res, stockistId)) return;`;
code = code.replace(spRegex, spReplace);

// 5. POST /api/stockists/restock
const srRegex = /app\.post\('\/api\/stockists\/restock', async \(req, res\) => \{\n  const \{ restockItems \} = req\.body;\n  const stockistId = req\.headers\['x-user-id'\] \|\| req\.body\.stockistId \|\| req\.body\.stockist_id;/;
const srReplace = `app.post('/api/stockists/restock', requireAuth, async (req, res) => {\n  const { restockItems } = req.body;\n  const stockistId = req.body.stockistId || req.body.stockist_id;\n  if (!await assertOwnsStockist(req, res, stockistId)) return;`;
code = code.replace(srRegex, srReplace);

// 6. POST /api/stockist/push-subscription
const subRegex = /app\.post\('\/api\/stockist\/push-subscription', async \(req, res\) => \{\n  const stockistId = req\.headers\['x-user-id'\];\n  if \(!stockistId\) return res\.status\(403\)\.json\(\{ error: 'Unauthorized' \}\);/;
const subReplace = `app.post('/api/stockist/push-subscription', requireAuth, async (req, res) => {\n  const stockistId = req.body.stockistId || req.headers['x-user-id'];\n  if (!await assertOwnsStockist(req, res, stockistId)) return;`;
code = code.replace(subRegex, subReplace);

// 7. GET /api/stockists/:id/stats
const statsRegex = /app\.get\('\/api\/stockists\/:id\/stats', async \(req, res\) => \{\n  const \{ id \} = req\.params;/;
const statsReplace = `app.get('/api/stockists/:id/stats', requireAuth, async (req, res) => {\n  const { id } = req.params;\n  if (!await assertOwnsStockist(req, res, id)) return;`;
code = code.replace(statsRegex, statsReplace);

// 8. GET /api/stockists/:stockistId/vendors
const vendRegex = /app\.get\('\/api\/stockists\/:stockistId\/vendors', async \(req, res\) => \{\n  const \{ stockistId \} = req\.params;/;
const vendReplace = `app.get('/api/stockists/:stockistId/vendors', requireAuth, async (req, res) => {\n  const { stockistId } = req.params;\n  if (!await assertOwnsStockist(req, res, stockistId)) return;`;
code = code.replace(vendRegex, vendReplace);

fs.writeFileSync('backend/server.js', code);
