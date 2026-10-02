const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

function injectAfter(pattern, injection) {
  const lines = code.split('\n');
  for (let i=0; i<lines.length; i++) {
    if (lines[i].includes(pattern)) {
      lines.splice(i+1, 0, injection);
      code = lines.join('\n');
      return true;
    }
  }
  return false;
}

// 1. More Customer routes
injectAfter("app.get('/api/customer/partner-bindings/:customerUserId', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.params.customerUserId)) return;");
injectAfter("app.post('/api/customer/phone-change/request', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.user.userId)) return;"); // The body only has current_phone, new_phone. Caller is req.user.userId implicitly
injectAfter("app.post('/api/customer/phone-change/verify', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.user.userId)) return;"); // Same
injectAfter("app.post('/api/customer/region-change', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.user.userId)) return;"); // Uses req.user.userId

// 2. Orders (Creation)
injectAfter("app.post('/api/orders', requireAuth, async (req, res) => {", "  if (req.user.role === 'CUSTOMER' && !assertSelfOrAdmin(req, res, req.body.customerId)) return;");
injectAfter("app.post('/api/orders/create', requireAuth, async (req, res) => {", "  if (req.user.role === 'CUSTOMER' && !assertSelfOrAdmin(req, res, req.body.customerId)) return;");
injectAfter("app.post('/api/orders/sync', requireAuth, async (req, res) => {", "  const orders = Array.isArray(req.body) ? req.body : [];\n  if (req.user.role === 'CUSTOMER') {\n    for (const o of orders) {\n      if (o.customer_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden cross-customer sync' });\n    }\n  }");

// 3. Stockist routes
injectAfter("app.post('/api/products', requireAuth, async (req, res) => {", "  if (!(await assertOwnsStockist(req, res, req.body.stockist_id))) return;");
injectAfter("app.post('/api/stockist/products', requireAuth, async (req, res) => {", "  if (!(await assertOwnsStockist(req, res, req.body.stockist_id))) return;");
injectAfter("app.post('/api/stockists/restock', requireAuth, async (req, res) => {", "  if (!(await assertOwnsStockist(req, res, req.body.stockist_id))) return;");
injectAfter("app.post('/api/stockist/push-subscription', requireAuth, async (req, res) => {", "  if (!(await assertOwnsStockist(req, res, req.body.stockist_id))) return;");
injectAfter("app.get('/api/stockists/:id/stats', requireAuth, async (req, res) => {", "  if (!(await assertOwnsStockist(req, res, req.params.id))) return;");
injectAfter("app.get('/api/stockists/:stockistId/vendors', requireAuth, async (req, res) => {", "  if (!(await assertOwnsStockist(req, res, req.params.stockistId))) return;");

fs.writeFileSync('backend/server.js', code, 'utf8');
console.log('Stockist routes injected');
