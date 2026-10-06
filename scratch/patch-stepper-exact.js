const fs = require('fs');

const exactOriginal = "const NumberStepper = ({ id, value, onChange, min, max, step, decimals = 0, suffix = '', size = 'md' }) => {\r\n  const hasMax = max !== undefined && max !== null;\r\n  const round = v => Number(v.toFixed(decimals));\r\n  const clamp = v => {\r\n    let n = round(v);\r\n    if (n < min) n = min;\r\n    if (hasMax && n > max) n = max;\r\n    return n;\r\n  };\r\n  const cur = (value === '' || value === undefined || value === null || isNaN(Number(value))) ? min : Number(value);\r\n  const sm = size === 'sm';\r\n  const btn = sm ? 32 : 44;\r\n  const valStyle = sm\r\n    ? { textAlign: 'center', width: 48, flexShrink: 0, padding: '0.25rem' }   // fixed width, no flex-grow\r\n    : { textAlign: 'center', flex: 1, minWidth: 0 };\r\n  return (\r\n    <div style={{ display: 'inline-flex', alignItems: 'center', gap: sm ? '0.25rem' : '0.5rem' }}>\r\n      <button type=\"button\" className=\"btn btn-secondary\"\r\n        style={{ width: btn, height: btn, fontSize: sm ? '1rem' : '1.25rem', flexShrink: 0, padding: 0 }}\r\n        disabled={cur <= min}\r\n        onClick={() => onChange(clamp(cur - step))}>−</button>\r\n      <input id={id} type=\"number\" inputMode=\"decimal\" className=\"text-input stepper-input\"\r\n        style={{ ...valStyle, fontSize: sm ? '0.8rem' : undefined }}\r\n        value={cur} min={min} max={hasMax ? max : undefined} step={step}\r\n        onChange={e => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? min : clamp(v)); }} />\r\n      <button type=\"button\" className=\"btn btn-secondary\"\r\n        style={{ width: btn, height: btn, fontSize: sm ? '1rem' : '1.25rem', flexShrink: 0, padding: 0 }}\r\n        disabled={hasMax && cur >= max}\r\n        onClick={() => onChange(clamp(cur + step))}>＋</button>\r\n      {suffix && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{suffix}</span>}\r\n    </div>\r\n  );\r\n};\r";

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
};\r`.replace(/\n/g, '\r\n'); // Enforce CRLF

let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');
if (code.includes(exactOriginal)) {
  code = code.replace(exactOriginal, replacement);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log("Updated NumberStepper successfully!");
} else {
  console.log("Still could not find the exact original string.");
}
