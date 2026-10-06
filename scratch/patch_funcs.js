const fs = require('fs');
const lines = fs.readFileSync('frontend/src/App.jsx', 'utf8').split('\n');

const replaceRange = (start, end, newContent) => {
  lines.splice(start, end - start + 1, ...newContent.split('\n'));
};

const findFn = name => {
  const start = lines.findIndex(l => l.includes(`const ${name} = `));
  if (start === -1) return -1;
  const end = lines.findIndex((l, i) => i > start && l.startsWith('  };'));
  return { start, end };
};

let b = findFn('handleDeleteStockist');
replaceRange(b.start, b.end, 
`  const handleDeleteStockist = (stk) => {
    const doDelete = async () => {
      try {
        const res = await fetch(\`\${API_BASE}/admin/stockists/\${stk.id}\`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Stockist deleted', 'success');
          fetchDbState();
        } else {
          const d = await res.json().catch(() => ({}));
          showToast(d.error || 'Cannot delete: stockist has order history. Deactivate instead.', 'error');
        }
      } catch (e) { showToast('Error deleting stockist', 'error'); }
    };
    
    triggerConfirmModal(
      t('Delete stockist?', 'स्टॉकिस्ट हटाएं?', 'স্টকিস্ট মুছে ফেলবেন?'),
      t(\`Are you sure you want to delete \${stk.name}? This permanently removes the stockist and their login account. This cannot be undone.\`, \`क्या आप निश्चित रूप से \${stk.name} को हटाना चाहते हैं? यह स्टॉकिस्ट और उनके लॉगिन खाते को स्थायी रूप से हटा देता है। इसे पूर्ववत नहीं किया जा सकता।\`, \`আপনি কি নিশ্চিত যে আপনি \${stk.name} কে মুছে ফেলতে চান? এটি স্থায়ীভাবে স্টকিস্ট এবং তাদের লগইন অ্যাকাউন্ট মুছে ফেলে। এটি পূর্বাবস্থায় ফেরানো যাবে না।\`),
      doDelete,
      true,
      t('Yes, delete', 'हाँ, हटाएं', 'হ্যাঁ, মুছে ফেলুন'),
      t('Cancel', 'रद्द करें', 'বাতিল করুন')
    );
  };`
);

b = findFn('handleToggleStockistDeactivate');
replaceRange(b.start, b.end,
`  const handleToggleStockistDeactivate = (stk) => {
    const doToggle = async () => {
      const endpoint = stk.is_active ? 'deactivate' : 'reactivate';
      try {
        const res = await fetch(\`\${API_BASE}/admin/stockists/\${stk.id}/\${endpoint}\`, { method: 'POST' });
        if (res.ok) {
          showToast(\`Stockist \${stk.is_active ? 'deactivated' : 'reactivated'}\`, 'success');
          fetchDbState();
        } else {
          const d = await res.json().catch(() => ({}));
          showToast(d.error || 'Action failed', 'error');
        }
      } catch (e) { showToast('Error updating stockist status', 'error'); }
    };

    if (stk.is_active !== false) {
      triggerConfirmModal(
        t('Deactivate stockist?', 'स्टॉकिस्ट को निष्क्रिय करें?', 'স্টকিস্ট নিষ্ক্রিয় করবেন?'),
        t(\`Are you sure you want to deactivate \${stk.name}? Their shop will be hidden from customers and they won't be able to take new orders. You can reactivate them later.\`, \`क्या आप निश्चित रूप से \${stk.name} को निष्क्रिय करना चाहते हैं? उनकी दुकान ग्राहकों से छिपी रहेगी और वे नए ऑर्डर नहीं ले पाएंगे। आप उन्हें बाद में फिर से सक्रिय कर सकते हैं।\`, \`আপনি কি নিশ্চিত যে আপনি \${stk.name} কে নিষ্ক্রিয় করতে চান? তাদের দোকান গ্রাহকদের থেকে লুকানো থাকবে এবং তারা নতুন অর্ডার নিতে পারবে না। আপনি পরে তাদের আবার সক্রিয় করতে পারেন।\`),
        doToggle,
        true,
        t('Yes, deactivate', 'हाँ, निष्क्रिय करें', 'হ্যাঁ, নিষ্ক্রিয় করুন'),
        t('Cancel', 'रद्द करें', 'বাতিল করুন')
      );
    } else {
      doToggle();
    }
  };`
);

b = findFn('handleToggleCustomerDeactivate');
replaceRange(b.start, b.end,
`  const handleToggleCustomerDeactivate = (cust) => {
    const doToggle = async () => {
      const endpoint = cust.is_active ? 'deactivate' : 'reactivate';
      try {
        const res = await fetch(\`\${API_BASE}/admin/customers/\${cust.id}/\${endpoint}\`, { method: 'POST' });
        if (res.ok) {
          showToast(\`Customer \${cust.is_active ? 'deactivated' : 'reactivated'}\`, 'success');
          fetchDbState();
        } else {
          const d = await res.json().catch(() => ({}));
          showToast(d.error || 'Action failed', 'error');
        }
      } catch (e) { showToast('Error updating customer status', 'error'); }
    };

    if (cust.is_active !== false) {
      triggerConfirmModal(
        t('Deactivate customer?', 'ग्राहक को निष्क्रिय करें?', 'গ্রাহক নিষ্ক্রিয় করবেন?'),
        t(\`Are you sure you want to deactivate \${cust.name || 'this customer'}? They won't be able to place new orders. You can reactivate them later.\`, \`क्या आप निश्चित रूप से \${cust.name || 'इस ग्राहक'} को निष्क्रिय करना चाहते हैं? वे नए ऑर्डर नहीं दे पाएंगे। आप उन्हें बाद में फिर से सक्रिय कर सकते हैं।\`, \`আপনি কি নিশ্চিত যে আপনি \${cust.name || 'এই গ্রাহক'} কে নিষ্ক্রিয় করতে চান? তারা নতুন অর্ডার দিতে পারবে না। আপনি পরে তাদের আবার সক্রিয় করতে পারেন।\`),
        doToggle,
        true,
        t('Yes, deactivate', 'हाँ, निष्क्रिय करें', 'হ্যাঁ, নিষ্ক্রিয় করুন'),
        t('Cancel', 'रद्द करें', 'বাতিল করুন')
      );
    } else {
      doToggle();
    }
  };`
);

b = findFn('handleDeleteAdminRegion');
replaceRange(b.start, b.end,
`  const handleDeleteAdminRegion = (region) => {
    triggerConfirmModal(
      t('Delete Region?', 'क्षेत्र हटाएं?', 'অঞ্চল মুছে ফেলবেন?'),
      t(\`Are you sure you want to delete region "\${region.name}" (\${region.code})?\`, \`क्या आप निश्चित रूप से क्षेत्र "\${region.name}" (\${region.code}) को हटाना चाहते हैं?\`, \`আপনি কি নিশ্চিত যে আপনি "\${region.name}" (\${region.code}) অঞ্চলটি মুছে ফেলতে চান?\`),
      async () => {
        try {
          const res = await fetch(\`\${API_BASE}/admin/regions/\${region.id}\`, { method: 'DELETE' });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            showToast(data.message || data.error || \`Request failed (\${typeof res !== 'undefined' ? res.status : 500})\`, 'error');
            return;
          }
          showToast('Region deleted successfully', 'success');
          fetchAdminRegions();
          fetchDbState();
        } catch (err) {
          showToast('Error deleting region', 'error');
        }
      },
      true,
      t('Yes, delete', 'हाँ, हटाएं', 'হ্যাঁ, মুছে ফেলুন'),
      t('Cancel', 'रद्द करें', 'বাতিল করুন')
    );
  };`
);

b = findFn('handleRemoveVendor');
replaceRange(b.start, b.end,
`  const handleRemoveVendor = async (vendor) => {
    try {
      const refRes = await adminFetch(\`/admin/vendors/\${vendor.id}/references\`);
      const { reference_count } = await refRes.json().catch(() => ({}));

      let message;
      if (reference_count === 0) {
        message = t(
          \`Are you sure you want to delete \${vendor.name}? It is not assigned to any stockist. This permanently deletes it.\`,
          \`क्या आप निश्चित रूप से \${vendor.name} को हटाना चाहते हैं? यह किसी स्टॉकिस्ट को सौंपा नहीं गया है। यह इसे स्थायी रूप से हटा देता है।\`,
          \`আপনি কি নিশ্চিত যে আপনি \${vendor.name} কে মুছে ফেলতে চান? এটি কোন স্টকিস্টকে বরাদ্দ করা হয়নি। এটি স্থায়ীভাবে এটি মুছে ফেলে।\`
        );
      } else {
        message = t(
          \`\${vendor.name} is assigned to \${reference_count} stockist(s). It will be marked inactive. Those stockists keep their supplier, but it cannot be assigned to anyone new.\`,
          \`\${vendor.name} को \${reference_count} स्टॉकिस्ट(s) को सौंपा गया है। इसे निष्क्रिय चिह्नित किया जाएगा। वे स्टॉकिस्ट अपना आपूर्तिकर्ता रखते हैं, लेकिन इसे किसी नए को सौंपा नहीं जा सकता है।\`,
          \`\${vendor.name} কে \${reference_count} স্টকিস্ট(গুলি) এ বরাদ্দ করা হয়েছে। এটিকে নিষ্ক্রিয় হিসাবে চিহ্নিত করা হবে। সেই স্টকিস্টরা তাদের সরবরাহকারী রাখেন, তবে এটি নতুন কাউকে বরাদ্দ করা যাবে না।\`
        );
      }

      triggerConfirmModal(
        t('Confirm Removal', 'हटाने की पुष्टि करें', 'অপসারণ নিশ্চিত করুন'),
        message,
        async () => {
          try {
            const res = await adminFetch(\`/admin/vendors/\${vendor.id}\`, { method: 'DELETE' });
            if (res.ok) {
              showToast('Wholesaler removed');
              fetchAdminVendors();
            } else {
              const data = await res.json().catch(() => ({}));
              showToast(data.message || data.error || 'Remove failed', 'error');
            }
          } catch (err) {
            showToast('Network error', 'error');
          }
        },
        true,
        t('Yes, delete', 'हाँ, हटाएं', 'হ্যাঁ, মুছে ফেলুন'),
        t('Cancel', 'रद्द करें', 'বাতিল করুন')
      );
    } catch (e) { showToast('Error checking references', 'error'); }
  };`
);

b = findFn('handleRemoveStoreOverride');
replaceRange(b.start, b.end,
`  const handleRemoveStoreOverride = (storeCfg) => {
    triggerConfirmModal(
      t('Remove Store Override?', 'स्टोर ओवरराइड हटाएं?', 'স্টোর ওভাররাইড মুছে ফেলবেন?'),
      t(\`Are you sure you want to remove the commission override for \${storeCfg.name}? They will return to the global commission rules.\`, \`क्या आप निश्चित रूप से \${storeCfg.name} के लिए कमीशन ओवरराइड हटाना चाहते हैं? वे वैश्विक कमीशन नियमों पर वापस आ जाएंगे।\`, \`আপনি কি নিশ্চিত যে আপনি \${storeCfg.name} এর জন্য কমিশন ওভাররাইড মুছে ফেলতে চান? তারা গ্লোবাল কমিশন নিয়মে ফিরে আসবে।\`),
      async () => {
        try {
          const res = await adminFetch(\`/admin/commission-config/store/\${storeCfg.stockist_id}\`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Store override removed!');
            fetchStoreOverrides();
          } else {
            showToast('Failed to remove override', 'error');
          }
        } catch (e) {
          showToast('Error removing override', 'error');
        }
      },
      true,
      t('Yes, remove', 'हाँ, हटाएं', 'হ্যাঁ, মুছে ফেলুন'),
      t('Cancel', 'रद्द करें', 'বাতিল করুন')
    );
  };`
);

fs.writeFileSync('frontend/src/App.jsx', lines.join('\n'));
