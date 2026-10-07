const fs = require('fs');
const file = 'x:/app/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    search: `  const handleRestoreAccount = async (userId) => {
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
  };`,
    replace: `  const handleRestoreAccount = async (user) => {
    const isLead = user.source === 'LEAD';
    const userId = user.user_id || user.id;

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
  };`
  },
  {
    search: `  const handleRemoveAccountRequest = async (user) => {
    try {
      const adminId = currentUser?.role === 'ADMIN' ? currentUser.id : 'u-admin1';
      const userId = user.user_id || user.id;`,
    replace: `  const handleRemoveAccountRequest = async (user) => {
    const isLead = user.source === 'LEAD';
    const userId = user.user_id || user.id;

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
      const adminId = currentUser?.role === 'ADMIN' ? currentUser.id : 'u-admin1';`
  },
  {
    search: `                                    <button className="btn btn-accent" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => {
                                      triggerConfirmModal(
                                        t('Restore Account?', 'खाता पुनर्स्थापित करें?', 'অ্যাকাউন্ট পুনরুদ্ধার করবেন?'),
                                        t(\`Restore account for \${u.name || 'this user'}? They will be able to log in and submit updated documents.\`, \`क्या \${u.name || 'इस उपयोगकर्ता'} का खाता पुनर्स्थापित करें? वे लॉग इन कर सकेंगे और अद्यतन दस्तावेज़ जमा कर सकेंगे।\`, \`\${u.name || 'এই ব্যবহারকারী'} অ্যাকাউন্ট পুনরুদ্ধার করবেন? তারা লগ ইন করতে এবং আপডেট করা নথি জমা দিতে সক্ষম হবে।\`),
                                        () => handleRestoreAccount(u.user_id || u.id),
                                        false,
                                        t('Yes, restore', 'हाँ, पुनर्स्थापित करें', 'হ্যাঁ, পুনরুদ্ধার করুন'),
                                        t('Cancel', 'रद्द करें', 'বাতিল করুন')
                                      );
                                    }}>`,
    replace: `                                    <button className="btn btn-accent" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleRestoreAccount(u)}>`
  },
  {
    search: `                                <tr key={u.user_id || u.id}>`,
    replace: `                                <tr key={\`\${u.source}-\${u.user_id || u.id}\`}>`
  }
];

let ok = true;
for (const r of replacements) {
  const normalizedSearch = r.search.replace(/\r\n/g, '\n');
  const normalizedContent = content.replace(/\r\n/g, '\n');
  if (normalizedContent.includes(normalizedSearch)) {
    content = normalizedContent.replace(normalizedSearch, r.replace);
  } else {
    console.log("NOT FOUND:", r.search.slice(0, 50));
    ok = false;
  }
}

if (ok) {
  fs.writeFileSync(file, content);
  console.log("Frontend replaced successfully.");
}
