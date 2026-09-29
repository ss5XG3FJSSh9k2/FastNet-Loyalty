const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const regex = /<button\s*className="btn"\s*style={{ width: '100%', padding: '0.3rem', fontSize: '0.65rem', marginTop: '0.5rem', background: 'rgba\(236,72,153,0.1\)', color: 'var\(--secondary\)', border: '1px solid var\(--secondary\)' }}\s*onClick=\{\(\) => triggerConfirmModal\([\s\S]*?handleSwitchToDelivery[\s\S]*?<\/button>/g;

const replacement = `{(() => {
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

if(regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Target not found');
}
