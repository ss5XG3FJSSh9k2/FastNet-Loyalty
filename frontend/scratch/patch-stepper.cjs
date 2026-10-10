const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update NumberStepper
const stepperSearch = `const NumberStepper = ({ id, value, onChange, min, max, step, decimals = 0, suffix = '', size = 'md' }) => {`;
const stepperReplace = `const NumberStepper = ({ id, value, onChange, min, max, step, decimals = 0, suffix = '', size = 'md', fullWidth = false }) => {`;
content = content.replace(stepperSearch, stepperReplace);

const valStyleSearch = `  const valStyle = sm
    ? { textAlign: 'center', width: 48, flexShrink: 0, padding: '0.25rem' }
    : { textAlign: 'center', flex: 1, minWidth: 0 };`;
const valStyleReplace = `  const valStyle = sm
    ? { textAlign: 'center', width: 48, flexShrink: 0, padding: '0.25rem', height: btn, boxSizing: 'border-box' }
    : { textAlign: 'center', flex: 1, minWidth: 60, height: btn, boxSizing: 'border-box' };`;
content = content.replace(valStyleSearch, valStyleReplace);

const stepperDivSearch = `<div style={{ display: 'inline-flex', alignItems: 'center', gap: sm ? '0.25rem' : '0.5rem' }}>`;
const stepperDivReplace = `<div style={{ display: fullWidth ? 'flex' : 'inline-flex', alignItems: 'center', gap: sm ? '0.25rem' : '0.5rem', width: fullWidth ? '100%' : undefined }}>`;
content = content.replace(stepperDivSearch, stepperDivReplace);

// 2. Fix Add Stockist Modal layout
const addGrid1Search = `              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group">
                  <label className="input-label">Commission Rate (%)</label>
                  <NumberStepper value={createStkRate} onChange={setCreateStkRate} min={0} max={100} step={0.5} decimals={1} suffix="%" />
                </div>
                <div className="input-group">
                  <label className="input-label">Delivery Radius (km)</label>
                  <NumberStepper value={createStkRadius} onChange={v => setCreateStkRadius(parseFloat(v))} min={0.5} step={0.5} decimals={1} suffix="km" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">Open Time</label>
                  <input type="text" className="text-input" value={createStkOpen} onChange={e => setCreateStkOpen(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Close Time</label>
                  <input type="text" className="text-input" value={createStkClose} onChange={e => setCreateStkClose(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Prep ETA (m)</label>
                  <NumberStepper value={createStkEta} onChange={v => setCreateStkEta(parseInt(v, 10))} min={5} max={120} step={5} decimals={0} />
                </div>
              </div>`;

const addGrid1Replace = `              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', alignItems: 'start' }}>
                <div className="input-group">
                  <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title="Commission Rate (%)">Commission Rate</label>
                  <NumberStepper value={createStkRate} onChange={setCreateStkRate} min={0} max={100} step={0.5} decimals={1} suffix="%" fullWidth />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title="Open Time">Open Time</label>
                  <input type="text" className="text-input" value={createStkOpen} onChange={e => setCreateStkOpen(e.target.value)} style={{ height: '44px', boxSizing: 'border-box' }} />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title="Close Time">Close Time</label>
                  <input type="text" className="text-input" value={createStkClose} onChange={e => setCreateStkClose(e.target.value)} style={{ height: '44px', boxSizing: 'border-box' }} />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title="Prep ETA (min)">Prep ETA</label>
                  <NumberStepper value={createStkEta} onChange={v => setCreateStkEta(parseInt(v, 10))} min={5} max={120} step={5} decimals={0} fullWidth />
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title="Delivery Radius (km)">Delivery Radius</label>
                  <NumberStepper value={createStkRadius} onChange={v => setCreateStkRadius(parseFloat(v))} min={0.5} step={0.5} decimals={1} suffix="km" fullWidth />
                </div>
              </div>`;
content = content.replace(addGrid1Search, addGrid1Replace);


// 3. Fix Edit Stockist Modal Layout
const editGrid1Search = `              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                <div className="input-group">
                  <label htmlFor="edit-stk-open" className="input-label">
                    {t('Opening Time', 'खुलने का समय', 'খোলার সময়')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    id="edit-stk-open" 
                    type="text" 
                    placeholder="HH:MM" 
                    className="text-input" 
                    value={editStkOpen} 
                    onChange={e => setEditStkOpen(e.target.value)} 
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="edit-stk-close" className="input-label">
                    {t('Closing Time', 'बंद होने का समय', 'বন্ধের সময়')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    id="edit-stk-close" 
                    type="text" 
                    placeholder="HH:MM" 
                    className="text-input" 
                    value={editStkClose} 
                    onChange={e => setEditStkClose(e.target.value)} 
                    required
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="edit-stk-eta" className="input-label">
                    {t('Prep ETA (min)', 'तैयारी का समय (मिनट)', 'প্রস্তুতি সময় (মিনিট)')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <NumberStepper id="edit-stk-eta" value={editStkEta} onChange={v => setEditStkEta(parseInt(v, 10))} min={5} max={120} step={5} decimals={0} />
                </div>
                <div className="input-group">
                  <label htmlFor="edit-stk-radius" className="input-label">
                    {t('Delivery Radius (km)', 'डिलीवरी का दायरा (किमी)', 'ডেলিভারি ব্যাসার্ধ (কিমি)')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <NumberStepper id="edit-stk-radius" value={editStkRadius} onChange={v => setEditStkRadius(parseFloat(v))} min={0.5} step={0.5} decimals={1} suffix="km" />
                </div>
              </div>`;

const editGrid1Replace = `              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', alignItems: 'start' }}>
                <div className="input-group">
                  <label htmlFor="edit-stk-open" className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t('Opening Time', 'खुलने का समय', 'খোলার সময়')}>
                    {t('Opening Time', 'खुलने का समय', 'খোলার সময়')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    id="edit-stk-open" 
                    type="text" 
                    placeholder="HH:MM" 
                    className="text-input" 
                    value={editStkOpen} 
                    onChange={e => setEditStkOpen(e.target.value)} 
                    required
                    style={{ height: '44px', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="edit-stk-close" className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t('Closing Time', 'बंद होने का समय', 'বন্ধের সময়')}>
                    {t('Closing Time', 'बंद होने का समय', 'বন্ধের সময়')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input 
                    id="edit-stk-close" 
                    type="text" 
                    placeholder="HH:MM" 
                    className="text-input" 
                    value={editStkClose} 
                    onChange={e => setEditStkClose(e.target.value)} 
                    required
                    style={{ height: '44px', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="edit-stk-eta" className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t('Prep ETA (min)', 'तैयारी का समय (मिनट)', 'প্রস্তুতি সময় (মিনিট)')}>
                    {t('Prep ETA', 'तैयारी का समय', 'প্রস্তুতি সময়')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <NumberStepper id="edit-stk-eta" value={editStkEta} onChange={v => setEditStkEta(parseInt(v, 10))} min={5} max={120} step={5} decimals={0} fullWidth />
                </div>
                <div className="input-group">
                  <label htmlFor="edit-stk-radius" className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t('Delivery Radius (km)', 'डिलीवरी का दायरा (किमी)', 'ডেলিভারি ব্যাসার্ধ (কিমি)')}>
                    {t('Delivery Radius', 'डिलीवरी का दायरा', 'ডেলিভারি ব্যাসার্ধ')} <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <NumberStepper id="edit-stk-radius" value={editStkRadius} onChange={v => setEditStkRadius(parseFloat(v))} min={0.5} step={0.5} decimals={1} suffix="km" fullWidth />
                </div>
              </div>`;

content = content.replace(editGrid1Search, editGrid1Replace);

const editGrid2Search = `              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                <div className="input-group">
                  <label className="input-label">{t('Region', 'क्षेत्र', 'অঞ্চল')} <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="text-input" value={editStkRegion} onChange={e => setEditStkRegion(e.target.value)}>
                    <option value="">{t('Select Region...', 'क्षेत्र चुनें...', 'অঞ্চল নির্বাচন করুন...')}</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">{t('Wholesaler', 'थोक विक्रेता', 'হোলসেলার')} <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="text-input" value={editStkVendor} onChange={e => setEditStkVendor(e.target.value)}>
                    <option value="">{t('Select Wholesaler...', 'थोक विक्रेता चुनें...', 'হোলসেলার নির্বাচন করুন...')}</option>
                    {vendors.filter(v => !editStkRegion || v.region_id === editStkRegion).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">{t('Min Order (₹)', 'न्यूनतम ऑर्डर (₹)', 'সর্বনিম্ন ऑर्डर (₹)')}</label>
                  <NumberStepper value={editStkMinOrder} onChange={v => setEditStkMinOrder(parseFloat(v))} min={0} step={50} decimals={0} suffix="₹" />
                </div>
              </div>`;

const editGrid2Replace = `              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', alignItems: 'start' }}>
                <div className="input-group">
                  <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t('Region', 'क्षेत्र', 'অঞ্চল')}>{t('Region', 'क्षेत्र', 'অঞ্চল')} <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="text-input" value={editStkRegion} onChange={e => setEditStkRegion(e.target.value)} style={{ height: '44px', boxSizing: 'border-box' }}>
                    <option value="">{t('Select Region...', 'क्षेत्र चुनें...', 'অঞ্চল নির্বাচন করুন...')}</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t('Wholesaler', 'थोक विक्रेता', 'হোলসেলার')}>{t('Wholesaler', 'थोक विक्रेता', 'হোলসেলার')} <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="text-input" value={editStkVendor} onChange={e => setEditStkVendor(e.target.value)} style={{ height: '44px', boxSizing: 'border-box' }}>
                    <option value="">{t('Select Wholesaler...', 'थोक विक्रेता चुनें...', 'হোলসেলার নির্বাচন করুন...')}</option>
                    {vendors.filter(v => !editStkRegion || v.region_id === editStkRegion).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t('Min Order (₹)', 'न्यूनतम ऑर्डर (₹)', 'সর্বনিম্ন ऑर्डर (₹)')}>{t('Min Order', 'न्यूनतम ऑर्डर', 'সর্বনিম্ন ऑर्डर')}</label>
                  <NumberStepper value={editStkMinOrder} onChange={v => setEditStkMinOrder(parseFloat(v))} min={0} step={50} decimals={0} suffix="₹" fullWidth />
                </div>
              </div>`;

content = content.replace(editGrid2Search, editGrid2Replace);

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx patched successfully');
