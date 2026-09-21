const fs = require('fs');
let text = fs.readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

const replacements = [
    [
        `const NumberStepper = ({ value, onChange, min, max, step, decimals = 0, suffix = '' }) => {
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
};`,
        `const NumberStepper = ({ value, onChange, min, max, step, decimals = 0, suffix = '', size = 'md' }) => {
  const hasMax = max !== undefined && max !== null;
  const round = v => Number(v.toFixed(decimals));
  const clamp = v => {
    let n = round(v);
    if (n < min) n = min;
    if (hasMax && n > max) n = max;
    return n;
  };
  const cur = (value === '' || value === undefined || value === null || isNaN(Number(value))) ? min : Number(value);
  const sm = size === 'sm';
  const btn = sm ? 32 : 44;
  const valStyle = sm
    ? { textAlign: 'center', width: 48, flexShrink: 0, padding: '0.25rem' }   // fixed width, no flex-grow
    : { textAlign: 'center', flex: 1, minWidth: 0 };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: sm ? '0.25rem' : '0.5rem' }}>
      <button type="button" className="btn btn-secondary"
        style={{ width: btn, height: btn, fontSize: sm ? '1rem' : '1.25rem', flexShrink: 0, padding: 0 }}
        disabled={cur <= min}
        onClick={() => onChange(clamp(cur - step))}>−</button>
      <input type="number" inputMode="decimal" className="text-input stepper-input"
        style={{ ...valStyle, fontSize: sm ? '0.8rem' : undefined }}
        value={cur} min={min} max={hasMax ? max : undefined} step={step}
        onChange={e => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? min : clamp(v)); }} />
      <button type="button" className="btn btn-secondary"
        style={{ width: btn, height: btn, fontSize: sm ? '1rem' : '1.25rem', flexShrink: 0, padding: 0 }}
        disabled={hasMax && cur >= max}
        onClick={() => onChange(clamp(cur + step))}>＋</button>
      {suffix && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{suffix}</span>}
    </div>
  );
};`
    ],
    [
        `                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t("Low Stock Threshold:", "कम स्टॉक सीमा:", "কম স্টক থ্রেশহোল্ড:")}</span>
                              <NumberStepper value={lowStockThreshold} onChange={v => setLowStockThreshold(parseInt(v, 10))} min={0} step={1} decimals={0} />
                      </div>`,
        `                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t("Low Stock Threshold:", "कम स्टॉक सीमा:", "কম স্টক থ্রেশহোল্ড:")}</span>
                              <NumberStepper value={lowStockThreshold} onChange={v => setLowStockThreshold(parseInt(v, 10))} min={0} step={1} decimals={0} size="sm" />
                      </div>`
    ],
    [
        `                            return (
                              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: isLowStock ? '1px dashed var(--warning)' : '1px solid var(--border-color)', fontSize: '0.75rem' }}>`,
        `                            return (
                              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: isLowStock ? '1px dashed var(--warning)' : '1px solid var(--border-color)', fontSize: '0.75rem' }}>`
    ],
    [
        `                          <NumberStepper value={restockQuantities[p.id] || 20} onChange={v => setRestockQuantities(prev => ({ ...prev, [p.id]: parseInt(v, 10) }))} min={1} step={1} decimals={0} />`,
        `                          <NumberStepper value={restockQuantities[p.id] || 20} onChange={v => setRestockQuantities(prev => ({ ...prev, [p.id]: parseInt(v, 10) }))} min={1} step={1} decimals={0} size="sm" />`
    ]
];

for (let [orig, repl] of replacements) {
    if (!text.includes(orig)) {
        console.error('COULD NOT FIND MATCH FOR:', orig.substring(0, 80).replace(/\n/g, '\\n') + '...');
    } else {
        text = text.replace(orig, repl);
    }
}
fs.writeFileSync('src/App.jsx', text);
console.log('Replacements completed.');
