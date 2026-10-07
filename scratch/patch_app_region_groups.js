const fs = require('fs');

const file = 'x:/app/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// Insert the new state and useMemo logic near `const [partnerRegionsList, setPartnerRegionsList] = useState([]);`
const oldState = `  // Regions Tab state
  const [partnerRegionsList, setPartnerRegionsList] = useState([]);
  const [allSystemRegions, setAllSystemRegions] = useState([]);`;

const newState = `  // Regions Tab state
  const [partnerRegionsList, setPartnerRegionsList] = useState([]);
  const [regionCardOpenState, setRegionCardOpenState] = useState({});
  const [allSystemRegions, setAllSystemRegions] = useState([]);

  const groupedPartnerRegions = useMemo(() => {
    const groups = {};
    partnerRegionsList.forEach(r => {
      if (!groups[r.region_id]) {
        groups[r.region_id] = {
          region_id: r.region_id,
          region_name: r.region_name || r.region_id,
          region_code: r.region_code || r.region_id,
          services: []
        };
      }
      groups[r.region_id].services.push(r);
    });
    
    const order = ['CABLE', 'BROADBAND', 'DTH', 'OTT_BUNDLE'];
    const getOrder = (t) => {
      const idx = order.indexOf(t);
      return idx === -1 ? 999 : idx;
    };
    
    const arr = Object.values(groups).sort((a, b) => a.region_name.localeCompare(b.region_name));
    arr.forEach(g => {
      g.services.sort((a, b) => getOrder(a.service_type) - getOrder(b.service_type));
    });
    return arr;
  }, [partnerRegionsList]);

  const toggleRegionCard = (regionId) => {
    setRegionCardOpenState(prev => {
      const isAutoOpen = groupedPartnerRegions.length <= 3;
      const currentState = prev[regionId] !== undefined ? prev[regionId] : isAutoOpen;
      return { ...prev, [regionId]: !currentState };
    });
  };
`;
content = content.replace(oldState, newState);


const oldRender = `                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.4rem' }}>{t('Region', 'क्षेत्र', 'এলাকা')}</th>
                        <th style={{ padding: '0.4rem' }}>{t('Type', 'प्रकार', 'ধরন')}</th>
                        <th style={{ padding: '0.4rem' }}>{t('Status', 'स्थिति', 'স্ট্যাটাস')}</th>
                        <th style={{ padding: '0.4rem' }}>{t('Actions', 'कार्रवाई', 'ব্যবস্থা')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerRegionsList.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px dashed var(--border-color)' }}>
                          <td style={{ padding: '0.4rem' }}>
                            <div style={{ fontWeight: 'bold' }}>{r.region_name || r.region_id}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Code: {r.region_code || r.region_id}</div>
                          </td>
                          <td style={{ padding: '0.4rem' }}><span className="badge badge-secondary">{getServiceTypeLabel(r.service_type)}</span></td>
                          <td style={{ padding: '0.4rem' }}>
                            <span className={\`badge \${r.is_active ? 'badge-success' : 'badge-danger'}\`}>
                              {r.is_active ? t('Live', 'लाइव', 'লাইভ') : t('Inactive', 'निष्क्रिय', 'নিষ্ক্রিয়')}
                            </span>
                          </td>
                          <td style={{ padding: '0.4rem' }}>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {r.is_active ? (
                                <button className="btn btn-secondary" style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }} onClick={() => handleDeactivateRegion(r, false)}>
                                  {t('Deactivate', 'निष्क्रिय करें', 'নিষ্ক্রিয় করুন')}
                                </button>
                              ) : (
                                <button className="btn btn-secondary" style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }} onClick={() => handleReactivateRegion(r)}>
                                  {t('Reactivate', 'पुनः सक्रिय करें', 'পুনরায় সক্রিয় করুন')}
                                </button>
                              )}
                              <button className="btn btn-danger" style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }} onClick={() => handleDeleteRegion(r)}>
                                {t('Delete', 'हटाएं', 'মুছুন')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {partnerRegionsList.length === 0 && (
                        <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                          {t("No service regions added yet. Add regions to allow local subscribers to see your packages.", "अभी तक कोई सेवा क्षेत्र नहीं जोड़ा गया है। स्थानीय ग्राहकों को आपके पैकेज देखने की अनुमति देने के लिए क्षेत्र जोड़ें।", "কোনো সেবা এলাকা যোগ করা হয়নি। গ্রাহকদের আপনার প্যাকেজ দেখাতে এলাকা যোগ করুন।")}
                        </td></tr>
                      )}
                    </tbody>
                  </table>`;

const newRender = `                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {groupedPartnerRegions.map(group => {
                      const total = group.services.length;
                      const live = group.services.filter(s => s.is_active).length;
                      const isAutoOpen = groupedPartnerRegions.length <= 3;
                      const isOpen = regionCardOpenState[group.region_id] !== undefined ? regionCardOpenState[group.region_id] : isAutoOpen;
                      
                      return (
                        <div key={group.region_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                          <div 
                            onClick={() => toggleRegionCard(group.region_id)}
                            style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isOpen ? '1px solid var(--border-color)' : 'none' }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{group.region_name}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{group.region_code}</div>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                {t(\`\${live} of \${total} live\`, \`\${total} में से \${live} चालू\`, \`\${total} টির মধ্যে \${live} টি লাইভ\`)}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {group.services.map(s => (
                                  <span key={s.id} className={\`badge \${s.is_active ? 'badge-success' : ''}\`} style={s.is_active ? {} : { background: 'var(--bg-default)', color: 'var(--text-muted)' }}>
                                    {getServiceTypeLabel(s.service_type)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', paddingLeft: '0.5rem' }}>
                              {isOpen ? '▼' : '▶'}
                            </div>
                          </div>
                          
                          {isOpen && (
                            <div style={{ padding: '0 1rem' }}>
                              {group.services.map((r, i) => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: i < group.services.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem', background: 'var(--bg-default)', color: 'var(--text-muted)' }}>{getServiceTypeLabel(r.service_type)}</span>
                                    <span className={\`badge \${r.is_active ? 'badge-success' : 'badge-danger'}\`} style={{ fontSize: '0.65rem' }}>
                                      {r.is_active ? t('Live', 'लाइव', 'লাইভ') : t('Inactive', 'निष्क्रिय', 'নিষ্ক্রিয়')}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    {r.is_active ? (
                                      <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={(e) => { e.stopPropagation(); handleDeactivateRegion(r, false); }}>
                                        {t('Deactivate', 'निष्क्रिय करें', 'নিষ্ক্রিয় করুন')}
                                      </button>
                                    ) : (
                                      <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={(e) => { e.stopPropagation(); handleReactivateRegion(r); }}>
                                        {t('Reactivate', 'पुनः सक्रिय करें', 'পুনরায় সক্রিয় করুন')}
                                      </button>
                                    )}
                                    <button className="btn btn-danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem' }} onClick={(e) => { e.stopPropagation(); handleDeleteRegion(r); }}>
                                      {t('Delete', 'हटाएं', 'মুছুন')}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {groupedPartnerRegions.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                        {t("No service regions added yet. Add regions to allow local subscribers to see your packages.", "अभी तक कोई सेवा क्षेत्र नहीं जोड़ा गया है। स्थानीय ग्राहकों को आपके पैकेज देखने की अनुमति देने के लिए क्षेत्र जोड़ें।", "কোনো সেবা এলাকা যোগ করা হয়নি। গ্রাহকদের আপনার প্যাকেজ দেখাতে এলাকা যোগ করুন।")}
                      </div>
                    )}
                  </div>`;
content = content.replace(oldRender, newRender);

fs.writeFileSync(file, content);
console.log('Appended grouping logic.');
