const fs = require('fs');
const file = 'x:/app/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update handleSavePartnerProfile
const handleSavePartnerProfileStart = `  const handleSavePartnerProfile = async () => {`;
const handleSavePartnerProfileEnd = `  const handleChangePartnerPassword = async () => {`;

const startIdx = content.indexOf(handleSavePartnerProfileStart);
const endIdx = content.indexOf(handleSavePartnerProfileEnd);

const newHandleSavePartnerProfile = `  const handleSavePartnerProfile = async () => {
    const isPhoneChanged = pProfContactPhone !== initialContactPhone;
    if (isPhoneChanged && !confirmPhoneChangeCheck) {
      showToast(t('Please confirm phone number change by checking the checkbox', 'कृपया चेकबॉक्स को चेक करके फ़ोन नंबर बदलने की पुष्टि करें', 'অনুগ্রহ করে চেকবক্সে টিক দিয়ে ফোন নম্বর পরিবর্তনের বিষয়টি নিশ্চিত করুন'), 'warning');
      return;
    }

    const tDisplayName = pProfDisplayName ? pProfDisplayName.trim() : '';
    const tAddress = pProfAddress ? pProfAddress.trim() : '';
    const tUpi = pProfPayoutUpiId ? pProfPayoutUpiId.trim() : '';
    const tIfsc = pProfPayoutBankIfsc ? pProfPayoutBankIfsc.trim().toUpperCase() : '';
    const tAccount = pProfPayoutBankAccount ? pProfPayoutBankAccount.trim() : '';
    const tName = pProfPayoutAccountName ? pProfPayoutAccountName.trim() : '';

    if (tDisplayName.length > 100) {
      showToast(t("Display name cannot exceed 100 characters.", "प्रदर्शन नाम 100 वर्णों से अधिक नहीं हो सकता।", "প্রদর্শন নাম 100 অক্ষরের বেশি হতে পারে না।"), 'error');
      return;
    }
    if (tAddress.length > 300) {
      showToast(t("Address cannot exceed 300 characters.", "पता 300 वर्णों से अधिक नहीं हो सकता।", "ঠিকানা 300 অক্ষরের বেশি হতে পারে না।"), 'error');
      return;
    }
    if (tUpi && !/^[\\w.-]+@[\\w.-]+$/.test(tUpi)) {
      showToast(t("Enter a valid UPI ID like name@bank.", "name@bank की तरह एक मान्य UPI ID दर्ज करें।", "name@bank এর মত একটি বৈধ UPI ID লিখুন।"), 'error');
      return;
    }
    if (tIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(tIfsc)) {
      showToast(t("IFSC must be 11 characters, like SBIN0000300.", "IFSC 11 वर्णों का होना चाहिए, जैसे SBIN0000300।", "IFSC অবশ্যই 11 অক্ষরের হতে হবে, যেমন SBIN0000300।"), 'error');
      return;
    }
    if (tAccount && !/^\\d{9,18}$/.test(tAccount)) {
      showToast(t("Bank account number must be 9 to 18 digits.", "बैंक खाता संख्या 9 से 18 अंकों की होनी चाहिए।", "ব্যাঙ্ক অ্যাকাউন্ট নম্বর 9 থেকে 18 অঙ্কের হতে হবে।"), 'error');
      return;
    }
    if (tName && !/^[A-Za-z\\s.-]{2,80}$/.test(tName)) {
      showToast(t("Enter the account holder's name.", "खाताधारक का नाम दर्ज करें।", "অ্যাকাউন্ট হোল্ডারের নাম লিখুন।"), 'error');
      return;
    }

    const payload = {
      display_name: tDisplayName,
      contact_phone: pProfContactPhone,
      contact_email: pProfContactEmail,
      address: tAddress,
      payout_upi_id: tUpi,
      payout_bank_account: tAccount,
      payout_bank_ifsc: tIfsc,
      payout_account_name: tName,
      confirm_phone_change: isPhoneChanged ? confirmPhoneChangeCheck : false
    };
    try {
      const res = await fetch(\`\${API_BASE}/partner/me\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${partnerSessionToken}\`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(t('Partner profile updated successfully!', 'पार्टनर प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!', 'অংশীদার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!'), 'success');
        
        // Re-read values from response
        if (data.partner) {
          setPProfDisplayName(data.partner.display_name || '');
          setPProfContactPhone(data.partner.contact_phone || '');
          setPProfContactEmail(data.partner.contact_email || '');
          setPProfAddress(data.partner.address || '');
          setPProfPayoutUpiId(data.partner.payout_upi_id || '');
          setPProfPayoutBankAccount(data.partner.payout_bank_account || '');
          setPProfPayoutBankIfsc(data.partner.payout_bank_ifsc || '');
          setPProfPayoutAccountName(data.partner.payout_account_name || '');
          setInitialContactPhone(data.partner.contact_phone || '');
          setConfirmPhoneChangeCheck(false);
        }
      } else {
        showToast(data.error || data.message || t('Something went wrong', 'कुछ गलत हो गया', 'কিছু একটা ভুল হয়েছে'), 'error');
      }
    } catch (err) {
      showToast(t('Network error updating profile', 'प्रोफ़ाइल अपडेट करने में नेटवर्क त्रुटि', 'প্রোফাইল আপডেট করার সময় নেটওয়ার্ক ত্রুটি'), 'error');
    }
  };

`;

content = content.substring(0, startIdx) + newHandleSavePartnerProfile + content.substring(endIdx);
fs.writeFileSync(file, content);
console.log('patched handleSavePartnerProfile');
