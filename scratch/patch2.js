const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const s1 = `  const handleRestoreAccount = async (userId) => {
    try {
      const adminId = currentUser?.role === 'ADMIN' ? currentUser.id : 'u-admin1';
      const res = await fetch(\`\${API_BASE}/admin/blacklist/\${userId}/restore\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${localStorage.getItem('token') || ''}\`,
          'x-admin-user-id': adminId,
          'x-admin-id': adminId
        }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Account restored to pending review');
        fetchDbState();
      } else {
        showToast(data.message || data.error || \`Restore failed (\${res.status})\`, 'error');
      }
    } catch (e) { showToast('Server error restoring account', 'error'); }
  };`;

const r1 = `  const handleRestoreAccount = async (user) => {
    const isLead = user.source === 'LEAD';
    const userId = user.user_id || user.id;

    if (!userId) {
      showToast('No user ID found for this record', 'error');
      return;
    }

    triggerConfirmModal(
      t('Restore Account?', 'खाता पुनर्स्थापित करें?', 'অ্যাকাউন্ট পুনরুদ্ধার করবেন?'),
      isLead 
        ? t(\`Move \${user.name || 'this lead'} back to New leads? You can contact them again.\`, \`क्या \${user.name || 'इस लीड'} को वापस नए लीड में ले जाएं? आप उनसे फिर से संपर्क कर सकते हैं।\`, \`কী \${user.name || 'এই লিড'} কে আবার নতুন লিড এ নিয়ে যাবেন? আপনি তাদের সাথে আবার যোগাযোগ করতে পারেন।\`)
        : t(\`Restore account for \${user.name || 'this user'}? They will be able to log in and submit updated documents.\`, \`क्या \${user.name || 'इस उपयोगकर्ता'} का खाता पुनर्स्थापित करें? वे लॉग इन कर सकेंगे और अद्यतन दस्तावेज़ जमा कर सकेंगे।\`, \`\${user.name || 'এই ব্যবহারকারী'} অ্যাকাউন্ট পুনরুদ্ধার করবেন? তারা লগ ইন করতে এবং আপডেট করা নথি জমা দিতে সক্ষম হবে।\`),
      async () => {
        try {
          if (isLead) {
            const res = await fetch(\`\${API_BASE}/admin/partner-leads/\${userId}/status\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'NEW', reason: 'Reconsidered' })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              showToast('Lead restored to NEW');
              fetchDbState();
              setBlacklistedUsers(prev => prev.filter(u => (u.user_id || u.id) !== userId));
            } else {
              showToast(data.message || data.error || \`Restore failed (\${res.status})\`, 'error');
            }
          } else {
            const adminId = currentUser?.role === 'ADMIN' ? currentUser.id : 'u-admin1';
            const res = await fetch(\`\${API_BASE}/admin/blacklist/\${userId}/restore\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${localStorage.getItem('token') || ''}\`,
                'x-admin-user-id': adminId,
                'x-admin-id': adminId
              }
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              showToast('Account restored to pending review');
              fetchDbState();
              setBlacklistedUsers(prev => prev.filter(u => (u.user_id || u.id) !== userId));
            } else {
              showToast(data.message || data.error || \`Restore failed (\${res.status})\`, 'error');
            }
          }
        } catch (e) { showToast('Server error restoring account', 'error'); }
      },
      false,
      t('Yes, restore', 'हाँ, पुनर्स्थापित करें', 'হ্যাঁ, পুনরুদ্ধার করুন'),
      t('Cancel', 'रद्द करें', 'বাতিল করুন')
    );
  };`;


const s2 = `  const handleRemoveAccountRequest = async (user) => {
    try {
      const adminId = currentUser?.role === 'ADMIN' ? currentUser.id : 'u-admin1';
      const userId = user.user_id || user.id;`;

const r2 = `  const handleRemoveAccountRequest = async (user) => {
    const isLead = user.source === 'LEAD';
    const userId = user.user_id || user.id;

    if (!userId) {
      showToast('No user ID found for this record', 'error');
      return;
    }

    if (isLead) {
      triggerConfirmModal(
        t('Remove Account', 'खाता निकालें', 'অ্যাকাউন্ট সরান'),
        t(\`Permanently delete the lead \${user.name || 'this lead'}? This cannot be undone.\`, \`क्या \${user.name || 'इस लीड'} को स्थायी रूप से हटा दें? इसे पूर्ववत नहीं किया जा सकता।\`, \`স্থায়ীভাবে লিড \${user.name || 'এই লিড'} মুছে ফেলবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।\`),
        async () => {
          try {
            const res = await fetch(\`\${API_BASE}/admin/partner-leads/\${userId}\`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              showToast('Lead deleted');
              fetchDbState();
              setBlacklistedUsers(prev => prev.filter(u => (u.user_id || u.id) !== userId));
            } else {
              showToast(data.message || data.error || \`Delete failed (\${res.status})\`, 'error');
            }
          } catch (e) { showToast('Server error deleting lead', 'error'); }
        },
        true,
        t('Yes, delete', 'हाँ, हटाएं', 'হ্যাঁ, মুছে ফেলুন'),
        t('Cancel', 'रद्द करें', 'বাতিল করুন')
      );
      return;
    }

    try {
      const adminId = currentUser?.role === 'ADMIN' ? currentUser.id : 'u-admin1';`;

// normalize
let normalizedContent = content.replace(/\r\n/g, '\n');
let c1 = s1.replace(/\r\n/g, '\n');
let c2 = s2.replace(/\r\n/g, '\n');

if (normalizedContent.includes(c1)) {
  content = normalizedContent.replace(c1, r1);
  console.log('Replaced handleRestoreAccount');
} else {
  console.log('Could not find handleRestoreAccount block');
}

if (content.includes(c2)) {
  content = content.replace(c2, r2);
  console.log('Replaced handleRemoveAccountRequest');
} else {
  console.log('Could not find handleRemoveAccountRequest block');
}

fs.writeFileSync('frontend/src/App.jsx', content);
