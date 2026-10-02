const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

// Modify enrichOrder signature and add filtering
const enrichTarget = `async function enrichOrder(o) {
  if (!o) return null;`;
const enrichReplace = `async function enrichOrder(o, req = null) {
  if (!o) return null;`;
code = code.replace(enrichTarget, enrichReplace);

const enrichReturnTarget = `  return {
    ...o,
    commission_model: o.commission_model || 'gross_v1',`;
const enrichReturnReplace = `  const enriched = {
    ...o,
    commission_model: o.commission_model || 'gross_v1',`;
code = code.replace(enrichReturnTarget, enrichReturnReplace);

const enrichEndTarget = `    points_status: (await db.getTable('points_ledger')).some(l => l.order_id === o.id && l.type === 'EARN_HELD' && l.billing_sync_status === 'HELD') ? 'HELD' : 'CREDITED'
  };
}`;
const enrichEndReplace = `    points_status: (await db.getTable('points_ledger')).some(l => l.order_id === o.id && l.type === 'EARN_HELD' && l.billing_sync_status === 'HELD') ? 'HELD' : 'CREDITED'
  };

  if (req && req.user) {
    const isOwner = req.user.role === 'CUSTOMER' && req.user.userId === o.customer_id;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isAdmin && !isOwner) {
      delete enriched.pickup_pin;
    }
  } else {
    // If req is not passed, keep it for internal calculations, 
    // but if it's sent to client, they should have passed req.
  }
  return enriched;
}`;
code = code.replace(enrichEndTarget, enrichEndReplace);

// Now find all `enrichOrder(o)` or `enrichOrder(order)` in GET / POST handlers and add `req`
// Use a regex that replaces `enrichOrder(order)` with `enrichOrder(order, req)` and `enrichOrder(o)` with `enrichOrder(o, req)`.
// We have to be careful about `enrichOrder(o).stockist_amount` which is a bug anyway, but it won't break if we just add req.

code = code.replace(/await enrichOrder\(order\)/g, "await enrichOrder(order, req)");
code = code.replace(/enrichOrder\(o\)/g, "enrichOrder(o, req)");
// Revert the declaration signature which might have been affected:
code = code.replace(/async function enrichOrder\(o, req, req = null\)/g, "async function enrichOrder(o, req = null)");
code = code.replace(/async function enrichOrder\(o, req\)/g, "async function enrichOrder(o, req = null)");

fs.writeFileSync('backend/server.js', code, 'utf8');
console.log('enrichOrder updated');
