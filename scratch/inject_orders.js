const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

// Acknowledge Order
const ackTarget = `app.patch('/api/orders/:id/acknowledge', async (req, res) => {
  const stockistId = req.headers['x-user-id'];
  if (!stockistId) return res.status(403).json({ error: 'Unauthorized' });
  
  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === req.params.id);
  if (!order || order.stockist_id !== stockistId) {
    return res.status(404).json({ error: 'Order not found' });
  }`;
const ackReplace = `app.patch('/api/orders/:id/acknowledge', requireAuth, async (req, res) => {
  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!(await assertOrderAccess(req, res, order))) return;`;
code = code.replace(ackTarget, ackReplace);

// noshw-action
const noshwTarget = `app.post('/api/orders/:id/noshw-action', async (req, res) => {
  const { id } = req.params;
  const { action, newSlot } = req.body;

  if (!['RESCHEDULE', 'CANCEL'].includes(action)) {
    return res.status(400).json({ error: 'action must be RESCHEDULE or CANCEL' });
  }

  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });`;
const noshwReplace = `app.post('/api/orders/:id/noshw-action', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { action, newSlot } = req.body;

  if (!['RESCHEDULE', 'CANCEL'].includes(action)) {
    return res.status(400).json({ error: 'action must be RESCHEDULE or CANCEL' });
  }

  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!(await assertOrderAccess(req, res, order))) return;`;
code = code.replace(noshwTarget, noshwReplace);

// cancel
const cancelTarget = `app.post('/api/orders/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });`;
const cancelReplace = `app.post('/api/orders/:id/cancel', requireAuth, async (req, res) => {
  const { id } = req.params;
  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!(await assertOrderAccess(req, res, order))) return;`;
code = code.replace(cancelTarget, cancelReplace);

// verify-pickup
const verifyTarget = `app.post('/api/orders/:id/verify-pickup', async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;
  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });`;
const verifyReplace = `app.post('/api/orders/:id/verify-pickup', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;
  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!(await assertOrderAccess(req, res, order))) return;`;
code = code.replace(verifyTarget, verifyReplace);

// fulfillment
const fulfillTarget = `app.patch('/api/orders/:id/fulfillment', async (req, res) => {
  const { id } = req.params;
  const { fulfillmentType, pickupSlot } = req.body;

  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });`;
const fulfillReplace = `app.patch('/api/orders/:id/fulfillment', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { fulfillmentType, pickupSlot } = req.body;

  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (!(await assertOrderAccess(req, res, order))) return;`;
code = code.replace(fulfillTarget, fulfillReplace);

// Products and Stockist profile
const patchProductTarget = `app.patch('/api/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const products = await db.getTable('products');
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });`;
const patchProductReplace = `app.patch('/api/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const products = await db.getTable('products');
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (!(await assertOwnsStockist(req, res, product.stockist_id))) return;`;
code = code.replace(patchProductTarget, patchProductReplace);

const getBillTarget = `app.get('/api/products/:id/bill-history', requireAuth, async (req, res) => {
  const { id } = req.params;
  const products = await db.getTable('products');
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });`;
const getBillReplace = `app.get('/api/products/:id/bill-history', requireAuth, async (req, res) => {
  const { id } = req.params;
  const products = await db.getTable('products');
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (!(await assertOwnsStockist(req, res, product.stockist_id))) return;`;
code = code.replace(getBillTarget, getBillReplace);

const patchProfileTarget = `app.patch('/api/stockist/profile', requireAuth, async (req, res) => {
  const stockists = await db.getTable('stockists');
  const idx = stockists.findIndex(s => s.user_id === req.user.userId);
  if (idx === -1) return res.status(404).json({ error: 'Stockist not found' });`;
const patchProfileReplace = `app.patch('/api/stockist/profile', requireAuth, async (req, res) => {
  const stockists = await db.getTable('stockists');
  const idx = stockists.findIndex(s => s.user_id === req.user.userId);
  if (idx === -1) return res.status(404).json({ error: 'Stockist not found' });
  // The route is already intrinsically bound to req.user.userId so no extra auth needed`;
code = code.replace(patchProfileTarget, patchProfileReplace);

fs.writeFileSync('backend/server.js', code, 'utf8');
console.log('Order and Product routes injected');
