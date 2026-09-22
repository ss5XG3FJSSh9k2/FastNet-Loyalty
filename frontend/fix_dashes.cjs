const fs = require('fs');

let app = fs.readFileSync('src/App.jsx', 'utf8');

// 5195: <div>  5432109876 (Gopal Joy — Stockist Bishnupur, Pending KYC)</div>
app = app.replace('Gopal Joy — Stockist Bishnupur', 'Gopal Joy: Stockist Bishnupur');

// 5235: {t('New Customer Registration', 'नए ग्राहक पंजीकरण', 'নতুন গ্রাহক নিবন্ধন')} — {loginPhone}
app = app.replace(
  `{t('New Customer Registration', 'नए ग्राहक पंजीकरण', 'নতুন গ্রাহক নিবন্ধন')} — {loginPhone}`,
  `{t('New Customer Registration', 'नए ग्राहक पंजीकरण', 'নতুন গ্রাহক নিবন্ধন')}: {loginPhone}`
);

// 5362: {t('Delivery Address (optional — you can add this at checkout)', 'डिलीवरी का पता (वैकल्पिक — आप इसे चेकआउट के समय जोड़ सकते हैं)', 'ডেলিভারি ঠিকানা (ঐচ্ছিক — আপনি চেকআউট করার সময় এটি যোগ করতে পারেন)')}
app = app.replace(
  `'Delivery Address (optional — you can add this at checkout)'`,
  `'Delivery Address (optional, you can add this at checkout)'`
).replace(
  `'डिलीवरी का पता (वैकल्पिक — आप इसे चेकआउट के समय जोड़ सकते हैं)'`,
  `'डिलीवरी का पता (वैकल्पिक, आप इसे चेकआउट के समय जोड़ सकते हैं)'`
).replace(
  `'ডেলিভারি ঠিকানা (ঐচ্ছিক — আপনি চেকআউট করার সময় এটি যোগ করতে পারেন)'`,
  `'ডেলিভারি ঠিকানা (ঐচ্ছিক, আপনি চেকআউট করার সময় এটি যোগ করতে পারেন)'`
);

// 5379: {t('Register Local Shop (KYC Required)', 'पंजीकृत स्थानीय दुकान (KYC आवश्यक)', 'নিবন্ধিত স্থানীয় দোকান (KYC আবশ্যক)')} — {loginPhone}
app = app.replace(
  `{t('Register Local Shop (KYC Required)', 'पंजीकृत स्थानीय दुकान (KYC आवश्यक)', 'নিবন্ধিত স্থানীয় দোকান (KYC আবশ্যক)')} — {loginPhone}`,
  `{t('Register Local Shop (KYC Required)', 'पंजीकृत स्थानीय दुकान (KYC आवश्यक)', 'নিবন্ধিত স্থানীয় দোকান (KYC আবশ্যক)')}: {loginPhone}`
);

// 5458-5460:
app = app.replace(
  `'Please enter these details carefully. You cannot change them yourself later — to correct any detail, you\\'ll need to contact FastNet support.'`,
  `'Please enter these details carefully. You cannot change them yourself later. To correct any detail, you\\'ll need to contact FastNet support.'`
).replace(
  `'कृपया ये विवरण सावधानी से भरें। आप इन्हें बाद में स्वयं नहीं बदल सकते — किसी भी विवरण को ठीक करने के लिए आपको FastNet सहायता से संपर्क करना होगा।'`,
  `'कृपया ये विवरण सावधानी से भरें। आप इन्हें बाद में स्वयं नहीं बदल सकते। किसी भी विवरण को ठीक करने के लिए आपको FastNet सहायता से संपर्क करना होगा।'`
).replace(
  `'অনুগ্রহ করে এই বিবরণগুলি সাবধানে লিখুন। আপনি পরে নিজে এগুলি পরিবর্তন করতে পারবেন না — কোনো বিবরণ সংশোধন করতে FastNet সহায়তার সাথে যোগাযোগ করতে হবে।'`,
  `'অনুগ্রহ করে এই বিবরণগুলি সাবধানে লিখুন। আপনি পরে নিজে এগুলি পরিবর্তন করতে পারবেন না। কোনো বিবরণ সংশোধন করতে FastNet সহায়তার সাথে যোগাযোগ করতে হবে।'`
);

// 5481: OTP sent to <strong>{loginPhone}</strong> — demo code: <strong>123456</strong>
app = app.replace(
  `OTP sent to <strong>{loginPhone}</strong> — demo code:`,
  `OTP sent to <strong>{loginPhone}</strong>. Demo code:`
);

// 5540: showToast("Thanks — we'll contact you soon.", "success");
app = app.replace(
  `showToast("Thanks — we'll contact you soon.", "success");`,
  `showToast("Thanks. We'll contact you soon.", "success");`
);

// 6375: <Key size={20} /> FirstTimeSetupFlow — Partner Account Setup
app = app.replace(
  `<Key size={20} /> FirstTimeSetupFlow — Partner Account Setup`,
  `<Key size={20} /> FirstTimeSetupFlow: Partner Account Setup`
);

// 6437-6438:
app = app.replace(`Adhya Cable — Phone + OTP`, `Adhya Cable: Phone + OTP`)
       .replace(`Jio Broadband — Phone + OTP`, `Jio Broadband: Phone + OTP`);

// 7181: {r.customer_name} — {r.package_name}
app = app.replace(`{r.customer_name} — {r.package_name}`, `{r.customer_name}: {r.package_name}`);

// 7631-7633:
app = app.replace(
  `Store'} — this order's margin was`,
  `Store'}. This order's margin was`
).replace(
  `कमाए हैं — इस ऑर्डर का`,
  `कमाए हैं। इस ऑर्डर का`
).replace(
  `পেয়েছেন — এই অর্ডারে লাভ`,
  `পেয়েছেন। এই অর্ডারে লাভ`
);

// 7936-7938:
app = app.replace(
  `We're onboarding local stores — please check back soon.`,
  `We're onboarding local stores. Please check back soon.`
).replace(
  `हम स्थानीय दुकानों को जोड़ रहे हैं — कृपया जल्द ही वापस जांचें।`,
  `हम स्थानीय दुकानों को जोड़ रहे हैं। कृपया जल्द ही वापस जांचें।`
).replace(
  `আমরা স্থানীয় দোকান অন্তর্ভুক্ত করছি — অনুগ্রহ করে শীঘ্রই আবার দেখুন।`,
  `আমরা স্থানীয় দোকান অন্তর্ভুক্ত করছি। অনুগ্রহ করে শীঘ্রই আবার দেখুন।`
);

// 8261: showToast(`Need ${formatPoints(pkg.point_cost)} — you have ${formatPoints(customerBalance)}`, 'error');
app = app.replace(
  `Need \${formatPoints(pkg.point_cost)} — you have \${formatPoints(customerBalance)}`,
  `Need \${formatPoints(pkg.point_cost)}. You have \${formatPoints(customerBalance)}`
);

// 8521: statusLabel = t('Rejected — points refunded', 'अस्वीकृत — अंक वापस किए गए', 'বাতিল — পয়েন্ট ফেরত দেওয়া হয়েছে');
app = app.replace(
  `'Rejected — points refunded', 'अस्वीकृत — अंक वापस किए गए', 'বাতিল — পয়েন্ট ফেরত দেওয়া হয়েছে'`,
  `'Rejected. Points refunded', 'अस्वीकृत. अंक वापस किए गए', 'বাতিল. পয়েন্ট ফেরত দেওয়া হয়েছে'`
);

// 8975-8977:
app = app.replace(
  `serve the new region — you may need`,
  `serve the new region. You may need`
).replace(
  `न दे सके — आपको पुनः चयन`,
  `न दे सके। आपको पुनः चयन`
).replace(
  `না-ও দিতে পারে — আপনাকে পুনরায় নির্বাচন`,
  `না-ও দিতে পারে। আপনাকে পুনরায় নির্বাচন`
);

// 9284: {rejectedBillCount} product(s) not selling — bill rejected.
app = app.replace(`not selling — bill rejected`, `not selling. Bill rejected`);

// 9586: {t("Not selling — bill rejected", "बिक्री बंद — बिल अस्वीकृत", "বিক্রি বন্ধ — বিল প্রত্যাখ্যাত")}
app = app.replace(`"Not selling — bill rejected"`, `"Not selling. Bill rejected"`)
       .replace(`"बिक्री बंद — बिल अस्वीकृत"`, `"बिक्री बंद. बिल अस्वीकृत"`)
       .replace(`"বিক্রি বন্ধ — বিল প্রত্যাখ্যাত"`, `"বিক্রি বন্ধ. বিল প্রত্যাখ্যাত"`);

// 9662, 10116: showToast(t("Couldn't update shop status — try again", "दुकान की स्थिति अपडेट नहीं हो सकी — पुनः प्रयास करें", "দোকানের অবস্থা আপডেট করা যায়নি — আবার চেষ্টা করুন"), 'error');
app = app.replace(/Couldn't update shop status — try again/g, `Couldn't update shop status. Try again`)
       .replace(/दुकान की स्थिति अपडेट नहीं हो सकी — पुनः प्रयास करें/g, `दुकान की स्थिति अपडेट नहीं हो सकी. पुनः प्रयास करें`)
       .replace(/দোকানের অবস্থা আপডেট করা যায়নি — আবার চেষ্টা করুন/g, `দোকানের অবস্থা আপডেট করা যায়নি. আবার চেষ্টা করুন`);

// 9929: showToast('Could not process that image — try another.', 'error');
app = app.replace(`Could not process that image — try another.`, `Could not process that image. Try another.`);

// 10024: <span>✓ A bill photo is already on file — you only need to upload a new one if you change the price.</span>
app = app.replace(`A bill photo is already on file — you only need`, `A bill photo is already on file. You only need`);

// 10050: Optional — only required if you change the price.
app = app.replace(`Optional — only required`, `Optional. Only required`);

// 10716: <Sparkles size={16} /> {t('Getting Started — Initial Platform Setup', 'आरंभ करना — प्रारंभिक प्लेटफ़ॉर्म सेटअप', 'শুরু করুন — প্রাথমিক প্ল্যাটফর্ম সেটআপ')}
app = app.replace(
  `'Getting Started — Initial Platform Setup', 'आरंभ करना — प्रारंभिक प्लेटफ़ॉर्म सेटअप', 'শুরু করুন — প্রাথমিক প্ল্যাটফর্ম সেটআপ'`,
  `'Getting Started: Initial Platform Setup', 'आरंभ करना: प्रारंभिक प्लेटफ़ॉर्म सेटअप', 'শুরু করুন: প্রাথমিক প্ল্যাটফর্ম সেটআপ'`
);

// 11761: \`• \${f.flag_type} — \${f.detail}\`
app = app.replace(/\$\{f\.flag_type\} — \$\{f\.detail\}/g, `\${f.flag_type}: \${f.detail}`);

// 13160: <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>COD — commission via ledger</span>
app = app.replace(`COD — commission via ledger`, `COD: commission via ledger`);

// 15075, 15151: <li key={f.id}>{f.flag_type} — {f.detail}</li>
app = app.replace(/\{f\.flag_type\} — \{f\.detail\}/g, `{f.flag_type}: {f.detail}`);

// 15263: KYC Document — {selectedKycDocument.userName}
app = app.replace(`KYC Document — {selectedKycDocument.userName}`, `KYC Document: {selectedKycDocument.userName}`);

fs.writeFileSync('src/App.jsx', app);
