const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace state
code = code.replace(/const \[regionCode, setRegionCode\] = useState\(''\);[\r\n]+  const \[regionCodeUserEdited, setRegionCodeUserEdited\] = useState\(false\);/, "const [regionCode, setRegionCode] = useState('');\n  const [regionDeliveryFee, setRegionDeliveryFee] = useState('');\n  const [regionCodeUserEdited, setRegionCodeUserEdited] = useState(false);");

// Replace modal
const targetModalRegex = /<div className="input-group">[\s\S]*?<label className="input-label" style={{ fontWeight: 'bold' }}>Region Code \(URL slug\)<\/label>/;
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
code = code.replace(targetModalRegex, replaceModal);

// Edit region setter
const editRegionRegex = /setEditingRegion\(r\);[\s\S]*?setRegionName\(r\.name\);[\s\S]*?setRegionCode\(r\.code\);/;
const replaceEditSet = `setEditingRegion(r);
                                      setRegionName(r.name);
                                      setRegionCode(r.code);
                                      setRegionDeliveryFee(r.delivery_fee !== null && r.delivery_fee !== undefined ? r.delivery_fee : '');`;
code = code.replace(editRegionRegex, replaceEditSet);

// Add region setter (if "Add Region" exists)
const addRegionRegex = /setEditingRegion\(null\);[\s\S]*?setRegionName\(''\);[\s\S]*?setRegionCode\(''\);[\s\S]*?setRegionCodeUserEdited\(false\);[\s\S]*?setRegionModalError\(''\);[\s\S]*?setShowRegionModal\(true\);/;
const replaceAddSet = `setEditingRegion(null);
                            setRegionName('');
                            setRegionCode('');
                            setRegionDeliveryFee('');
                            setRegionCodeUserEdited(false);
                            setRegionModalError('');
                            setShowRegionModal(true);`;
code = code.replace(addRegionRegex, replaceAddSet);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
console.log('Modified Region logic in App.jsx again');
