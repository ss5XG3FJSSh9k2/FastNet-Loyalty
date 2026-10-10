const fs = require('fs');
const path = require('path');

const file = path.join('x:', 'app', 'frontend', 'src', 'App.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Initial values & dirty state
content = content.replace(
  /const \[globalReinvestPct, setGlobalReinvestPct\] = useState\(50\);\s*const \[globalPointsPct, setGlobalPointsPct\] = useState\(40\);\s*const \[globalCutPct, setGlobalCutPct\] = useState\(12\);/,
  `const [globalReinvestPct, setGlobalReinvestPct] = useState(40);
  const [globalPointsPct, setGlobalPointsPct] = useState(12);
  const [globalCutPct, setGlobalCutPct] = useState(50);
  const globalConfigDirtyRef = useRef(false);
  const [globalConfigDirty, setGlobalConfigDirtyState] = useState(false);
  const setGlobalConfigDirty = (val) => {
    globalConfigDirtyRef.current = val;
    setGlobalConfigDirtyState(val);
  };`
);

// 2. fetchDbState
content = content.replace(
  /if \(gRow\) \{\s*setGlobalReinvestPct\(gRow\.stockist_reinvest_pct\);\s*setGlobalPointsPct\(gRow\.points_from_pot_pct\);\s*setGlobalCutPct\(gRow\.partner_redemption_cut_pct\);\s*\}/,
  `if (gRow) {
            if (!globalConfigDirtyRef.current) {
              setGlobalReinvestPct(gRow.stockist_reinvest_pct);
              setGlobalPointsPct(gRow.points_from_pot_pct);
              setGlobalCutPct(gRow.partner_redemption_cut_pct);
            }
          }`
);

// 3. handleSaveGlobalConfig
content = content.replace(
  /showToast\('Global commission config saved!'\);\s*fetchDbState\(\);/,
  `showToast('Global commission config saved!');
        setGlobalConfigDirty(false);
        fetchDbState();`
);

// 4. onChange handlers
content = content.replace(
  /<NumberStepper value=\{globalReinvestPct\} onChange=\{setGlobalReinvestPct\} min=\{0\} max=\{100\} step=\{0\.5\} decimals=\{1\} suffix="%" \/>/,
  `<NumberStepper value={globalReinvestPct} onChange={(val) => { setGlobalReinvestPct(val); setGlobalConfigDirty(true); }} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
);
content = content.replace(
  /<NumberStepper value=\{globalPointsPct\} onChange=\{setGlobalPointsPct\} min=\{0\} max=\{100\} step=\{0\.5\} decimals=\{1\} suffix="%" \/>/,
  `<NumberStepper value={globalPointsPct} onChange={(val) => { setGlobalPointsPct(val); setGlobalConfigDirty(true); }} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
);
content = content.replace(
  /<NumberStepper value=\{globalCutPct\} onChange=\{setGlobalCutPct\} min=\{0\} max=\{100\} step=\{0\.5\} decimals=\{1\} suffix="%" \/>/,
  `<NumberStepper value={globalCutPct} onChange={(val) => { setGlobalCutPct(val); setGlobalConfigDirty(true); }} min={0} max={100} step={0.5} decimals={1} suffix="%" />`
);

// 5. Button and Unsaved changes
content = content.replace(
  /<button className="btn btn-accent" onClick=\{handleSaveGlobalConfig\}>\s*Save Global Defaults\s*<\/button>/,
  `<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button className="btn btn-accent" onClick={handleSaveGlobalConfig}>
                            Save Global Defaults
                          </button>
                          {globalConfigDirty && (
                            <button className="btn btn-ghost" onClick={() => {
                              const gRow = (Array.isArray(commissionConfigs) ? commissionConfigs : []).find(c => c.scope === 'GLOBAL');
                              if (gRow) {
                                setGlobalReinvestPct(gRow.stockist_reinvest_pct);
                                setGlobalPointsPct(gRow.points_from_pot_pct);
                                setGlobalCutPct(gRow.partner_redemption_cut_pct);
                              } else {
                                setGlobalReinvestPct(40);
                                setGlobalPointsPct(12);
                                setGlobalCutPct(50);
                              }
                              setGlobalConfigDirty(false);
                            }}>
                              {t('Reset', 'रीसेट करें', 'রিসেট')}
                            </button>
                          )}
                        </div>
                        {globalConfigDirty && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--warning)', margin: 0 }}>
                            {t('Unsaved changes', 'सहेजे नहीं गए बदलाव', 'অসংরক্ষিত পরিবর্তন')}
                          </p>
                        )}`
);

fs.writeFileSync(file, content);
console.log('Done!');
