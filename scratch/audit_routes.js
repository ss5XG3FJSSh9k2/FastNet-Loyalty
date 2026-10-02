const fs = require('fs');
const code = fs.readFileSync('backend/server.js', 'utf8');

const routes = [
  { path: '/api/ledger/balance/:customerId', arg: 'customerId' },
  { path: '/api/ledger/history/:customerId', arg: 'customerId' },
  { path: '/api/ledger/redeem', arg: 'customerId' },
  { path: '/api/customer/rewards/available/:customerUserId', arg: 'customerUserId' },
  { path: '/api/customer/available-rewards', arg: 'customerId' },
  { path: '/api/customer/:id/profile', arg: 'id' },
  { path: '/api/customer/partner-bindings', arg: 'customer_user_id' },
  { path: '/api/customer/redemptions/:customerUserId', arg: 'customerUserId' },
  { path: '/api/customer/redemption-status/:approval_id', arg: 'approval' },
  { path: '/api/customer/phone-change/request', arg: 'user_id' },
  { path: '/api/customer/phone-change/verify', arg: 'user_id' },
  { path: '/api/customer/region-change', arg: 'user_id' },
  { path: '/api/customer/fraud-reports', arg: 'reporter_user_id' },
  { path: '/api/feedback', arg: 'reporterId' },
  { path: '/api/orders', arg: 'customerId' },
  { path: '/api/orders/create', arg: 'customerId' }
];

routes.forEach(r => {
  const i = code.indexOf(r.path);
  if (i === -1) {
    console.log('ROUTE NOT FOUND:', r.path);
    return;
  }
  const snippet = code.substring(i, i + 500);
  const hasRequireAuth = snippet.includes('requireAuth');
  const hasAssert = snippet.includes('assertSelfOrAdmin') || snippet.includes('assertOrderAccess');
  if (!hasRequireAuth || !hasAssert) {
    console.log('MISSING AUTH OR ASSERT:', r.path, { hasRequireAuth, hasAssert });
  } else {
    console.log('OK:', r.path);
  }
});
