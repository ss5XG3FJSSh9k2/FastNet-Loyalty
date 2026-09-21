const fs = require('fs');

let text = fs.readFileSync('backend/server.js', 'utf8').replace(/\r\n/g, '\n');

const replacements = [
    [
        `app.patch('/api/stockist/profile', async (req, res) => {`,
        `async function resolveStockistRate(stockistId) {
  const rates = await db.getTable('stockist_commission_rates');
  const stkRates = rates.filter(r => r.stockist_id === stockistId);
  return stkRates.length > 0 ? stkRates[stkRates.length - 1].rate_percent : 10.0;
}

app.patch('/api/stockist/profile', async (req, res) => {`
    ],
    [
        `    res.json({ success: true, stockist });`,
        `    const _latestRate = await resolveStockistRate(stockist.id);
    res.json({ success: true, stockist: { ...stockist, commission_rate: _latestRate, is_shop_open: calculateIsShopOpen(stockist) } });`
    ],
    [
        `  const rates = await db.getTable('stockist_commission_rates');
  const stkRates = rates.filter(r => r.stockist_id === stockist.id);
  const latestRate = stkRates.length > 0 ? stkRates[stkRates.length - 1].rate_percent : 10.0;
  return res.json({`,
        `  const latestRate = await resolveStockistRate(stockist.id);
  return res.json({`
    ]
];

for (let [orig, repl] of replacements) {
    if (!text.includes(orig)) {
        console.error('COULD NOT FIND MATCH FOR:', orig.substring(0, 100).replace(/\n/g, '\\n') + '...');
    } else {
        text = text.replace(orig, repl);
    }
}
fs.writeFileSync('backend/server.js', text);
console.log('Replacements completed.');
