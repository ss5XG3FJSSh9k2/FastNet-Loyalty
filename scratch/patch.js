const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8').replace(/\r\n/g, '\n');

const t = 'const platformPayout = payout ? parseFloat(payout.platform_amount) : (platformCommission + (o.low_order_fee || 0));\n\n  return {\n    ...o,';
const r = `const platformPayout = payout ? parseFloat(payout.platform_amount) : (platformCommission + (o.low_order_fee || 0));

  let strippedPin = o.pickup_pin;
  if (req && req.user && req.user.role !== 'ADMIN' && req.user.role !== 'CUSTOMER') {
    strippedPin = undefined;
  } else if (!req || !req.user) {
    strippedPin = undefined;
  }

  return {
    ...o,
    pickup_pin: strippedPin,`;

if (code.includes(t)) {
  fs.writeFileSync('backend/server.js', code.replace(t, r));
  console.log('PATCHED');
} else {
  console.log('NOT FOUND');
}
