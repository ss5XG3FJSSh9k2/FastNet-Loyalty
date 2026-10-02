const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Fix redemption-status/:approval_id requireAuth
code = code.replace(
  "app.get('/api/customer/redemption-status/:approval_id', async",
  "app.get('/api/customer/redemption-status/:approval_id', requireAuth, async"
);

// 2. Fix POST /api/orders and /api/orders/create
code = code.replace(
  "app.post('/api/orders', handleCreateOrderRoute);",
  "app.post('/api/orders', requireAuth, handleCreateOrderRoute);"
);
code = code.replace(
  "app.post('/api/orders/create', handleCreateOrderRoute);",
  "app.post('/api/orders/create', requireAuth, handleCreateOrderRoute);"
);

// 3. Inject assert in handleCreateOrderRoute
const injectTarget = "const handleCreateOrderRoute = async (req, res) => {\n  // Supports both old format { customerId, stockistId, items, fulfillmentType }";
const injectVal = "  if (req.user && req.user.role === 'CUSTOMER' && !assertSelfOrAdmin(req, res, req.body.customerId)) return;\n";
if (!code.includes("assertSelfOrAdmin(req, res, req.body.customerId)")) {
  code = code.replace(injectTarget, injectTarget + '\n' + injectVal);
}

fs.writeFileSync('backend/server.js', code);
