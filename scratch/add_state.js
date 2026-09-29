const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const targetState = `  const [regionCode, setRegionCode] = useState('');\n  const [regionCodeUserEdited, setRegionCodeUserEdited] = useState(false);`;
const replaceState = `  const [regionCode, setRegionCode] = useState('');\n  const [regionDeliveryFee, setRegionDeliveryFee] = useState('');\n  const [regionCodeUserEdited, setRegionCodeUserEdited] = useState(false);`;

code = code.replace(targetState, replaceState);

const targetSave = `body: JSON.stringify({ name: regionName.trim(), code: regionCode.trim(), admin_id: currentUser?.id })`;
const replaceSave = `body: JSON.stringify({ name: regionName.trim(), code: regionCode.trim(), delivery_fee: regionDeliveryFee !== '' && regionDeliveryFee !== null ? Number(regionDeliveryFee) : null, admin_id: currentUser?.id })`;

code = code.replace(targetSave, replaceSave);

const targetModal = `<div className="input-group">
                <label className="input-label" style={{ fontWeight: 'bold' }}>Region Code (URL slug)</label>`;
const replaceModal = `<div className="input-group">
                <label className="input-label" style={{ fontWeight: 'bold' }}>Delivery Fee (₹)</label>
                <input
                  type="number"
                  className="text-input"
                  placeholder="e.g. 40, leave empty if disabled"
                  value={regionDeliveryFee}
                  onChange={(e) => setRegionDeliveryFee(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label" style={{ fontWeight: 'bold' }}>Region Code (URL slug)</label>`;

code = code.replace(targetModal, replaceModal);

// Also we need to populate regionDeliveryFee when editingRegion is set.
const targetEditSet = `setEditingRegion(region);\n                                          setRegionName(region.name);\n                                          setRegionCode(region.code);`;
const replaceEditSet = `setEditingRegion(region);\n                                          setRegionName(region.name);\n                                          setRegionCode(region.code);\n                                          setRegionDeliveryFee(region.delivery_fee !== null && region.delivery_fee !== undefined ? region.delivery_fee : '');`;

code = code.replace(targetEditSet, replaceEditSet);

// And clear it when adding new
const targetAddSet = `setEditingRegion(null);\n                            setRegionName('');\n                            setRegionCode('');\n                            setRegionCodeUserEdited(false);\n                            setRegionModalError('');\n                            setShowRegionModal(true);`;
const replaceAddSet = `setEditingRegion(null);\n                            setRegionName('');\n                            setRegionCode('');\n                            setRegionDeliveryFee('');\n                            setRegionCodeUserEdited(false);\n                            setRegionModalError('');\n                            setShowRegionModal(true);`;

code = code.replace(targetAddSet, replaceAddSet);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
console.log('Modified Region logic in App.jsx');
