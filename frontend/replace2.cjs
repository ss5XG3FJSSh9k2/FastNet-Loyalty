const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

const multiLineTargets = [
    {
        startMarker: 'value={lowStockThreshold}',
        replaceFn: (startIdx, endIdx) => {
            lines.splice(startIdx - 4, 6, `                              <NumberStepper value={lowStockThreshold} onChange={v => setLowStockThreshold(parseInt(v, 10))} min={0} step={1} decimals={0} />`);
        }
    },
    {
        startMarker: 'value={restockQuantities[p.id] ||',
        replaceFn: (startIdx, endIdx) => {
            lines.splice(startIdx - 4, 6, `                          <NumberStepper value={restockQuantities[p.id] || 20} onChange={v => setRestockQuantities(prev => ({ ...prev, [p.id]: parseInt(v, 10) }))} min={1} step={1} decimals={0} />`);
        }
    },
    {
        startMarker: 'value={editStkEta}',
        replaceFn: (startIdx, endIdx) => {
            lines.splice(startIdx - 4, 7, `                <NumberStepper value={editStkEta} onChange={v => setEditStkEta(parseInt(v, 10))} min={5} max={120} step={5} decimals={0} />`);
        }
    },
    {
        startMarker: 'value={editStkRadius}',
        replaceFn: (startIdx, endIdx) => {
            lines.splice(startIdx - 5, 8, `                <NumberStepper value={editStkRadius} onChange={v => setEditStkRadius(parseFloat(v))} min={0.5} step={0.5} decimals={1} suffix="km" />`);
        }
    },
    {
        startMarker: 'value={globalReinvestPct}',
        replaceFn: (startIdx, endIdx) => {
            lines.splice(startIdx - 3, 5, `                      <NumberStepper value={globalReinvestPct} onChange={setGlobalReinvestPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`);
        }
    },
    {
        startMarker: 'value={globalPointsPct}',
        replaceFn: (startIdx, endIdx) => {
            lines.splice(startIdx - 3, 5, `                      <NumberStepper value={globalPointsPct} onChange={setGlobalPointsPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`);
        }
    },
    {
        startMarker: 'value={globalCutPct}',
        replaceFn: (startIdx, endIdx) => {
            lines.splice(startIdx - 3, 5, `                      <NumberStepper value={globalCutPct} onChange={setGlobalCutPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`);
        }
    }
];

multiLineTargets.reverse().forEach(target => {
    const idx = lines.findIndex(l => l.includes(target.startMarker));
    if (idx !== -1) {
        target.replaceFn(idx, idx);
    } else {
        console.error("NOT FOUND:", target.startMarker);
    }
});

fs.writeFileSync('src/App.jsx', lines.join('\n'));
console.log('Multi-line replacements completed.');
