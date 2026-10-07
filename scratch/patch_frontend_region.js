const fs = require('fs');

const frontendFile = 'x:/app/frontend/src/App.jsx';
let appCode = fs.readFileSync(frontendFile, 'utf8');

// 1. Replace state
appCode = appCode.replace(
  "const [newRegionServiceType, setNewRegionServiceType] = useState('CABLE');",
  "const [newRegionServiceTypes, setNewRegionServiceTypes] = useState([]);"
);

// 2. Open Modal initialization
appCode = appCode.replace(
  "onClick={() => setShowAddRegionModal(true)}",
  "onClick={() => { setNewRegionServiceTypes(partnerData?.service_types || []); setShowAddRegionModal(true); }}"
);

// 3. handleAddRegion modification
const oldHandleAdd = `  const handleAddRegion = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/partner/regions\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${partnerSessionToken}\`
        },
        body: JSON.stringify({ region_id: newRegionId, service_type: newRegionServiceType })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Region mapping added!', 'success');
        setShowAddRegionModal(false);
        fetchPartnerRegions();
      } else {
        showToast(data.message || data.error || \`Request failed (\${typeof res !== 'undefined' ? res.status : 500})\`, 'error');
      }
    } catch (err) {
      showToast('Network error adding region', 'error');
    }
  };`;

const newHandleAdd = `  const handleAddRegion = async () => {
    try {
      const res = await fetch(\`\${API_BASE}/partner/regions\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${partnerSessionToken}\`
        },
        body: JSON.stringify({ region_id: newRegionId, service_types: newRegionServiceTypes })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const createdCount = data.created ? data.created.length : (data.id ? 1 : 0);
        const skippedCount = data.skipped ? data.skipped.length : 0;
        let msg = \`Added \${createdCount} services for \${newRegionId}\`;
        if (skippedCount > 0) msg += \` (\${skippedCount} already existed)\`;
        showToast(msg, 'success');
        setShowAddRegionModal(false);
        fetchPartnerRegions();
      } else {
        showToast(data.message || data.error || \`Request failed (\${res.status})\`, 'error');
      }
    } catch (err) {
      showToast('Network error adding region', 'error');
    }
  };`;

appCode = appCode.replace(oldHandleAdd, newHandleAdd);

// 4. Modal UI modification
const oldModalUI = `                <div className="input-group">
                  <label className="input-label">Service Type</label>
                  <select className="text-input" value={newRegionServiceType} onChange={e => setNewRegionServiceType(e.target.value)}>
                    {(partnerData?.service_types || ['CABLE', 'BROADBAND']).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddRegion}>Add Region</button>`;

const newModalUI = `                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="input-label" style={{ marginBottom: 0 }}>Service Type</label>
                    <div style={{ fontSize: '0.7rem' }}>
                      <a href="#" style={{ color: 'var(--primary)' }} onClick={(e) => { e.preventDefault(); setNewRegionServiceTypes(partnerData?.service_types || []); }}>Select all</a> | <a href="#" style={{ color: 'var(--primary)' }} onClick={(e) => { e.preventDefault(); setNewRegionServiceTypes([]); }}>Clear</a>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
                    {(partnerData?.service_types || ['CABLE', 'BROADBAND']).map(st => {
                      const isAlreadyAdded = (partnerRegionsList || []).some(pr => pr.region_id === newRegionId && pr.service_type === st);
                      return (
                        <label key={st} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: isAlreadyAdded ? 'var(--text-muted)' : 'inherit' }}>
                          <input 
                            type="checkbox"
                            disabled={isAlreadyAdded}
                            checked={isAlreadyAdded ? false : newRegionServiceTypes.includes(st)}
                            onChange={(e) => {
                              if (e.target.checked) setNewRegionServiceTypes(prev => [...prev, st]);
                              else setNewRegionServiceTypes(prev => prev.filter(v => v !== st));
                            }}
                          />
                          {getServiceTypeLabel(st)}
                          {isAlreadyAdded && <span style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>(Already added)</span>}
                        </label>
                      );
                    })}
                  </div>
                  {((partnerData?.service_types || []).every(st => (partnerRegionsList || []).some(pr => pr.region_id === newRegionId && pr.service_type === st)) && (partnerData?.service_types || []).length > 0) && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '0.75rem', textAlign: 'center' }}>
                      All your services are already added for this region.
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }} 
                  onClick={handleAddRegion}
                  disabled={
                    (partnerData?.service_types || []).every(st => (partnerRegionsList || []).some(pr => pr.region_id === newRegionId && pr.service_type === st)) ||
                    newRegionServiceTypes.filter(st => !(partnerRegionsList || []).some(pr => pr.region_id === newRegionId && pr.service_type === st)).length === 0
                  }
                >
                  Add {newRegionServiceTypes.filter(st => !(partnerRegionsList || []).some(pr => pr.region_id === newRegionId && pr.service_type === st)).length} services
                </button>`;

appCode = appCode.replace(oldModalUI, newModalUI);

// 5. Region list readability (sorting)
// Wait, the region list is rendered in the table at ~7530
// Right now it maps `partnerRegionsList`. I should sort `partnerRegionsList` before rendering.
// Let's find where it's mapped.
const oldListRender = `<tbody>
                      {partnerRegionsList.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>{t('No regions mapped', 'कोई क्षेत्र मैप नहीं किया गया', 'কোনো অঞ্চল ম্যাপ করা নেই')}</td></tr>
                      ) : partnerRegionsList.map(r => (`;

const newListRender = `<tbody>
                      {partnerRegionsList.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>{t('No regions mapped', 'कोई क्षेत्र मैप नहीं किया गया', 'কোনো অঞ্চল ম্যাপ করা নেই')}</td></tr>
                      ) : [...partnerRegionsList].sort((a, b) => {
                        if (a.region_id !== b.region_id) return a.region_id.localeCompare(b.region_id);
                        const order = ['CABLE', 'BROADBAND', 'DTH', 'OTT_BUNDLE'];
                        return order.indexOf(a.service_type) - order.indexOf(b.service_type);
                      }).map(r => (`;

appCode = appCode.replace(oldListRender, newListRender);

fs.writeFileSync(frontendFile, appCode);
console.log('Frontend patch applied.');
