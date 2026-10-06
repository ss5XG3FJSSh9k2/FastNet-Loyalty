const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const target = `const NumberStepper = ({ id, value, onChange, min, max, step, decimals = 0, suffix = '', size = 'md' }) => {
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
      <input id={id} type="number" inputMode="decimal" className="text-input stepper-input"
        style={{ ...valStyle, fontSize: sm ? '0.8rem' : undefined }}
        value={cur} min={min} max={hasMax ? max : undefined} step={step}
        onChange={e => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? min : clamp(v)); }} />
      <button type="button" className="btn btn-secondary"
        style={{ width: btn, height: btn, fontSize: sm ? '1rem' : '1.25rem', flexShrink: 0, padding: 0 }}
        disabled={hasMax && cur >= max}
        onClick={() => onChange(clamp(cur + step))}>+</button>
      {suffix && <span style={{ fontSize: sm ? '0.8rem' : '0.9rem', color: 'var(--text-muted)' }}>{suffix}</span>}
    </div>
  );
};`;

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
    // Only update draft if it differs semantically, avoiding overwriting "1." with "1"
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
          // Clean leading zeros (e.g. "05" -> "5", but keep "0" and "0.5")
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
        onClick={() => { const newVal = clamp(cur + step); setDraft(String(newVal)); onChange(newVal); }}>+</button>
      {suffix && <span style={{ fontSize: sm ? '0.8rem' : '0.9rem', color: 'var(--text-muted)' }}>{suffix}</span>}
    </div>
  );
};`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Updated NumberStepper");
} else {
  const t2 = target.replace(/\n/g, '\r\n');
  const r2 = replacement.replace(/\n/g, '\r\n');
  if (code.includes(t2)) {
    code = code.replace(t2, r2);
    fs.writeFileSync('frontend/src/App.jsx', code);
    console.log("Updated NumberStepper (CRLF)");
  } else {
    console.log("Could not find NumberStepper");
  }
}
