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

// 1. Customer-scoped routes
injectAfter("app.get('/api/ledger/balance/:customerId', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.params.customerId)) return;");
injectAfter("app.get('/api/ledger/history/:customerId', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.params.customerId)) return;");
injectAfter("app.get('/api/customer/:id/profile', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.params.id)) return;");
injectAfter("app.post('/api/customer/:id/profile', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.params.id)) return;");
injectAfter("app.post('/api/customer/partner-bindings', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.body.customer_user_id)) return;");
injectAfter("app.get('/api/customer/redemptions/:customerUserId', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.params.customerUserId)) return;");

// Redeem route needs body extraction first
injectAfter("app.post('/api/ledger/redeem', requireAuth, async (req, res) => {", "  const targetRedeemId = req.body.customer_user_id || req.body.customerId;\n  if (!assertSelfOrAdmin(req, res, targetRedeemId)) return;");

// Feedback route
injectAfter("app.post('/api/feedback', requireAuth, async (req, res) => {", "  const reporterId = req.body.reporterId || req.user.userId;\n  if (!assertSelfOrAdmin(req, res, reporterId)) return;");

// Fraud report
injectAfter("app.post('/api/customer/fraud-reports', requireAuth, async (req, res) => {", "  if (!assertSelfOrAdmin(req, res, req.body.customer_user_id)) return;");

fs.writeFileSync('backend/server.js', code, 'utf8');
console.log('Customer routes injected');
