const fs = require('fs');

let text = fs.readFileSync('src/App.jsx', 'utf8');

// Insert NumberStepper after TimePicker
const numberStepperDef = `const NumberStepper = ({ value, onChange, min, max, step, decimals = 0, suffix = '' }) => {
  const hasMax = max !== undefined && max !== null;
  const round = v => Number(v.toFixed(decimals));
  const clamp = v => {
    let n = round(v);
    if (n < min) n = min;
    if (hasMax && n > max) n = max;
    return n;
  };
  const cur = (value === '' || value === undefined || value === null || isNaN(Number(value))) ? min : Number(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button type="button" className="btn btn-secondary"
        style={{ width: 44, height: 44, fontSize: '1.25rem', flexShrink: 0, padding: 0 }}
        disabled={cur <= min}
        onClick={() => onChange(clamp(cur - step))}>−</button>
      <input type="number" inputMode="decimal" className="text-input stepper-input"
        style={{ textAlign: 'center', flex: 1, minWidth: 0 }}
        value={cur} min={min} max={hasMax ? max : undefined} step={step}
        onChange={e => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? min : clamp(v)); }} />
      <button type="button" className="btn btn-secondary"
        style={{ width: 44, height: 44, fontSize: '1.25rem', flexShrink: 0, padding: 0 }}
        disabled={hasMax && cur >= max}
        onClick={() => onChange(clamp(cur + step))}>＋</button>
      {suffix && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{suffix}</span>}
    </div>
  );
};
`;

if (!text.includes('const NumberStepper =')) {
    text = text.replace('const TimePicker = ({ value, onChange }) => {', numberStepperDef + '\nconst TimePicker = ({ value, onChange }) => {');
}

const replacements = [
    // Category A
    [
        `<input type="number" min="5" max="120" className="text-input" value={stockistProfile.prep_eta_minutes || 15} onChange={e => setStockistProfile({...stockistProfile, prep_eta_minutes: parseInt(e.target.value, 10)})} />`,
        `<NumberStepper value={stockistProfile.prep_eta_minutes || 15} onChange={v => setStockistProfile(prev => ({ ...prev, prep_eta_minutes: parseInt(v, 10) }))} min={5} max={120} step={5} decimals={0} />`
    ],
    [
        `<input type="number" step="0.1" max={stockistProfile.max_delivery_radius_km || 5.0} className="text-input" value={stockistProfile.delivery_radius_km || 5.0} onChange={e => setStockistProfile({...stockistProfile, delivery_radius_km: e.target.value})} />`,
        `<NumberStepper value={stockistProfile.delivery_radius_km || 5.0} onChange={v => setStockistProfile(prev => ({ ...prev, delivery_radius_km: parseFloat(v) }))} min={0.5} max={stockistProfile.max_delivery_radius_km || 5.0} step={0.5} decimals={1} suffix="km" />`
    ],
    [
        `<input\n                                type="number"\n                                min="0"\n                                style={{ width: '45px', padding: '0.2rem', fontSize: '0.7rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center' }}\n                                value={lowStockThreshold}\n                                onChange={e => setLowStockThreshold(e.target.value)}\n                              />`,
        `<NumberStepper value={lowStockThreshold} onChange={v => setLowStockThreshold(parseInt(v, 10))} min={0} step={1} decimals={0} />`
    ],
    [
        `<input\n                            type="number"\n                            min="1"\n                            style={{ width: '45px', padding: '0.25rem', fontSize: '0.7rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px', textAlign: 'center' }}\n                            value={restockQuantities[p.id] || '20'}\n                            onChange={e => setRestockQuantities(prev => ({ ...prev, [p.id]: e.target.value }))}\n                          />`,
        `<NumberStepper value={restockQuantities[p.id] || 20} onChange={v => setRestockQuantities(prev => ({ ...prev, [p.id]: parseInt(v, 10) }))} min={1} step={1} decimals={0} />`
    ],
    [
        `<input type="number" className="text-input" value={createStkEta} onChange={e => setCreateStkEta(e.target.value)} />`,
        `<NumberStepper value={createStkEta} onChange={v => setCreateStkEta(parseInt(v, 10))} min={5} max={120} step={5} decimals={0} />`
    ],
    [
        `<input type="number" step="0.5" className="text-input" value={createStkRadius} onChange={e => setCreateStkRadius(e.target.value)} />`,
        `<NumberStepper value={createStkRadius} onChange={v => setCreateStkRadius(parseFloat(v))} min={0.5} step={0.5} decimals={1} suffix="km" />`
    ],
    [
        `<input\n                  id="edit-stk-eta"\n                  type="number"\n                  className="text-input"\n                  value={editStkEta}\n                  onChange={e => setEditStkEta(e.target.value)}\n                  required\n                />`,
        `<NumberStepper value={editStkEta} onChange={v => setEditStkEta(parseInt(v, 10))} min={5} max={120} step={5} decimals={0} />`
    ],
    [
        `<input\n                  id="edit-stk-radius"\n                  type="number"\n                  step="0.5"\n                  className="text-input"\n                  value={editStkRadius}\n                  onChange={e => setEditStkRadius(e.target.value)}\n                  required\n                />`,
        `<NumberStepper value={editStkRadius} onChange={v => setEditStkRadius(parseFloat(v))} min={0.5} step={0.5} decimals={1} suffix="km" />`
    ],
    // Category B
    [
        `<input\n                        type="number"\n                        className="text-input"\n                        value={globalReinvestPct}\n                        onChange={e => setGlobalReinvestPct(e.target.value)}\n                      />`,
        `<NumberStepper value={globalReinvestPct} onChange={setGlobalReinvestPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
    ],
    [
        `<input\n                        type="number"\n                        className="text-input"\n                        value={globalPointsPct}\n                        onChange={e => setGlobalPointsPct(e.target.value)}\n                      />`,
        `<NumberStepper value={globalPointsPct} onChange={setGlobalPointsPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
    ],
    [
        `<input\n                        type="number"\n                        className="text-input"\n                        value={globalCutPct}\n                        onChange={e => setGlobalCutPct(e.target.value)}\n                      />`,
        `<NumberStepper value={globalCutPct} onChange={setGlobalCutPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
    ],
    [
        `<input type="number" className="text-input" value={createStkRate} onChange={e => setCreateStkRate(e.target.value)} />`,
        `<NumberStepper value={createStkRate} onChange={setCreateStkRate} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
    ],
    [
        `<input type="number" step="0.1" className="text-input" value={newCommissionRate} onChange={e => setNewCommissionRate(e.target.value)} />`,
        `<NumberStepper value={newCommissionRate} onChange={setNewCommissionRate} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
    ],
    [
        `<input type="number" className="text-input" value={overrideReinvestPct} onChange={e => setOverrideReinvestPct(e.target.value)} />`,
        `<NumberStepper value={overrideReinvestPct} onChange={setOverrideReinvestPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
    ],
    [
        `<input type="number" className="text-input" value={overridePointsPct} onChange={e => setOverridePointsPct(e.target.value)} />`,
        `<NumberStepper value={overridePointsPct} onChange={setOverridePointsPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
    ],
    [
        `<input type="number" className="text-input" value={overrideCutPct} onChange={e => setOverrideCutPct(e.target.value)} />`,
        `<NumberStepper value={overrideCutPct} onChange={setOverrideCutPct} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
    ],
    // Category C
    [
        `<input type="number" className="text-input" value={pkgFaceValue} onChange={e => setPkgFaceValue(e.target.value)} />`,
        `<input type="number" inputMode="decimal" className="text-input" value={pkgFaceValue} onChange={e => setPkgFaceValue(e.target.value)} />`
    ],
    [
        `<input type="number" className="text-input" value={pkgCostToPartner} onChange={e => setPkgCostToPartner(e.target.value)} placeholder={pkgFaceValue} />`,
        `<input type="number" inputMode="decimal" className="text-input" value={pkgCostToPartner} onChange={e => setPkgCostToPartner(e.target.value)} placeholder={pkgFaceValue} />`
    ],
    [
        `<input type="number" className="text-input" value={pkgPointCost} onChange={e => setPkgPointCost(e.target.value)} placeholder={pkgFaceValue} />`,
        `<input type="number" inputMode="decimal" className="text-input" value={pkgPointCost} onChange={e => setPkgPointCost(e.target.value)} placeholder={pkgFaceValue} />`
    ],
    [
        `<input type="number" className="text-input" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} />`,
        `<input type="number" inputMode="decimal" className="text-input" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} />`
    ],
    [
        `<input type="number" className="text-input" value={newProdCostPrice} onChange={e => setNewProdCostPrice(e.target.value)} />`,
        `<input type="number" inputMode="decimal" className="text-input" value={newProdCostPrice} onChange={e => setNewProdCostPrice(e.target.value)} />`
    ],
    [
        `<input type="number" className="text-input" value={newProdInitialStock} onChange={e => setNewProdInitialStock(e.target.value)} />`,
        `<input type="number" inputMode="decimal" className="text-input" value={newProdInitialStock} onChange={e => setNewProdInitialStock(e.target.value)} />`
    ],
    [
        `<input type="number" className="text-input" value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} />`,
        `<input type="number" inputMode="decimal" className="text-input" value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} />`
    ],
    [
        `<input type="number" className="text-input" value={editProdCostPrice} onChange={e => setEditProdCostPrice(e.target.value)} />`,
        `<input type="number" inputMode="decimal" className="text-input" value={editProdCostPrice} onChange={e => setEditProdCostPrice(e.target.value)} />`
    ],
    [
        `<input type="number" className="text-input" placeholder="100" value={pointsCreditAmount} onChange={e => setPointsCreditAmount(e.target.value)} />`,
        `<input type="number" inputMode="decimal" className="text-input" placeholder="100" value={pointsCreditAmount} onChange={e => setPointsCreditAmount(e.target.value)} />`
    ]
];

for (let [orig, repl] of replacements) {
    if (!text.includes(orig)) {
        console.error("COULD NOT FIND:", orig);
    } else {
        text = text.replace(orig, repl);
    }
}

fs.writeFileSync('src/App.jsx', text);
console.log('Replacements completed.');
