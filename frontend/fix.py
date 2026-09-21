with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. State
text = text.replace(
'''  const [closedUntilDraft, setClosedUntilDraft] = useState(null);
  const [showCustomDate, setShowCustomDate] = useState(false);''',
'''  const [closedUntilDraft, setClosedUntilDraft] = useState(null);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [closedUntilPreset, setClosedUntilPreset] = useState(null);'''
)

# 2. Toggle clear
text = text.replace(
'''                            onClick={() => {
                              setStockistProfile({ ...stockistProfile, manual_closed: !stockistProfile.manual_closed, closed_until: '' });
                              setShowCustomDate(false);
                            }}''',
'''                            onClick={() => {
                              setStockistProfile({ ...stockistProfile, manual_closed: !stockistProfile.manual_closed, closed_until: '' });
                              setShowCustomDate(false);
                              setClosedUntilPreset(null);
                            }}'''
)

# 3. Presets
text = text.replace(
'''                              <button
                                className={`btn ${((closedUntilDraft !== null ? closedUntilDraft : (stockistProfile.closed_until || '')) === '') ? 'btn-accent' : 'btn-outline'}`}
                                onClick={() => setClosedUntilDraft('')}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                Until next opening <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Shop reopens automatically at your next opening time)</span>
                              </button>
                              
                              <button
                                className={`btn ${((closedUntilDraft !== null ? closedUntilDraft : stockistProfile.closed_until) && !['23:59'].includes(new Date(closedUntilDraft !== null ? closedUntilDraft : stockistProfile.closed_until).toLocaleTimeString([],{hour12:false,hour:'2-digit',minute:'2-digit'})) && new Date(closedUntilDraft !== null ? closedUntilDraft : stockistProfile.closed_until).getDate() === new Date().getDate()) ? 'btn-accent' : 'btn-outline'}`}
                                onClick={() => setClosedUntilDraft(new Date(Date.now() + 2 * 3600 * 1000).toISOString())}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                2 hours
                              </button>

                              <button
                                className={`btn ${((closedUntilDraft !== null ? closedUntilDraft : stockistProfile.closed_until) && new Date(closedUntilDraft !== null ? closedUntilDraft : stockistProfile.closed_until).getDate() !== new Date().getDate()) ? 'btn-accent' : 'btn-outline'}`}
                                onClick={() => {
                                  const d = new Date();
                                  d.setDate(d.getDate() + 1);
                                  const op = stockistProfile.opening_time || '09:00';
                                  const [h, m] = op.split(':');
                                  d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                                  setClosedUntilDraft(d.toISOString());
                                }}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                Tomorrow morning
                              </button>

                              <button
                                className={`btn ${showCustomDate ? 'btn-accent' : 'btn-outline'}`}
                                onClick={() => setShowCustomDate(true)}
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
                                  }}''',
'''                              <button
                                className={`btn ${closedUntilPreset === 'next' ? 'btn-accent' : 'btn-outline'}`}
                                onClick={() => { setClosedUntilDraft(''); setClosedUntilPreset('next'); setShowCustomDate(false); }}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                Until next opening <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Shop reopens automatically at your next opening time)</span>
                              </button>
                              
                              <button
                                className={`btn ${closedUntilPreset === '2h' ? 'btn-accent' : 'btn-outline'}`}
                                onClick={() => { setClosedUntilDraft(new Date(Date.now() + 2 * 3600 * 1000).toISOString()); setClosedUntilPreset('2h'); setShowCustomDate(false); }}
                                style={{ textAlign: 'left', padding: '0.5rem' }}
                              >
                                2 hours
                              </button>

                              <button
                                className={`btn ${closedUntilPreset === 'tomorrow' ? 'btn-accent' : 'btn-outline'}`}
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
                                className={`btn ${closedUntilPreset === 'custom' ? 'btn-accent' : 'btn-outline'}`}
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
                                  }}'''
)

# 4. Cancel
text = text.replace(
'''<button className="btn btn-secondary" onClick={() => { setClosedUntilDraft(null); setShowCustomDate(false); }} style={{ padding: '0.4rem 0.8rem' }}>Cancel</button>''',
'''<button className="btn btn-secondary" onClick={() => { setClosedUntilDraft(null); setShowCustomDate(false); setClosedUntilPreset(null); }} style={{ padding: '0.4rem 0.8rem' }}>Cancel</button>'''
)

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
