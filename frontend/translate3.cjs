const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const reps = [
  // Operational Settings
  [`<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>Operational Settings</h4>`, `<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>{t('Operational Settings', 'परिचालन सेटिंग', 'পরিচালন সেটিংস')}</h4>`],
  [`Maximum allowed: {stockistProfile.max_delivery_radius_km || 5.0} km</p>`, `{t('Maximum allowed', 'अधिकतम अनुमत', 'সর্বাধিক অনুমোদিত')}: {stockistProfile.max_delivery_radius_km || 5.0} {t('km', 'किमी', 'কিমি')}</p>`],

  // Payout Details
  [`<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>Payout Details</h4>`, `<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>{t('Payout Details', 'भुगतान विवरण', 'পেআউট বিবরণ')}</h4>`],

  // Account Information
  [`<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>Account Information</h4>`, `<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>{t('Account Information', 'खाता जानकारी', 'অ্যাকাউন্ট তথ্য')}</h4>`],
  [`Current Commission Rate: </span>`, `{t('Current Commission Rate','वर्तमान कमीशन दर','বর্তমান কমিশন হার')}: </span>`],
  [`Minimum Order: </span>`, `{t('Minimum Order','न्यूनतम ऑर्डर','সর্বনিম্ন অর্ডার')}: </span>`],

  // App Preferences
  [`<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>App Preferences</h4>`, `<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>{t('App Preferences', 'ऐप प्राथमिकताएं', 'অ্যাপ পছন্দসমূহ')}</h4>`],
  [`>Enable\n`, `>{t('Enable','सक्षम करें','সক্ষম করুন')}\n`],
  [`>\n                            Enable\n`, `>\n                            {t('Enable','सक्षम करें','সক্ষম করুন')}\n`],
  [`>Change\n`, `>{t('Change','बदलें','পরিবর্তন')}\n`],
  [`>\n                            Change\n`, `>\n                            {t('Change','बदलें','পরিবর্তন')}\n`]
];

let changedCount = 0;
for (let i = 0; i < reps.length; i++) {
  const [target, replacement] = reps[i];
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    changedCount++;
  } else {
    console.log("Could not find index " + i + ": " + target.substring(0, 50).trim());
  }
}

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Replaced ' + changedCount + ' strings');
