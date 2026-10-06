const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /const NumberStepper = \(\{ id, value, onChange, min, max, step, decimals = 0, suffix = '', size = 'md' \}\) => \{[\s\S]*?\n\};\n/m;

const replacement = `const NumberStepper = ({ id, value, onChange, min, max, step, decimals = 0, suffix = '', size = 'md' }) => {
  const hasMax = max !== undefined && max !== null;
  const round = v => Number(v.toFixed(decimals));
  const clamp = v => {
    let n = round(v);
    if (n < min) n = min;
    if (hasMax && n > max) n = max;
    return n;
  };
  const cur = (value === '' || value === undefined || value === null || isNaN(Number(value))) ? min : Number(value);
  const [draft, setDraft] = useState(String(cur));

  useEffect(() => {
    const parsedDraft = parseFloat(draft);
    if (isNaN(parsedDraft) || parsedDraft !== cur) {
      setDraft(String(cur));
    }
  }, [cur]);

  const commit = () => {
    let n = parseFloat(draft);
    if (isNaN(n)) {
      setDraft(String(min));
      onChange(min);
    } else {
      const clamped = clamp(n);
      setDraft(String(clamped));
      onChange(clamped);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commit();
    }
  };

  const sm = size === 'sm';
  const btn = sm ? 32 : 44;
  const valStyle = sm
    ? { textAlign: 'center', width: 48, flexShrink: 0, padding: '0.25rem' }
    : { textAlign: 'center', flex: 1, minWidth: 0 };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: sm ? '0.25rem' : '0.5rem' }}>
      <button type="button" className="btn btn-secondary"
        style={{ width: btn, height: btn, fontSize: sm ? '1rem' : '1.25rem', flexShrink: 0, padding: 0 }}
        disabled={cur <= min}
        onClick={() => { const newVal = clamp(cur - step); setDraft(String(newVal)); onChange(newVal); }}>−</button>
      <input id={id} type="text" inputMode="decimal" className="text-input stepper-input"
        style={{ ...valStyle, fontSize: sm ? '0.8rem' : undefined }}
        value={draft}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onChange={e => {
          let v = e.target.value;
          // Strip leading zeros unless it's just "0" or starts with "0."
          if (/^0[0-9]/.test(v)) {
            v = v.replace(/^0+/, '');
            if (v === '' || v.startsWith('.')) v = '0' + v;
          }
          setDraft(v);
          const num = parseFloat(v);
          if (!isNaN(num) && v !== '' && v !== '-') {
            onChange(clamp(num));
          }
        }} />
      <button type="button" className="btn btn-secondary"
        style={{ width: btn, height: btn, fontSize: sm ? '1rem' : '1.25rem', flexShrink: 0, padding: 0 }}
        disabled={hasMax && cur >= max}
        onClick={() => { const newVal = clamp(cur + step); setDraft(String(newVal)); onChange(newVal); }}>＋</button>
      {suffix && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{suffix}</span>}
    </div>
  );
};
`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Updated NumberStepper");
} else {
  console.log("Could not find NumberStepper with regex");
}
