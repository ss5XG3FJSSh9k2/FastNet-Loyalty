const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8').replace(/\r\n/g, '\n');

function injectAfter(searchString, injection) {
  const index = code.indexOf(searchString);
  if (index !== -1) {
    code = code.slice(0, index + searchString.length) + '\n  ' + injection + code.slice(index + searchString.length);
    console.log('Injected after:', searchString.slice(0, 40));
  } else {
    console.log('NOT FOUND:', searchString.slice(0, 40));
  }
}

injectAfter("app.get('/api/ledger/balance/:customerId', requireAuth, async (req, res) => {\n  const userId = req.params.customerId;", "if (!assertSelfOrAdmin(req, res, userId)) return;");
injectAfter("app.get('/api/ledger/history/:customerId', requireAuth, async (req, res) => {\n  const userId = req.params.customerId;", "if (!assertSelfOrAdmin(req, res, userId)) return;");
injectAfter("app.post('/api/ledger/redeem', requireAuth, async (req, res) => {\n  const { customerId, rewardId } = req.body;", "if (!assertSelfOrAdmin(req, res, customerId)) return;");
injectAfter("app.get('/api/customer/rewards/available/:customerUserId', requireAuth, async (req, res) => {\n  const { customerUserId } = req.params;", "if (!assertSelfOrAdmin(req, res, customerUserId)) return;");
injectAfter("app.get('/api/customer/available-rewards', requireAuth, async (req, res) => {\n  const customerId = req.query.customerId;", "if (!customerId) return res.status(400).json({error: 'customerId required'});\n  if (!assertSelfOrAdmin(req, res, customerId)) return;");
injectAfter("app.get('/api/customer/:id/profile', requireAuth, async (req, res) => {\n  const { id } = req.params;", "if (!assertSelfOrAdmin(req, res, id)) return;");
injectAfter("app.post('/api/customer/:id/profile', requireAuth, async (req, res) => {\n  const { id } = req.params;", "if (!assertSelfOrAdmin(req, res, id)) return;");
injectAfter("app.get('/api/customer/partner-bindings', requireAuth, async (req, res) => {\n  const customer_user_id = req.query.customer_user_id;", "if (customer_user_id && !assertSelfOrAdmin(req, res, customer_user_id)) return;");
injectAfter("app.post('/api/customer/partner-bindings', requireAuth, async (req, res) => {\n  const { customer_user_id, partner_id, consent_status } = req.body;", "if (!assertSelfOrAdmin(req, res, customer_user_id)) return;");
const patchBindingTgt = "app.patch('/api/customer/partner-bindings/:id', requireAuth, async (req, res) => {\n  const { id } = req.params;\n  const { consent_status } = req.body;\n\n  const bindings = await db.getTable('customer_partner_binding');\n  const binding = bindings.find(b => b.id === id);\n  if (!binding) return res.status(404).json({ error: 'Binding not found' });";
injectAfter(patchBindingTgt, "if (!assertSelfOrAdmin(req, res, binding.customer_user_id)) return;");
injectAfter("app.get('/api/customer/redemptions/:customerUserId', requireAuth, async (req, res) => {\n  const { customerUserId } = req.params;", "if (!assertSelfOrAdmin(req, res, customerUserId)) return;");
const getApprovalTgt = "app.get('/api/customer/redemption-status/:approval_id', requireAuth, async (req, res) => {\n  const { approval_id } = req.params;\n  const approvals = await db.getTable('bf_cb_approval_locks');\n  const approval = approvals.find(a => a.id === approval_id);\n  if (!approval) return res.status(404).json({ error: 'Approval not found' });";
injectAfter(getApprovalTgt, "if (!assertSelfOrAdmin(req, res, approval.customer_user_id)) return;");
injectAfter("app.post('/api/customer/phone-change/request', requireAuth, async (req, res) => {\n  const { userId, newPhone } = req.body;", "if (!assertSelfOrAdmin(req, res, userId)) return;");
injectAfter("app.post('/api/customer/phone-change/verify', requireAuth, async (req, res) => {\n  const { userId, otp } = req.body;", "if (!assertSelfOrAdmin(req, res, userId)) return;");
injectAfter("app.post('/api/customer/region-change', requireAuth, async (req, res) => {\n  const { user_id, new_region_id } = req.body;", "if (!assertSelfOrAdmin(req, res, user_id)) return;");
injectAfter("app.post('/api/customer/fraud-reports', requireAuth, async (req, res) => {\n  const { reporter_user_id, reported_stockist_id, reason, details } = req.body;", "if (!assertSelfOrAdmin(req, res, reporter_user_id)) return;");
injectAfter("app.post('/api/feedback', requireAuth, async (req, res) => {\n  const { reporterId, text } = req.body;", "if (!assertSelfOrAdmin(req, res, reporterId)) return;");
injectAfter("app.post('/api/orders', requireAuth, async (req, res) => {\n  const { customerId, items, stores, deliveryAddress, pickupSlot, paymentMethod = 'COD', fulfillmentType, fulfillmentMode, coupon_reward_id, cartId } = req.body;", "if (req.user && req.user.role === 'CUSTOMER' && !assertSelfOrAdmin(req, res, customerId)) return;");
injectAfter("app.post('/api/orders/create', requireAuth, async (req, res) => {\n  const { customerId, items, stores, deliveryAddress, pickupSlot, paymentMethod = 'COD', fulfillmentType, fulfillmentMode, coupon_reward_id } = req.body;", "if (req.user && req.user.role === 'CUSTOMER' && !assertSelfOrAdmin(req, res, customerId)) return;");

fs.writeFileSync('backend/server.js', code);
