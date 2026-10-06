const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const target = `  const numRate = parseFloat(rate_percent);
  if (isNaN(numRate) || numRate < 0 || numRate > 100) {
    return res.status(400).json({ error: 'Valid commission rate percent required (0-100)' });
  }
  const stockists = await db.getTable('stockists');
  const stockist = stockists.find(s => s.id === id);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
  
  const rates = await db.getTable('stockist_commission_rates');
  const stkRates = rates.filter(r => r.stockist_id === id);
  const currentRate = stkRates.length > 0 ? stkRates[stkRates.length - 1].rate_percent : 10.0;
  
  const orders = await db.getTable('orders');
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const delivered30d = orders.filter(o => o.stockist_id === id && o.status === 'DELIVERED' && new Date(o.created_at).getTime() >= thirtyDaysAgo);
  
  const currentEarnings = delivered30d.reduce((sum, o) => sum + ((parseFloat(o.subtotal) || 0) * (currentRate / 100)), 0);
  const newEarnings = delivered30d.reduce((sum, o) => sum + ((parseFloat(o.subtotal) || 0) * (numRate / 100)), 0);
  
  if (confirmationText !== 'CONFIRM') {
    return res.json({
      preview: true,
      current_rate: currentRate,
      new_rate: numRate,
      current_earnings_30d: currentEarnings,
      new_earnings_30d: newEarnings
    });
  }`;

const replacement = `  const numRate = parseFloat(rate_percent);
  if (isNaN(numRate) || numRate < 0 || numRate > 100) {
    return res.status(400).json({ error: 'Valid commission rate percent required (0-100)' });
  }
  const stockists = await db.getTable('stockists');
  const stockist = stockists.find(s => s.id === id);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
  
  const rates = await db.getTable('stockist_commission_rates');
  const stkRates = rates.filter(r => r.stockist_id === id);
  const currentRate = stkRates.length > 0 ? stkRates[stkRates.length - 1].rate_percent : 10.0;
  
  const orders = await db.getTable('orders');
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const delivered30d = orders.filter(o => o.stockist_id === id && o.status === 'DELIVERED' && new Date(o.created_at).getTime() >= thirtyDaysAgo);
  
  const gross_gmv = delivered30d.reduce((sum, o) => sum + (parseFloat(o.subtotal) || 0), 0);
  const currentEarnings = gross_gmv * (currentRate / 100);
  const newEarnings = gross_gmv * (numRate / 100);
  
  if (confirmationText !== 'CONFIRM') {
    return res.json({
      preview: true,
      orders_count: delivered30d.length,
      gross_gmv: gross_gmv,
      current_rate: currentRate,
      new_rate: numRate,
      current_earnings_30d: currentEarnings,
      new_earnings_30d: newEarnings,
      diff: newEarnings - currentEarnings
    });
  }`;

if(code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('backend/server.js', code);
  console.log("Updated server.js");
} else {
  // try replacing CRLF
  const targetCRLF = target.replace(/\n/g, '\r\n');
  const replacementCRLF = replacement.replace(/\n/g, '\r\n');
  if(code.includes(targetCRLF)) {
    code = code.replace(targetCRLF, replacementCRLF);
    fs.writeFileSync('backend/server.js', code);
    console.log("Updated server.js (CRLF)");
  } else {
    console.log("Not found in server.js");
  }
}
