const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const s1 = `const [regionCode, setRegionCode] = useState('');\n  const [regionCodeUserEdited, setRegionCodeUserEdited] = useState(false);`;
code = code.replace(s1, `const [regionCode, setRegionCode] = useState('');\n  const [regionDeliveryFee, setRegionDeliveryFee] = useState('');\n  const [regionCodeUserEdited, setRegionCodeUserEdited] = useState(false);`);
code = code.replace(`const [regionCode, setRegionCode] = useState('');\r\n  const [regionCodeUserEdited, setRegionCodeUserEdited] = useState(false);`, `const [regionCode, setRegionCode] = useState('');\r\n  const [regionDeliveryFee, setRegionDeliveryFee] = useState('');\r\n  const [regionCodeUserEdited, setRegionCodeUserEdited] = useState(false);`);

const s2 = `const cartDeliveryFee = cartFulfillment === 'DELIVERY' ? (selectedStockist?.region_id === 'r2' ? 30.00 : 40.00) : 0.00;`;
const r2 = `  let calculatedDeliveryFee = 0.00;
  if (cartFulfillment === 'DELIVERY') {
    const stockistId = currentCart.length > 0 ? currentCart[0].stockistId : null;
    const stockist = stockistId ? customerStockists.find(s => s.id === stockistId) : null;
    const region = stockist ? regions.find(r => r.id === stockist.region_id) : null;
    calculatedDeliveryFee = region && region.delivery_fee !== undefined && region.delivery_fee !== null ? parseFloat(region.delivery_fee) : 0.00;
  }
  const cartDeliveryFee = calculatedDeliveryFee;`;
code = code.replace(s2, r2);

const r3 = `{(() => {
                                    const region = regions.find(r => r.id === o.region_id);
                                    const deliveryFeeVal = region && region.delivery_fee !== undefined && region.delivery_fee !== null ? parseFloat(region.delivery_fee) : null;
                                    if (deliveryFeeVal === null) return null;
                                    return (
                                      <button 
                                        className="btn" 
                                        style={{ width: '100%', padding: '0.3rem', fontSize: '0.65rem', marginTop: '0.5rem', background: 'rgba(236,72,153,0.1)', color: 'var(--secondary)', border: '1px solid var(--secondary)' }}
                                        onClick={() => triggerConfirmModal(
                                          t('Switch to Delivery', 'डिलिवरी पर स्विच करें', 'ডেলিভারিতে পরিবর্তন করুন'),
                                          t('Are you sure you want to switch to delivery? A delivery fee of ₹', 'क्या आप डिलीवरी पर स्विच करना चाहते हैं? आपके ऑर्डर में ₹', 'আপনি কি নিশ্চিত যে আপনি ডেলিভারিতে পরিবর্তন করতে চান? আপনার অর্ডারে ₹') + deliveryFeeVal + t(' will be added to your order.', ' का डिलीवरी शुल्क जोड़ा जाएगा।', ' ডেলিভারি ফি যোগ করা হবে।'),
                                          () => handleSwitchToDelivery(o.id),
                                          false,
                                          t('Yes, Switch', 'हाँ, स्विच करें', 'হ্যাঁ, পরিবর্তন করুন'),
                                          t('No', 'नहीं', 'না')
                                        )}
                                      >
                                        {t('Switch to Delivery', 'डिलिवरी पर स्विच करें', 'ডেলিভারি মোডে যান')} (+₹{deliveryFeeVal})
                                      </button>
                                    );
                                  })()}`;

// Replace the button manually by finding lines
const lines = code.split(/\r?\n/);
let inButton = false;
let newLines = [];
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('t(\'Switch to Delivery\',') && lines[i+1] && lines[i+1].includes('A delivery fee of')) {
    // We are inside the onClick of that button. Let's backtrack to <button
    let j = newLines.length - 1;
    while (!newLines[j].includes('<button')) j--;
    // Replace the button
    newLines.splice(j, newLines.length - j);
    newLines.push(r3);
    // Skip original button lines
    let k = i;
    while (!lines[k].includes('</button>')) k++;
    i = k;
  } else {
    newLines.push(lines[i]);
  }
}
code = newLines.join('\n');

// Update RegionModal payload
const s4 = `body: JSON.stringify({ name: regionName.trim(), code: regionCode.trim(), admin_id: currentUser?.id })`;
const r4 = `body: JSON.stringify({ name: regionName.trim(), code: regionCode.trim(), delivery_fee: regionDeliveryFee !== '' && regionDeliveryFee !== null ? Number(regionDeliveryFee) : null, admin_id: currentUser?.id })`;
code = code.replace(s4, r4);

// Update RegionModal set editing region
code = code.replace(/setEditingRegion\(r\);[\s\S]*?setRegionName\(r\.name\);[\s\S]*?setRegionCode\(r\.code\);/, `setEditingRegion(r);
                                      setRegionName(r.name);
                                      setRegionCode(r.code);
                                      setRegionDeliveryFee(r.delivery_fee !== null && r.delivery_fee !== undefined ? r.delivery_fee : '');`);

// Update add region
code = code.replace(/setEditingRegion\(null\);[\s\S]*?setRegionName\(''\);[\s\S]*?setRegionCode\(''\);[\s\S]*?setRegionCodeUserEdited\(false\);/, `setEditingRegion(null);
                            setRegionName('');
                            setRegionCode('');
                            setRegionDeliveryFee('');
                            setRegionCodeUserEdited(false);`);

// Update region input in modal. The input for Region Code is around line 15708
const newCodeLines = code.split(/\r?\n/);
for (let i = 0; i < newCodeLines.length; i++) {
  if (newCodeLines[i].includes('Region Code (URL slug)')) {
    // Just inject the new input group right before it
    const modalAdd = `<div className="input-group">
                <label className="input-label" style={{ fontWeight: 'bold' }}>Delivery Fee (₹)</label>
                <input
                  type="number"
                  className="text-input"
                  placeholder="e.g. 40, leave empty if disabled"
                  value={regionDeliveryFee}
                  onChange={(e) => setRegionDeliveryFee(e.target.value)}
                />
              </div>`;
    newCodeLines.splice(i-1, 0, modalAdd);
    break; // Only do it once! Wait, there's only one.
  }
}
code = newCodeLines.join('\n');

// Also update AdminRegions list table header and row
for (let i = 0; i < newCodeLines.length; i++) {
  if (newCodeLines[i].includes('<th>Code</th>') || newCodeLines[i].includes('>Code</th>')) {
    const thAdd = `<th style={{ padding: '0.75rem 0.5rem' }}>Del. Fee</th>`;
    newCodeLines.splice(i+1, 0, thAdd);
    break;
  }
}

for (let i = 0; i < newCodeLines.length; i++) {
  if (newCodeLines[i].includes('<code>{r.code}</code>')) {
    const tdAdd = `<td style={{ padding: '0.75rem 0.5rem' }}>{r.delivery_fee !== null ? '₹' + r.delivery_fee : 'N/A'}</td>`;
    newCodeLines.splice(i+1, 0, tdAdd);
    break;
  }
}

fs.writeFileSync('frontend/src/App.jsx', newCodeLines.join('\n'), 'utf8');
console.log('Successfully completed all replacements for Delivery Fee in frontend');
