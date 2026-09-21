const fs = require('fs');
let text = fs.readFileSync('frontend/src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Add priceChanged at the top of the editingProduct modal
const origModalTop = `                  {editingProduct && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Edit size={16} style={{ color: 'var(--accent)' }} />
                          {t('Edit SKU details', 'SKU विवरण संपादित करें', 'SKU বিবরণ সংশোধন করুন')}
                        </h3>

                        {(Math.abs(parseFloat(editProdPrice || 0) - editingProduct.price) > 0.001 || Math.abs(parseFloat(editProdCostPrice || 0) - editingProduct.cost_price) > 0.001) && (`;

const replModalTop = `                  {editingProduct && (() => {
                    const priceChanged = (Math.abs(parseFloat(editProdPrice || 0) - editingProduct.price) > 0.001 || Math.abs(parseFloat(editProdCostPrice || 0) - editingProduct.cost_price) > 0.001);
                    return (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,14,20,0.96)', zIndex: 110, display: 'flex', flexDirection: 'column', padding: '1rem', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Edit size={16} style={{ color: 'var(--accent)' }} />
                          {t('Edit SKU details', 'SKU विवरण संपादित करें', 'SKU বিবরণ সংশোধন করুন')}
                        </h3>

                        {priceChanged && (`;

// 2. Change the bill input label and helper
const origBillInput = `                        <div className="input-group">
                          <label className="input-label">
                            {t('Wholesale bill photo', 'थोक बिल फोटो', 'পাইকারি বিল ছবি')} {(Math.abs(parseFloat(editProdPrice || 0) - editingProduct.price) > 0.001 || Math.abs(parseFloat(editProdCostPrice || 0) - editingProduct.cost_price) > 0.001) && <span style={{ color: 'var(--danger)' }}>*</span>}
                          </label>
                          <input `;

const replBillInput = `                        <div className="input-group">
                          {!editProdBillFile && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>✓ A bill photo is already on file — you only need to upload a new one if you change the price.</span>
                            </div>
                          )}
                          <label className="input-label">
                            {t('Replace wholesale bill photo', 'थोक बिल फोटो बदलें', 'পাইকারি বিলের ছবি পরিবর্তন করুন')} {priceChanged && <span style={{ color: 'var(--danger)' }}>*</span>}
                          </label>
                          <input `;

// 3. Add optional helper text under the input
const origBillInputClose = `                          {editProdBillFile && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
                              Selected: {editProdBillFile.name} ({(editProdBillFile.size / 1024).toFixed(1)} KB)
                            </div>
                          )}
                        </div>`;

const replBillInputClose = `                          {editProdBillFile && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
                              Selected: {editProdBillFile.name} ({(editProdBillFile.size / 1024).toFixed(1)} KB)
                            </div>
                          )}
                          {!priceChanged && !editProdBillFile && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Optional — only required if you change the price.
                            </div>
                          )}
                        </div>`;

// 4. Close the IIFE at the end of the editingProduct block
const origModalClose = `                        </div>
                      </div>
                    </div>
                  )}`;

const replModalClose = `                        </div>
                      </div>
                    </div>
                    );
                  })()}`;

if (!text.includes(origModalTop)) console.error('COULD NOT FIND origModalTop');
if (!text.includes(origBillInput)) console.error('COULD NOT FIND origBillInput');
if (!text.includes(origBillInputClose)) console.error('COULD NOT FIND origBillInputClose');
if (!text.includes(origModalClose)) console.error('COULD NOT FIND origModalClose');

text = text.replace(origModalTop, replModalTop);
text = text.replace(origBillInput, replBillInput);
text = text.replace(origBillInputClose, replBillInputClose);
text = text.replace(origModalClose, replModalClose);

fs.writeFileSync('frontend/src/App.jsx', text);
console.log('App.jsx modified successfully.');
