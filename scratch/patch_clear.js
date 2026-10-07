const fs = require('fs');
const file = 'x:/app/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    search: `  const clearSession = () => {`,
    replace: `  const resetAuthForm = () => {
    setShowCustomerSignup(false);
    setShowStockistSignup(false);
    setOtpSent(false);
    setLoginPhone('');
    setLoginErrorMessage('');
    setLoginOtp('');
    setRegName('');
    setRegEmail('');
    setRegAddress('');
    setRegRegion(regions.length > 0 ? regions[0].id : '');
    setRegShopName('');
    setRegKycType2('Aadhaar');
    setRegKycNumber2('');
    setAadhaarDigits('');
    setAadhaarDisplay('');
    setAadhaarError('');
    setRegDocPhoto(null);
    setCustomerTermsAgreed(false);
    setSignupCablePartnerId('');
    setNoCableProvider(false);
    setHasBroadbandAnswered(false);
    setHasBroadband(false);
    setSignupBroadbandPartnerId('');
    setNoBroadbandProvider(false);
    setSignupReferralCode('');
  };

  const clearSession = () => {
    resetAuthForm();`
  },
  {
    search: `  const switchViewToRole = async (targetRole) => {
    setActiveRole(targetRole);`,
    replace: `  const switchViewToRole = async (targetRole) => {
    if (activeRole !== targetRole) {
      resetAuthForm();
    }
    setActiveRole(targetRole);`
  },
  {
    search: `        setRegName(''); setRegEmail(''); setRegAddress(''); setOtpSent(false); setSignupReferralCode('');
        setCustomerTermsAgreed(false);
        setSignupCablePartnerId(''); setNoCableProvider(false);
        setHasBroadbandAnswered(false); setHasBroadband(false);
        setSignupBroadbandPartnerId(''); setNoBroadbandProvider(false);`,
    replace: `        resetAuthForm();`
  },
  {
    search: `        setShowStockistSignup(false);
        setRegName(''); setRegShopName(''); setRegKycNumber2(''); setAadhaarDigits(''); setAadhaarDisplay(''); setAadhaarError(''); setRegAddress(''); setRegDocPhoto(null); setOtpSent(false);`,
    replace: `        resetAuthForm();`
  },
  {
    search: `        ) : showCustomerSignup ? (`,
    replace: `        ) : (isCustomerApp && showCustomerSignup) ? (`
  },
  {
    search: `        ) : showStockistSignup ? (`,
    replace: `        ) : (isStockistApp && showStockistSignup) ? (`
  },
  {
    search: `onClick={() => { setShowCustomerSignup(false); setOtpSent(false); }}`,
    replace: `onClick={resetAuthForm}`
  },
  {
    search: `onClick={() => { setShowStockistSignup(false); setOtpSent(false); }}`,
    replace: `onClick={resetAuthForm}`
  }
];

let ok = true;
for (const r of replacements) {
  const normalizedSearch = r.search.replace(/\r\n/g, '\n');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  if (normalizedContent.includes(normalizedSearch)) {
    content = normalizedContent.replace(normalizedSearch, r.replace);
  } else {
    console.log("NOT FOUND:", r.search);
    ok = false;
  }
}

if (ok) {
  fs.writeFileSync(file, content);
  console.log("Replaced successfully.");
}
