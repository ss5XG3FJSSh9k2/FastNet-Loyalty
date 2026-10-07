const fs = require('fs');
const file = 'x:/app/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state
const oldState = "  const [adminView, setAdminView] = useState('overview');";
const newState = "  const [adminView, setAdminView] = useState('overview');\n  const [adminPayoutNotices, setAdminPayoutNotices] = useState([]);";
content = content.replace(oldState, newState);

// 2. Add fetch function
const oldFetchData = "  const loadAdminData = async () => {";
const newFetchData = `  const fetchAdminPayoutNotices = async (token) => {
    try {
      const res = await fetch(\`\${API_BASE}/admin/payout-notices\`, { headers: { Authorization: \`Bearer \${token}\` }});
      if (res.ok) {
        const data = await res.json();
        setAdminPayoutNotices(data.notices || []);
      }
    } catch (e) { console.error('Error fetching admin payout notices', e); }
  };

  const handleMarkPayoutNoticeReviewed = async (id) => {
    try {
      const res = await fetch(\`\${API_BASE}/admin/payout-notices/\${id}/review\`, { method: 'POST', headers: { Authorization: \`Bearer \${adminToken}\` }});
      if (res.ok) {
        fetchAdminPayoutNotices(adminToken);
      }
    } catch (e) { console.error(e); }
  };

  const loadAdminData = async () => {`;
content = content.replace(oldFetchData, newFetchData);

// 3. Call fetch in checkAdminSession
const oldCheckSession = `        loadAdminData();
      } else {
        setAdminToken('');`;
const newCheckSession = `        loadAdminData();
        fetchAdminPayoutNotices(data.token);
      } else {
        setAdminToken('');`;
content = content.replace(oldCheckSession, newCheckSession);

// 4. Add to handleAdminLogin
const oldLogin = `        loadAdminData();
        // Return success info if needed by a caller
      } else {
        showToast(data.error || 'Login failed', 'error');`;
const newLogin = `        loadAdminData();
        fetchAdminPayoutNotices(data.token);
        // Return success info if needed by a caller
      } else {
        showToast(data.error || 'Login failed', 'error');`;
content = content.replace(oldLogin, newLogin);

// 5. Add to nav tabs
const oldNav = `<button className={\`nav-btn \${adminView === 'promos' ? 'active' : ''}\`} onClick={() => handleAdminNav('promos')}>{t('Promos', 'प्रोमो', 'প্রোমো')}</button>
          </div>
        </div>`;
const newNav = `<button className={\`nav-btn \${adminView === 'promos' ? 'active' : ''}\`} onClick={() => handleAdminNav('promos')}>{t('Promos', 'प्रोमो', 'প্রোমো')}</button>
            <button className={\`nav-btn \${adminView === 'payout-changes' ? 'active' : ''}\`} onClick={() => handleAdminNav('payout-changes')} style={{ position: 'relative' }}>
              {t('Payout changes', 'भुगतान परिवर्तन', 'পেআউট পরিবর্তন')}
              {adminPayoutNotices.filter(n => !n.reviewed_at).length > 0 && (
                <span className="badge badge-danger" style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '0.65rem' }}>
                  {adminPayoutNotices.filter(n => !n.reviewed_at).length}
                </span>
              )}
            </button>
          </div>
        </div>`;
content = content.replace(oldNav, newNav);

// 6. Add payout-changes view
const oldSwitchView = `          {adminView === 'promos' && (
            <div className="admin-panel">`;
const newSwitchView = `          {adminView === 'payout-changes' && (
            <div className="admin-panel">
              <div className="panel-header">
                <h2>{t('Payout changes', 'भुगतान परिवर्तन', 'পেআউট পরিবর্তন')}</h2>
              </div>
              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Entity Type</th>
                      <th>Entity ID</th>
                      <th>Changed Fields</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPayoutNotices.map(n => (
                      <tr key={n.id}>
                        <td>{new Date(n.created_at).toLocaleString()}</td>
                        <td>{n.entity_type}</td>
                        <td style={{ fontSize: '0.8rem' }}>{n.entity_id}</td>
                        <td style={{ fontSize: '0.8rem' }}>{n.reason || ''}</td>
                        <td>
                          {!n.reviewed_at ? (
                            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => handleMarkPayoutNoticeReviewed(n.id)}>
                              Mark reviewed
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {adminPayoutNotices.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No payout changes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminView === 'promos' && (
            <div className="admin-panel">`;
content = content.replace(oldSwitchView, newSwitchView);

fs.writeFileSync(file, content);
console.log('Patched frontend App.jsx.');
