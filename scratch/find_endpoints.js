const fs = require('fs');
const lines = fs.readFileSync('backend/server.js', 'utf8').split('\n');

const patterns = [
  "app.get('/api/ledger/balance/:customerId'",
  "app.get('/api/ledger/history/:customerId'",
  "app.post('/api/ledger/redeem'",
  "app.get('/api/customer/rewards/available/:customerUserId'",
  "app.get('/api/customer/available-rewards'",
  "app.get('/api/customer/:id/profile'",
  "app.patch('/api/customer/:id/profile'",
  "app.post('/api/customer/:id/profile'",
  "app.post('/api/customer/partner-bindings'",
  "app.get('/api/customer/partner-bindings/:customerUserId'",
  "app.patch('/api/customer/partner-bindings/:id'",
  "app.get('/api/customer/redemptions/:customerUserId'",
  "app.get('/api/customer/redemption-status/:approval_id'",
  "app.post('/api/customer/phone-change/request'",
  "app.post('/api/customer/phone-change/verify'",
  "app.post('/api/customer/region-change'",
  "app.post('/api/customer/fraud-reports'",
  "app.post('/api/feedback'",
  "app.post('/api/orders'",
  "app.post('/api/orders/create'",
  "app.get('/api/orders'",
  "app.post('/api/orders/:id/cancel'",
  "app.post('/api/orders/:id/verify-pickup'",
  "app.post('/api/orders/:id/noshw-action'",
  "app.patch('/api/orders/:id/acknowledge'",
  "app.patch('/api/orders/:id/fulfillment'",
  "app.post('/api/orders/sync'",
  "app.post('/api/products'",
  "app.post('/api/stockist/products'",
  "app.patch('/api/products/:id'",
  "app.get('/api/products/:id/bill-history'",
  "app.patch('/api/stockist/profile'",
  "app.post('/api/stockists/restock'",
  "app.post('/api/stockist/push-subscription'",
  "app.get('/api/stockists/:id/stats'",
  "app.get('/api/stockists/:stockistId/vendors'",
  "app.get('/api/kyc/documents/:filename'",
  "app.get('/api/admin/kyc/:userId/document'"
];

for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  for(let p of patterns) {
    if(line.includes(p)) {
      console.log(`Line ${i+1}: ${p}`);
    }
  }
}
