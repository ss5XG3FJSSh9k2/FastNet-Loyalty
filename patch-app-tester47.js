const fs = require('fs');

let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Add StockistSettings states
const stockistStatesRegex = /const \[stockistActiveTab, setStockistActiveTab\] = useState\('orders'\);.*?\n/s;
const settingsStateStr = `const [stockistActiveTab, setStockistActiveTab] = useState('orders'); // orders | analytics | inventory | settings
  const [stockistSettings, setStockistSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
`;
appContent = appContent.replace(stockistStatesRegex, settingsStateStr);


// 2. Initialize stockistSettings inside loadStockistData
const loadStockistDataRegex = /setStockistProfile\(pData\);/s;
appContent = appContent.replace(loadStockistDataRegex, "setStockistProfile(pData);\n      setStockistSettings(pData);");


// 3. Extract the Settings UI elements from current analytics tab (lines 9367-9388)
const shopProfileCardRegex = /<div className="stockist-profile-card glass-card".*?Change phone number\n\s*<\/button>\n\s*<\/div>\n\s*<div>\n\s*<span style=\{\{ color: 'var\(--text-muted\)' \}\}>Shop Area \/ Region: <\/span>\n\s*<strong style=\{\{ color: 'white' \}\}>\{regions\.find\(r => r\.id === stockistProfile\.region_id\)\?\.name \|\| stockistProfile\.region_id\}<\/strong>\n\s*<p style=\{\{ fontSize: '0\.65rem', color: 'var\(--text-muted\)', marginTop: '0\.2rem', marginBottom: 0 \}\}>\n\s*Contact FastNet support to change your shop's area\.\n\s*<\/p>\n\s*<\/div>\n\s*<\/div>/s;

appContent = appContent.replace(shopProfileCardRegex, "");

const logoutBtnRegex = /<button className="btn btn-danger" style=\{\{ width: '100%', marginTop: 'auto', fontSize: '0\.8rem', minHeight: '36px', height: '36px' \}\} onClick=\{handleLogout\}>Log Out<\/button>/s;
appContent = appContent.replace(logoutBtnRegex, "");

const languageSelectorRegex = /\{\/\*  J: Stockist language selector \*\/\}.*?<select className="text-input" style=\{\{ fontSize: '0\.75rem', padding: '0\.2rem 0\.4rem', width: 'auto' \}\} value=\{lang\} onChange=\{e => setLang\(e\.target\.value\)\}>\n\s*<option value="en">English<\/option>\n\s*<option value="hi">हिंदी<\/option>\n\s*<option value="bn">বাংলা<\/option>\n\s*<\/select>\n\s*<\/div>/s;
appContent = appContent.replace(languageSelectorRegex, "");

const networkToggleRegex = /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var\(--bg-surface\)', padding: '0\.75rem', borderRadius: '8px', border: '1px solid var\(--border-color\)' \}\}>\n\s*<div>\n\s*<h4 style=\{\{ fontSize: '0\.8rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0\.25rem' \}\}>\n\s*<Signal size=\{14\} \/> \{t\("Network Signal", "नेटवर्क सिग्नल", "নেটওয়ার্ক সিগন্যাল"\)\}\n\s*<\/h4>\n\s*<p style=\{\{ color: 'var\(--text-muted\)', fontSize: '0\.65rem' \}\}>\{t\("Test offline rural store state", "ऑफलाइन ग्रामीण स्टोर स्थिति का परीक्षण करें", "অফলাইন গ্রামীণ স্টোর অবস্থার পরীক্ষা করুন"\)\}<\/p>\n\s*<\/div>\n\s*<button\n\s*onClick=\{toggleOfflineMode\}\n\s*className={`toggle-switch \$\{isOffline \? 'active' : ''\}`}\n\s*>\n\s*<div className="toggle-slider"><\/div>\n\s*<\/button>\n\s*<\/div>/s;
appContent = appContent.replace(networkToggleRegex, "");


// 4. Add the handleSaveSettings function and Settings Tab JSX right before the phone-nav rendering
const settingsJsx = `
                  {stockistActiveTab === 'settings' && stockistSettings && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                        <Settings size={16} style={{ color: 'var(--primary)' }} />
                        {t("Shop Settings", "दुकान सेटिंग", "দোকান সেটিংস")}
                      </h3>

                      {/* Manual Closure */}
                      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: stockistSettings.manual_closed ? '3px solid var(--danger-color)' : '3px solid var(--success-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>Shop Status: {stockistSettings.manual_closed ? <span style={{color: 'var(--danger-color)'}}>Closed</span> : <span style={{color: 'var(--success-color)'}}>Open</span>}</h4>
                          <button 
                            className={\`toggle-switch \${stockistSettings.manual_closed ? 'active' : ''}\`} 
                            style={{ background: stockistSettings.manual_closed ? 'var(--danger-color)' : 'var(--success-color)' }}
                            onClick={() => setStockistSettings({ ...stockistSettings, manual_closed: !stockistSettings.manual_closed, closed_until: '' })}
                          >
                            <div className="toggle-slider"></div>
                          </button>
                        </div>
                        
                        {stockistSettings.manual_closed && (
                          <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">Closed until (Optional)</label>
                            <input 
                              type="datetime-local" 
                              className="text-input" 
                              value={stockistSettings.closed_until ? stockistSettings.closed_until.substring(0,16) : ''}
                              onChange={e => {
                                const dt = e.target.value ? new Date(e.target.value).toISOString() : '';
                                setStockistSettings({ ...stockistSettings, closed_until: dt });
                              }}
                            />
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>If left empty, shop will automatically reopen at the next scheduled opening time.</p>
                          </div>
                        )}
                      </div>

                      {/* Operational Settings */}
                      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>Operational Settings</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">Opening Time</label>
                            <input type="time" className="text-input" value={stockistSettings.opening_time || '09:00'} onChange={e => setStockistSettings({...stockistSettings, opening_time: e.target.value})} />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label className="input-label">Closing Time</label>
                            <input type="time" className="text-input" value={stockistSettings.closing_time || '17:00'} onChange={e => setStockistSettings({...stockistSettings, closing_time: e.target.value})} />
                          </div>
                        </div>

                        <div className="input-group" style={{ margin: 0 }}>
                          <label className="input-label">Preparation Time (minutes)</label>
                          <input type="number" min="5" max="120" className="text-input" value={stockistSettings.prep_eta_minutes || 15} onChange={e => setStockistSettings({...stockistSettings, prep_eta_minutes: parseInt(e.target.value, 10)})} />
                        </div>

                        <div className="input-group" style={{ margin: 0 }}>
                          <label className="input-label">Delivery Radius (km)</label>
                          <input type="number" step="0.1" max={stockistProfile.max_delivery_radius_km || 5.0} className="text-input" value={stockistSettings.delivery_radius_km || 5.0} onChange={e => setStockistSettings({...stockistSettings, delivery_radius_km: e.target.value})} />
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Maximum allowed: {stockistProfile.max_delivery_radius_km || 5.0} km</p>
                        </div>
                      </div>

                      {/* Payout Details */}
                      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>Payout Details</h4>
                        
                        <div className="input-group" style={{ margin: 0 }}>
                          <label className="input-label">UPI ID (Primary)</label>
                          <input type="text" placeholder="name@bank" className="text-input" value={stockistSettings.payout_upi_id || ''} onChange={e => setStockistSettings({...stockistSettings, payout_upi_id: e.target.value})} />
                        </div>

                        <div style={{ borderTop: '1px dashed var(--border-color)', margin: '0.5rem 0' }}></div>

                        <div className="input-group" style={{ margin: 0 }}>
                          <label className="input-label">Bank Account Number (Fallback)</label>
                          <input type="text" className="text-input" value={stockistSettings.payout_bank_account || ''} onChange={e => setStockistSettings({...stockistSettings, payout_bank_account: e.target.value})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label className="input-label">IFSC Code</label>
                          <input type="text" placeholder="ABCD0123456" className="text-input" value={stockistSettings.payout_ifsc || ''} onChange={e => setStockistSettings({...stockistSettings, payout_ifsc: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label className="input-label">Account Holder Name</label>
                          <input type="text" className="text-input" value={stockistSettings.payout_account_name || ''} onChange={e => setStockistSettings({...stockistSettings, payout_account_name: e.target.value})} />
                        </div>
                      </div>

                      {/* Read-Only Information */}
                      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.8 }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>Account Information</h4>
                        
                        <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div><span style={{color: 'var(--text-muted)'}}>Region: </span><strong>{regions.find(r => r.id === stockistSettings.region_id)?.name || stockistSettings.region_id}</strong></div>
                          <div><span style={{color: 'var(--text-muted)'}}>Wholesaler: </span><strong>{vendors.find(v => v.id === stockistSettings.vendor_id)?.name || stockistSettings.vendor_id}</strong></div>
                          <div><span style={{color: 'var(--text-muted)'}}>Commission Rate: </span><strong>{stockistSettings.commission_rate}%</strong></div>
                          <div><span style={{color: 'var(--text-muted)'}}>Minimum Order: </span><strong>₹{stockistSettings.min_order_value}</strong></div>
                          <p style={{ fontSize: '0.65rem', color: 'var(--accent)', marginTop: '0.2rem', marginBottom: 0 }}>
                            Contact FastNet support to change any of these details.
                          </p>
                        </div>
                      </div>

                      {/* Consolidated App Preferences */}
                      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>App Preferences</h4>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Language</span>
                          <select className="text-input" style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', width: 'auto' }} value={lang} onChange={e => setLang(e.target.value)}>
                            <option value="en">English</option>
                            <option value="hi">हिंदी</option>
                            <option value="bn">বাংলা</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone Number</span>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} onClick={() => { setSelfServiceNewPhone(''); setSelfServiceOtp(''); setSelfServiceOtpSent(false); setShowSelfServicePhoneModal(true); }}>
                            Change
                          </button>
                        </div>

                        {developerOptions && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                            <div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Test Network Signal</span>
                            </div>
                            <button onClick={toggleOfflineMode} className={\`toggle-switch \${isOffline ? 'active' : ''}\`}>
                              <div className="toggle-slider"></div>
                            </button>
                          </div>
                        )}
                      </div>

                      <button 
                        className="btn btn-accent" 
                        disabled={savingSettings}
                        style={{ width: '100%', minHeight: '40px', marginTop: '0.5rem' }}
                        onClick={async () => {
                          setSavingSettings(true);
                          try {
                            const res = await fetch(\`\${API_BASE}/stockist/profile\`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
                              body: JSON.stringify(stockistSettings)
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(()=>({}));
                              showToast(err.error || 'Failed to save settings', 'error');
                            } else {
                              const data = await res.json();
                              setStockistProfile(data.stockist);
                              setStockistSettings(data.stockist);
                              showToast('Settings saved successfully', 'success');
                            }
                          } catch(e) {
                            showToast('Network error', 'error');
                          } finally {
                            setSavingSettings(false);
                          }
                        }}
                      >
                        {savingSettings ? 'Saving...' : 'Save Settings'}
                      </button>

                      <button className="btn btn-danger" style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem', minHeight: '36px', height: '36px' }} onClick={handleLogout}>Log Out</button>
                    </div>
                  )}
                  
                  {/* END STOCKIST SETTINGS */}
`;

const settingsInsertionPoint = /\{\/\* \-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\- \*\/\}\n\s*\{\/\* 4\. PHONE NAV BAR \*\/\}/s;
appContent = appContent.replace(settingsInsertionPoint, settingsJsx + "\n                {/* ------------------------------------------------------------------------ */}\n                {/* 4. PHONE NAV BAR */}");


// 5. Add Settings Tab Button to Nav
const phoneNavButtonsRegex = /<button className={`phone-nav-btn \$\{stockistActiveTab === 'analytics' \? 'active' : ''\}`} onClick=\{.*?\}\n\s*<BarChart2 size=\{18\} \/>\n\s*\{t\("Analytics", "एनालिटिक्स", "অ্যানালিটিক্স"\)\}\n\s*<\/button>/s;

const settingsNavButton = `<button className={\`phone-nav-btn \${stockistActiveTab === 'analytics' ? 'active' : ''}\`} onClick={() => { setStockistActiveTab('analytics'); loadStockistData(); }}>
                    <BarChart2 size={18} />
                    {t("Analytics", "एनालिटिक्स", "অ্যানালিটিক্স")}
                  </button>
                  <button className={\`phone-nav-btn \${stockistActiveTab === 'settings' ? 'active' : ''}\`} onClick={() => setStockistActiveTab('settings')}>
                    <Settings size={18} />
                    {t("Settings", "सेटिंग्स", "সেটিংস")}
                  </button>`;
                  
appContent = appContent.replace(phoneNavButtonsRegex, settingsNavButton);


// 6. Fix "Closed until" formatter in customer shop lists
const formatReopenRegex = /const closedText = t\(\n\s*'Cancellation window closed'/s;
const helperFunc = `
  const formatReopenTime = (s) => {
    if (s.closed_until) {
      const d = new Date(s.closed_until);
      return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    return s.opening_time || '09:00';
  };

  const closedText = t(
    'Cancellation window closed'`;
appContent = appContent.replace(formatReopenRegex, helperFunc);


const customerClosedTimeReplacement1 = /`This shop is closed\. It reopens at \$\{s\.opening_time \|\| '09:00'\}`,\s*`यह दुकान बंद है। यह \$\{s\.opening_time \|\| '09:00'\} पर फिर से खुलेगी`,\s*`এই দোকানটি বন্ধ। এটি পুনরায় খুলবে \$\{s\.opening_time \|\| '09:00'\}-এ`/g;
const newCustomerClosedTime1 = "`This shop is closed. It reopens at ${formatReopenTime(s)}`, `यह दुकान बंद है। यह ${formatReopenTime(s)} पर फिर से खुलेगी`, `এই দোকানটি বন্ধ। এটি পুনরায় খুলবে ${formatReopenTime(s)}-এ`";
appContent = appContent.replace(customerClosedTimeReplacement1, newCustomerClosedTime1);


const customerClosedTimeReplacement2 = /`\$\{t\('Closed', 'बंद', 'বন্ধ'\)\}\s*\$\{s\.opening_time \|\| '09:00'\}`/g;
const newCustomerClosedTime2 = "`${t('Closed', 'बंद', 'বন্ধ')} ${formatReopenTime(s)}`";
appContent = appContent.replace(customerClosedTimeReplacement2, newCustomerClosedTime2);


// 7. Render Payout details in Admin Wholesalers -> Payouts -> Row
const adminPayoutsRegex = /<td style=\{\{ padding: '0\.75rem', fontSize: '0\.8rem' \}\}>\n\s*<div style=\{\{ fontWeight: '500', color: 'white' \}\}>\{item\.shopName\}<\/div>\n\s*<div style=\{\{ fontSize: '0\.7rem', color: 'var\(--text-muted\)' \}\}>\{item\.stockistName\}<\/div>\n\s*<\/td>/s;
const newAdminPayouts = `<td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                                    <div style={{ fontWeight: '500', color: 'white' }}>{item.shopName}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.stockistName}</div>
                                    {stockists.find(s => s.id === item.stockistId)?.payout_upi_id ? (
                                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
                                        UPI: {stockists.find(s => s.id === item.stockistId).payout_upi_id}
                                      </div>
                                    ) : stockists.find(s => s.id === item.stockistId)?.payout_bank_account ? (
                                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
                                        Bank: {stockists.find(s => s.id === item.stockistId).payout_bank_account} (IFSC: {stockists.find(s => s.id === item.stockistId).payout_ifsc})
                                      </div>
                                    ) : null}
                                  </td>`;
appContent = appContent.replace(adminPayoutsRegex, newAdminPayouts);


// 8. Mask Payouts in generic admin stockist list views
const adminStockistRowRegex = /<div style=\{\{ color: 'white', fontWeight: '500' \}\}>\{s\.shop_name \|\| s\.name\}<\/div>\n\s*<div style=\{\{ fontSize: '0\.7rem', color: 'var\(--text-muted\)' \}\}>\{s\.phone\}<\/div>\n\s*<\/div>\n\s*<\/td>/s;
const newAdminStockistRow = `<div style={{ color: 'white', fontWeight: '500' }}>{s.shop_name || s.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.phone}</div>
                                {s.payout_upi_id && (
                                  <div style={{ fontSize: '0.65rem', color: 'var(--accent)', marginTop: '0.15rem' }}>
                                    UPI: {'****' + s.payout_upi_id.substring(s.payout_upi_id.indexOf('@'))}
                                  </div>
                                )}
                                {!s.payout_upi_id && s.payout_bank_account && (
                                  <div style={{ fontSize: '0.65rem', color: 'var(--accent)', marginTop: '0.15rem' }}>
                                    Bank: {'******' + s.payout_bank_account.slice(-4)}
                                  </div>
                                )}
                              </div>
                            </td>`;
appContent = appContent.replace(adminStockistRowRegex, newAdminStockistRow);


fs.writeFileSync('frontend/src/App.jsx', appContent, 'utf8');
console.log('App.jsx patched successfully for TESTER-47');
