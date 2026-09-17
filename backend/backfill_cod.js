const db = require('./db');

async function run() {
  const splitPayouts = await db.getTable('split_payouts');
  const orders = await db.getTable('orders');

  let updated = 0;
  for (const sp of splitPayouts) {
    if (sp.is_cod === undefined) {
      const order = orders.find(o => o.id === sp.order_id);
      if (order) {
        sp.is_cod = order.payment_method === 'COD';
        updated++;
      } else {
        sp.is_cod = false;
      }
    }
  }

  if (updated > 0) {
    await db.saveTable('split_payouts', splitPayouts);
    console.log(`Backfilled ${updated} rows in split_payouts`);
  } else {
    console.log('No rows needed backfilling');
  }
}

run().catch(console.error);
