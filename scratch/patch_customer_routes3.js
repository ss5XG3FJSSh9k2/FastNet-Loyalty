const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

function inject(routeDef, argNames, injectStr) {
  // routeDef could be like "app.get('/api/ledger/balance/:customerId'"
  // We want to find `routeDef, ... async (req, res) => {\n` or similar
  // and insert `injectStr` right after the line containing `argNames`
  
  const idx = code.indexOf(routeDef);
  if (idx === -1) {
    console.error('NOT FOUND routeDef:', routeDef);
    return;
  }
  
  let searchStr = "";
  let argLineIdx = -1;
  
  // Find the exact line in this block that contains argNames
  const lines = code.split('\n');
  const lineIdx = code.substring(0, idx).split('\n').length - 1;
  
  for (let i = lineIdx; i < lineIdx + 15; i++) {
    if (lines[i].includes(argNames)) {
      argLineIdx = i;
      break;
    }
  }
  
  if (argLineIdx === -1) {
    console.error('NOT FOUND argNames:', argNames, 'near', routeDef);
    return;
  }
  
  if (lines[argLineIdx + 1].includes('assertSelfOrAdmin')) {
    console.log('ALREADY INJECTED:', routeDef);
    return;
  }
  
  lines.splice(argLineIdx + 1, 0, '  ' + injectStr);
  code = lines.join('\n');
  console.log('SUCCESS INJECT:', routeDef);
}

inject("app.get('/api/ledger/balance/:customerId'", "const customerId = req.params.customerId;", "if (!assertSelfOrAdmin(req, res, customerId)) return;");
inject("app.get('/api/ledger/history/:customerId'", "const customerId = req.params.customerId;", "if (!assertSelfOrAdmin(req, res, customerId)) return;");
inject("app.post('/api/ledger/redeem'", "const { customerId,", "if (!assertSelfOrAdmin(req, res, customerId)) return;");
inject("app.get('/api/customer/rewards/available/:customerUserId'", "const { customerUserId } = req.params;", "if (!assertSelfOrAdmin(req, res, customerUserId)) return;");
inject("app.get('/api/customer/available-rewards'", "const customerId = req.query.customerId;", "if (!customerId) return res.status(400).json({error: 'customerId required'});\n  if (!assertSelfOrAdmin(req, res, customerId)) return;");
inject("app.get('/api/customer/:id/profile'", "const { id } = req.params;", "if (!assertSelfOrAdmin(req, res, id)) return;");
inject("app.post('/api/customer/:id/profile'", "const { id } = req.params;", "if (!assertSelfOrAdmin(req, res, id)) return;");
inject("app.get('/api/customer/partner-bindings'", "const customer_user_id = req.query.customer_user_id;", "if (customer_user_id && !assertSelfOrAdmin(req, res, customer_user_id)) return;");
inject("app.post('/api/customer/partner-bindings'", "const { customer_user_id,", "if (!assertSelfOrAdmin(req, res, customer_user_id)) return;");

// PATCH binding special logic
const patchBindingRoute = "app.patch('/api/customer/partner-bindings/:id'";
const pbIdx = code.indexOf(patchBindingRoute);
if (pbIdx !== -1) {
  const lines = code.split('\n');
  const lineIdx = code.substring(0, pbIdx).split('\n').length - 1;
  let targetIdx = -1;
  for (let i = lineIdx; i < lineIdx + 10; i++) {
    if (lines[i].includes('if (!binding) return res.status(404)')) {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx !== -1 && !lines[targetIdx + 1].includes('assertSelfOrAdmin')) {
    lines.splice(targetIdx + 1, 0, "  if (!assertSelfOrAdmin(req, res, binding.customer_user_id)) return;");
    code = lines.join('\n');
    console.log('SUCCESS INJECT:', patchBindingRoute);
  }
}

inject("app.get('/api/customer/redemptions/:customerUserId'", "const { customerUserId } = req.params;", "if (!assertSelfOrAdmin(req, res, customerUserId)) return;");

// GET redemption-status special logic
const getApprovalRoute = "app.get('/api/customer/redemption-status/:approval_id'";
const gaIdx = code.indexOf(getApprovalRoute);
if (gaIdx !== -1) {
  const lines = code.split('\n');
  const lineIdx = code.substring(0, gaIdx).split('\n').length - 1;
  let targetIdx = -1;
  for (let i = lineIdx; i < lineIdx + 10; i++) {
    if (lines[i].includes('if (!approval) return res.status(404)')) {
      targetIdx = i;
      break;
    }
  }
  if (targetIdx !== -1 && !lines[targetIdx + 1].includes('assertSelfOrAdmin')) {
    lines.splice(targetIdx + 1, 0, "  if (!assertSelfOrAdmin(req, res, approval.customer_user_id)) return;");
    code = lines.join('\n');
    console.log('SUCCESS INJECT:', getApprovalRoute);
  }
}

inject("app.post('/api/customer/phone-change/request'", "const { userId,", "if (!assertSelfOrAdmin(req, res, userId)) return;");
inject("app.post('/api/customer/phone-change/verify'", "const { userId,", "if (!assertSelfOrAdmin(req, res, userId)) return;");
inject("app.post('/api/customer/region-change'", "const { user_id,", "if (!assertSelfOrAdmin(req, res, user_id)) return;");
inject("app.post('/api/customer/fraud-reports'", "const { reporter_user_id,", "if (!assertSelfOrAdmin(req, res, reporter_user_id)) return;");
inject("app.post('/api/feedback'", "const { reporterId,", "if (!assertSelfOrAdmin(req, res, reporterId)) return;");
inject("app.post('/api/orders'", "const { customerId,", "if (req.user && req.user.role === 'CUSTOMER' && !assertSelfOrAdmin(req, res, customerId)) return;");
inject("app.post('/api/orders/create'", "const { customerId,", "if (req.user && req.user.role === 'CUSTOMER' && !assertSelfOrAdmin(req, res, customerId)) return;");

fs.writeFileSync('backend/server.js', code);
