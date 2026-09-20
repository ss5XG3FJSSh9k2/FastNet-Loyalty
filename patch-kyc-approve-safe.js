const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Add state variables for KYC Approve Modal near showKycActionModal
const stateToAdd = `
  const [showKycApproveModal, setShowKycApproveModal] = useState(false);
  const [kycApproveUser, setKycApproveUser] = useState(null);
  const [kycApproveVendors, setKycApproveVendors] = useState(null);
  const [kycApproveSelectedVendor, setKycApproveSelectedVendor] = useState('');
  const [kycApproveHighFlags, setKycApproveHighFlags] = useState([]);
`;
content = content.replace(
  'const [showKycActionModal, setShowKycActionModal] = useState(false);',
  'const [showKycActionModal, setShowKycActionModal] = useState(false);\n' + stateToAdd
);

// 2. Add openKycApproveModal near handleApproveKyc
const openModalFunc = `
  const openKycApproveModal = async (user, highFlags = []) => {
    setKycApproveUser(user);
    setKycApproveHighFlags(highFlags);
    setKycApproveVendors(null);
    setShowKycApproveModal(true);
    
    try {
      const res = await fetch(\`\${API_BASE}/admin/vendors/load?region_id=\${user.region_id}\`, { headers: { 'X-Admin-Action': 'true' } });
      if (res.ok) {
        let data = await res.json().catch(() => ({}));
        data.sort((a, b) => a.stockist_count - b.stockist_count);
        setKycApproveVendors(data);
        if (data.length > 0) {
          setKycApproveSelectedVendor(data[0].id);
        } else {
          setKycApproveSelectedVendor('');
        }
      } else {
        setKycApproveVendors([]);
      }
    } catch (e) {
      showToast('Failed to load vendors', 'error');
      setKycApproveVendors([]);
    }
  };
`;

content = content.replace(
  'const handleApproveKyc = async (userId) => {',
  openModalFunc + '\n  const handleApproveKyc = async (userId, vendorId) => {'
);

// 3. Update handleApproveKyc logic
const oldApproveStart = `    const userToApprove = pendingKyc.find(u => u.id === userId);
    if (!userToApprove) return;

    const matchingVendor = vendors.find(v => v.region_id === userToApprove.region_id);
    if (!matchingVendor) {
      showToast('Please create a Vendor for this region first!', 'error');
      return;
    }

    try {
      const payload = {
        userId,
        vendorId: matchingVendor.id,`;

const newApproveStart = `    const userToApprove = pendingKyc.find(u => u.id === userId);
    if (!userToApprove) return;

    try {
      const payload = {
        userId,
        vendorId,`;

content = content.replace(oldApproveStart, newApproveStart);

const oldSuccessToast = "showToast(`Approved stockist! Assigned vendor: ${matchingVendor.name}`);";
const newSuccessToast = "showToast('Approved stockist successfully!');";
content = content.replace(oldSuccessToast, newSuccessToast);

// 4. Update the buttons that trigger approval
const oldButton1 = `triggerConfirmModal(
                                      t('Approve Stockist KYC', 'स्टॉकिस्ट KYC स्वीकृत करें', 'স্টকিস্ট KYC অনুমোদন করুন'),
                                      \`This application has \${activeFlags.filter(f => f.severity === 'HIGH').length} high-severity flags:\\n\${flagListText}\\n\\nApprove anyway?\`,
                                      () => handleApproveKyc(u.id)
                                    );`;
const oldButton2 = `triggerConfirmModal(
                                      t('Approve Stockist KYC', 'स्टॉकिस्ट KYC स्वीकृत करें', 'স্টকিস্ট KYC অনুমোদন করুন'),
                                      \`Approve \${u.name} as stockist? A vendor will be auto-assigned based on their region.\`,
                                      () => handleApproveKyc(u.id)
                                    );`;

const newButton = `const highFlags = hasHigh ? activeFlags.filter(f => f.severity === 'HIGH') : [];
                                    openKycApproveModal(u, highFlags);`;

content = content.replace(oldButton1, newButton);
content = content.replace(oldButton2, newButton);

// 5. Add the modal JSX just above the KYC Action Modal
const approveModalJsx = `
      {/* KYC Approve Modal */}
      {showKycApproveModal && kycApproveUser && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Approve {kycApproveUser.name} as Stockist</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowKycApproveModal(false)}>
                <X size={14} />
              </button>
            </div>

            {kycApproveHighFlags.length > 0 && (
              <div style={{ padding: '0.75rem', marginBottom: '1rem', background: 'rgba(255, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)', borderRadius: '4px' }}>
                <strong style={{ color: 'var(--danger-color)', display: 'block', marginBottom: '0.5rem' }}>
                  Warning: {kycApproveHighFlags.length} High-Severity Flag(s)
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                  {kycApproveHighFlags.map(f => (
                    <li key={f.id}>{f.flag_type} — {f.detail}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="input-group">
                <label className="input-label">Assign Vendor (Region: {regions.find(r => r.id === kycApproveUser.region_id)?.name || kycApproveUser.region_id})</label>
                
                {kycApproveVendors === null ? (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading vendors...</div>
                ) : kycApproveVendors.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'rgba(255, 170, 0, 0.1)', border: '1px solid var(--warning-color)', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--warning-color)' }}>No active vendors found in this region.</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      setShowKycApproveModal(false);
                      handleSetAdminTab('vendors');
                    }}>
                      Go to Wholesalers
                    </button>
                  </div>
                ) : (
                  <select 
                    className="text-input" 
                    value={kycApproveSelectedVendor} 
                    onChange={e => setKycApproveSelectedVendor(e.target.value)}
                  >
                    {kycApproveVendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.stockist_count} stockist{v.stockist_count !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowKycApproveModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  disabled={!kycApproveVendors || kycApproveVendors.length === 0 || !kycApproveSelectedVendor}
                  onClick={() => {
                    handleApproveKyc(kycApproveUser.id, kycApproveSelectedVendor);
                    setShowKycApproveModal(false);
                  }}
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('{/* KYC Action Modal (Reject / Blacklist) */}', approveModalJsx + '\n      {/* KYC Action Modal (Reject / Blacklist) */}');

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log('App.jsx patched cleanly!');
