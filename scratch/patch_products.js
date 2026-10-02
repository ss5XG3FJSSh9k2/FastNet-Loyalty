const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const target1 = `  if (parsedPrice <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }
  if (parsedCostPrice < 0 || parsedCostPrice > parsedPrice) {
    return res.status(400).json({ error: 'Cost price must be between 0 and selling price' });
  }`;

const replacement1 = `  if (isNaN(parsedPrice) || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid price', fields: { price: 'Must be > 0' } });
  }
  if (isNaN(parsedCostPrice) || !Number.isFinite(parsedCostPrice) || parsedCostPrice < 0 || parsedCostPrice > parsedPrice) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid cost_price', fields: { cost_price: 'Must be between 0 and selling price' } });
  }
  const initStk = parseInt(initialStock, 10);
  if (isNaN(initStk) || initStk < 0) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid stock_qty', fields: { stock_qty: 'Must be >= 0' } });
  }`;

const target2 = `  if (newPrice <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }
  if (newCostPrice < 0 || newCostPrice > newPrice) {
    return res.status(400).json({ error: 'Cost price must be between 0 and selling price' });
  }`;

const replacement2 = `  if (isNaN(newPrice) || !Number.isFinite(newPrice) || newPrice <= 0) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid price', fields: { price: 'Must be > 0' } });
  }
  if (isNaN(newCostPrice) || !Number.isFinite(newCostPrice) || newCostPrice < 0 || newCostPrice > newPrice) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid cost_price', fields: { cost_price: 'Must be between 0 and selling price' } });
  }`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('backend/server.js', code, 'utf8');
