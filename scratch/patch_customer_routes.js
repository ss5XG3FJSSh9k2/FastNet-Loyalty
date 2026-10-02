const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

function replaceEndpoint(regex, replacement) {
  if (regex.test(code)) {
    code = code.replace(regex, replacement);
    console.log('Replaced', regex.toString().slice(0, 50));
  } else {
    console.error('NOT FOUND', regex.toString().slice(0, 50));
  }
}

// GET /api/ledger/balance/:customerId
replaceEndpoint(
  /(app\.get\('\/api\/ledger\/balance\/:customerId', requireAuth, async \(req, res\) => \{\n)(  const userId = req\.params\.customerId;)/,
  `$1  const userId = req.params.customerId;\n  if (!assertSelfOrAdmin(req, res, userId)) return;`
);

// GET /api/ledger/history/:customerId
replaceEndpoint(
  /(app\.get\('\/api\/ledger\/history\/:customerId', requireAuth, async \(req, res\) => \{\n)(  const userId = req\.params\.customerId;)/,
  `$1  const userId = req.params.customerId;\n  if (!assertSelfOrAdmin(req, res, userId)) return;`
);

// POST /api/ledger/redeem
replaceEndpoint(
  /(app\.post\('\/api\/ledger\/redeem', requireAuth, async \(req, res\) => \{\n)(  const \{ customerId, rewardId \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, customerId)) return;`
);

// GET /api/customer/rewards/available/:customerUserId
replaceEndpoint(
  /(app\.get\('\/api\/customer\/rewards\/available\/:customerUserId', requireAuth, async \(req, res\) => \{\n)(  const \{ customerUserId \} = req\.params;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, customerUserId)) return;`
);

// GET /api/customer/available-rewards (?customerId)
replaceEndpoint(
  /(app\.get\('\/api\/customer\/available-rewards', requireAuth, async \(req, res\) => \{\n)(  const customerId = req\.query\.customerId;)/,
  `$1$2\n  if (!customerId) return res.status(400).json({error: 'customerId required'});\n  if (!assertSelfOrAdmin(req, res, customerId)) return;`
);

// GET /api/customer/:id/profile
replaceEndpoint(
  /(app\.get\('\/api\/customer\/:id\/profile', requireAuth, async \(req, res\) => \{\n)(  const \{ id \} = req\.params;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, id)) return;`
);

// POST /api/customer/:id/profile
replaceEndpoint(
  /(app\.post\('\/api\/customer\/:id\/profile', requireAuth, async \(req, res\) => \{\n)(  const \{ id \} = req\.params;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, id)) return;`
);

// GET /api/customer/partner-bindings
replaceEndpoint(
  /(app\.get\('\/api\/customer\/partner-bindings', requireAuth, async \(req, res\) => \{\n)(  const customer_user_id = req\.query\.customer_user_id;)/,
  `$1$2\n  if (customer_user_id && !assertSelfOrAdmin(req, res, customer_user_id)) return;`
);

// POST /api/customer/partner-bindings
replaceEndpoint(
  /(app\.post\('\/api\/customer\/partner-bindings', requireAuth, async \(req, res\) => \{\n)(  const \{ customer_user_id, partner_id, consent_status \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, customer_user_id)) return;`
);

// PATCH /api/customer/partner-bindings/:id
// The parameter is the binding ID, so we need to find the binding first.
replaceEndpoint(
  /(app\.patch\('\/api\/customer\/partner-bindings\/:id', requireAuth, async \(req, res\) => \{\n)(  const \{ id \} = req\.params;\n  const \{ consent_status \} = req\.body;\n\n  const bindings = await db\.getTable\('customer_partner_binding'\);\n  const binding = bindings\.find\(b => b\.id === id\);\n  if \(!binding\) return res\.status\(404\)\.json\(\{ error: 'Binding not found' \}\);)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, binding.customer_user_id)) return;`
);

// GET /api/customer/redemptions/:customerUserId
replaceEndpoint(
  /(app\.get\('\/api\/customer\/redemptions\/:customerUserId', requireAuth, async \(req, res\) => \{\n)(  const \{ customerUserId \} = req\.params;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, customerUserId)) return;`
);

// GET /api/customer/redemption-status/:approval_id
replaceEndpoint(
  /(app\.get\('\/api\/customer\/redemption-status\/:approval_id', requireAuth, async \(req, res\) => \{\n)(  const \{ approval_id \} = req\.params;\n  const approvals = await db\.getTable\('bf_cb_approval_locks'\);\n  const approval = approvals\.find\(a => a\.id === approval_id\);\n  if \(!approval\) return res\.status\(404\)\.json\(\{ error: 'Approval not found' \}\);)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, approval.customer_user_id)) return;`
);

// POST /api/customer/phone-change/request
replaceEndpoint(
  /(app\.post\('\/api\/customer\/phone-change\/request', requireAuth, async \(req, res\) => \{\n)(  const \{ userId, newPhone \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, userId)) return;`
);

// POST /api/customer/phone-change/verify
replaceEndpoint(
  /(app\.post\('\/api\/customer\/phone-change\/verify', requireAuth, async \(req, res\) => \{\n)(  const \{ userId, otp \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, userId)) return;`
);

// POST /api/customer/region-change
replaceEndpoint(
  /(app\.post\('\/api\/customer\/region-change', requireAuth, async \(req, res\) => \{\n)(  const \{ user_id, new_region_id \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, user_id)) return;`
);

// POST /api/customer/fraud-reports
replaceEndpoint(
  /(app\.post\('\/api\/customer\/fraud-reports', requireAuth, async \(req, res\) => \{\n)(  const \{ reporter_user_id, reported_stockist_id, reason, details \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, reporter_user_id)) return;`
);

// POST /api/feedback
replaceEndpoint(
  /(app\.post\('\/api\/feedback', requireAuth, async \(req, res\) => \{\n)(  const \{ reporterId, text \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, reporterId)) return;`
);

// POST /api/orders
replaceEndpoint(
  /(app\.post\('\/api\/orders', requireAuth, async \(req, res\) => \{\n)(  const \{ customerId, items, stores, deliveryAddress, pickupSlot, paymentMethod = 'COD', fulfillmentType, fulfillmentMode, coupon_reward_id, cartId \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, customerId)) return;`
);

// POST /api/orders/create
replaceEndpoint(
  /(app\.post\('\/api\/orders\/create', requireAuth, async \(req, res\) => \{\n)(  const \{ customerId, items, stores, deliveryAddress, pickupSlot, paymentMethod = 'COD', fulfillmentType, fulfillmentMode, coupon_reward_id \} = req\.body;)/,
  `$1$2\n  if (!assertSelfOrAdmin(req, res, customerId)) return;`
);

fs.writeFileSync('backend/server.js', code);
