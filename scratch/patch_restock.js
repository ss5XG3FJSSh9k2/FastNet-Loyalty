const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const target = `  const inventory = await db.getTable('stockist_inventory');
  items.forEach(item => {`;

const replacement = `  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > cfg.MAX_ITEM_QUANTITY_PER_LINE) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid quantity in restock', fields: { quantity: 'Must be between 1 and ' + cfg.MAX_ITEM_QUANTITY_PER_LINE } });
    }
  }

  const inventory = await db.getTable('stockist_inventory');
  items.forEach(item => {`;

code = code.replace(target, replacement);
fs.writeFileSync('backend/server.js', code, 'utf8');
