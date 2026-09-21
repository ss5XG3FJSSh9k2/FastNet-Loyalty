const fs = require('fs');

let lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

// 1. Add state
const stateIdx = lines.findIndex(l => l.includes('const [showCustomDate, setShowCustomDate] = useState(false);'));
if (stateIdx !== -1 && !lines[stateIdx + 1].includes('closedUntilPreset')) {
    lines.splice(stateIdx + 1, 0, '  const [closedUntilPreset, setClosedUntilPreset] = useState(null);');
}

// 2. Add preset clear to toggle
for(let i = 0; i < lines.length; i++) {
    if (lines[i].includes('setShowCustomDate(false);') && lines[i-1].includes('manual_closed: !stockistProfile.manual_closed')) {
        if (!lines[i+1].includes('setClosedUntilPreset(null);')) {
            lines.splice(i+1, 0, '                              setClosedUntilPreset(null);');
        }
        break;
    }
}

// 3. Replace presets block
let startIdx = -1;
for(let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<button') && lines[i+4] && lines[i+4].includes('Until next opening')) {
        startIdx = i;
        break;
    }
}

let endIdx = -1;
if (startIdx !== -1) {
    for(let i = startIdx; i < lines.length; i++) {
        if (lines[i].includes('setClosedUntilDraft(d.toISOString());            // UTC ISO for storage')) {
            endIdx = i;
            while(!lines[endIdx].includes('}}')) {
                endIdx++;
            }
            break;
        }
    }
}

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `                              <button
                                className={\`btn \${closedUntilPreset === 'next' ? 'btn-accent' : 'btn-outline'}\`}
                                onClick={() => { setClosedUntilDraft(''); setClosedUntilPreset('next'); setShowCustomDate(false); }}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                Until next opening <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Shop reopens automatically at your next opening time)</span>
                              </button>
                              
                              <button
                                className={\`btn \${closedUntilPreset === '2h' ? 'btn-accent' : 'btn-outline'}\`}
                                onClick={() => { setClosedUntilDraft(new Date(Date.now() + 2 * 3600 * 1000).toISOString()); setClosedUntilPreset('2h'); setShowCustomDate(false); }}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                2 hours
                              </button>

                              <button
                                className={\`btn \${closedUntilPreset === 'tomorrow' ? 'btn-accent' : 'btn-outline'}\`}
                                onClick={() => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 1);
                                  const op = stockistProfile.opening_time || '09:00';
                                  const [h, m] = op.split(':');
                                  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                                  setClosedUntilDraft(d.toISOString());
                                  setClosedUntilPreset('tomorrow');
                                  setShowCustomDate(false);
                                }}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                Tomorrow morning
                              </button>

                              <button
                                className={\`btn \${closedUntilPreset === 'custom' ? 'btn-accent' : 'btn-outline'}\`}
                                onClick={() => { setShowCustomDate(true); setClosedUntilPreset('custom'); }}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                Specific date <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(e.g. back from vacation)</span>
                              </button>

                              {showCustomDate && (
                                <input
                                  type="date"
                                  className="text-input"
                                  min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10); })()}
                                  max={(() => { const d = new Date(); d.setDate(d.getDate() + 90); return d.toISOString().slice(0,10); })()}
                                  onChange={e => {
                                    if (!e.target.value) return;
                                    const [y, mo, dd] = e.target.value.split('-').map(Number);
                                    const op = stockistProfile.opening_time || '09:00';
                                    const [h, m] = op.split(':').map(Number);
                                    const d = new Date(y, mo - 1, dd, h, m, 0, 0);  // local date @ opening time
                                    setClosedUntilDraft(d.toISOString());            // UTC ISO for storage
                                    setClosedUntilPreset('custom');
                                  }}`.split('\n');
    lines.splice(startIdx, endIdx - startIdx + 1, ...replacement);
} else {
    console.log("Could not find presets block", startIdx, endIdx);
}

// 4. Cancel button
for(let i = 0; i < lines.length; i++) {
    if (lines[i].includes('onClick={() => { setClosedUntilDraft(null); setShowCustomDate(false); }}')) {
        lines[i] = lines[i].replace('setShowCustomDate(false);', 'setShowCustomDate(false); setClosedUntilPreset(null);');
    }
}

fs.writeFileSync('src/App.jsx', lines.join('\n'));
console.log('Done!');
