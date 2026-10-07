const fs = require('fs');
const file = 'x:/app/frontend/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    search: `  Lock,
  Check,
  ArrowRight,
  Edit,`,
    replace: `  Lock,
  Check,
  ArrowRight,
  Edit,
  Trash2,`
  },
  {
    search: `  const handleStartEditProduct = (prod) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);`,
    replace: `  const handleDeleteProduct = (prod) => {
    const msg = prod.stock_qty > 0 
      ? t(\`Delete \${prod.name}? It will be removed from your inventory and customers will no longer see it. Past orders are not affected. This cannot be undone.\\n\${prod.stock_qty} in stock will no longer be sold.\`, \`\${prod.name} को हटाएं? इसे आपकी इन्वेंट्री से हटा दिया जाएगा और ग्राहक इसे नहीं देख पाएंगे। पिछले आदेश प्रभावित नहीं होंगे। इसे पूर्ववत नहीं किया जा सकता।\\nस्टॉक में \${prod.stock_qty} अब नहीं बेचे जाएंगे।\`, \`\${prod.name} মুছে ফেলবেন? এটি আপনার ইনভেন্টরি থেকে মুছে ফেলা হবে এবং গ্রাহকরা আর এটি দেখতে পাবেন না। অতীত অর্ডারগুলি প্রভাবিত হবে না। এটি পূর্বাবস্থায় ফেরানো যাবে না।\\nস্টকে থাকা \${prod.stock_qty} আর বিক্রি হবে না।\`)
      : t(\`Delete \${prod.name}? It will be removed from your inventory and customers will no longer see it. Past orders are not affected. This cannot be undone.\`, \`\${prod.name} को हटाएं? इसे आपकी इन्वेंट्री से हटा दिया जाएगा और ग्राहक इसे नहीं देख पाएंगे। पिछले आदेश प्रभावित नहीं होंगे। इसे पूर्ववत नहीं किया जा सकता।\`, \`\${prod.name} মুছে ফেলবেন? এটি আপনার ইনভেন্টরি থেকে মুছে ফেলা হবে এবং গ্রাহকরা আর এটি দেখতে পাবেন না। অতীত অর্ডারগুলি প্রভাবিত হবে না। এটি পূর্বাবস্থায় ফেরানো যাবে না।\`);

    triggerConfirmModal(
      t('Delete product?', 'उत्पाद हटाएं?', 'পণ্য মুছে ফেলবেন?'),
      msg,
      async () => {
        try {
          const res = await fetch(\`\${API_BASE}/products/\${prod.id}\`, {
            method: 'DELETE',
            headers: {
              'Authorization': \`Bearer \${localStorage.getItem('token') || ''}\`
            }
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            showToast(t(\`\${prod.name} deleted\`, \`\${prod.name} हटा दिया गया\`, \`\${prod.name} মুছে ফেলা হয়েছে\`));
            loadStockistProducts();
            fetchDbState();
          } else {
            if (res.status === 403 || res.status === 404) {
              showToast(data.message || data.error, 'error');
            } else {
              showToast(data.message || data.error || 'Failed to delete product', 'error');
            }
          }
        } catch (e) {
          showToast('Server error deleting product', 'error');
        }
      },
      true,
      t('Yes, delete', 'हाँ, हटाएं', 'হ্যাঁ, মুছে ফেলুন'),
      t('Cancel', 'रद्द करें', 'বাতিল করুন')
    );
  };

  const handleStartEditProduct = (prod) => {
    setEditingProduct(prod);
    setEditProdName(prod.name);`
  },
  {
    search: `                                    <Edit 
                                      size={12} 
                                      style={{ color: 'var(--text-muted)', cursor: 'pointer', verticalAlign: 'middle' }} 
                                      onClick={() => handleStartEditProduct(p)}
                                    />`,
    replace: `                                    <Edit 
                                      size={12} 
                                      style={{ color: 'var(--text-muted)', cursor: 'pointer', verticalAlign: 'middle' }} 
                                      onClick={() => handleStartEditProduct(p)}
                                    />
                                    <button
                                      className="btn btn-danger"
                                      style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                      onClick={() => handleDeleteProduct(p)}
                                    >
                                      <Trash2 size={12} /> {t('Delete', 'हटाएं', 'মুছে ফেলুন')}
                                    </button>`
  },
  {
    search: `      setCustomerProducts(Array.isArray(data) ? data : []);
    } catch (err) {`,
    replace: `      const prods = Array.isArray(data) ? data : [];
      setCustomerProducts(prods);

      setCustomerCarts(prev => {
        const sid = selectedStockist.id;
        const cart = prev[sid];
        if (!cart) return prev;
        const originalLen = cart.items.length;
        const availableItems = cart.items.filter(item => prods.some(p => p.id === item.product.id && p.is_sellable !== false));
        if (availableItems.length !== originalLen) {
          showToast(t('Some items are no longer available and were removed from your cart.', 'कुछ आइटम अब उपलब्ध नहीं हैं और आपके कार्ट से हटा दिए गए हैं।', 'কিছু আইটেম আর উপলব্ধ নেই এবং আপনার কার্ট থেকে মুছে ফেলা হয়েছে।'));
          if (availableItems.length === 0) {
            const next = { ...prev };
            delete next[sid];
            return next;
          }
          return { ...prev, [sid]: { ...cart, items: availableItems } };
        }
        return prev;
      });
    } catch (err) {`
  },
  {
    search: `      const res = await fetch(\`\${API_BASE}/products?regionId=\${currentUser.region_id}&stockistId=\${selectedStockist.id}\`);`,
    replace: `      const res = await fetch(\`\${API_BASE}/products?regionId=\${currentUser.region_id}&stockistId=\${selectedStockist.id}&customer=true\`);`
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
  console.log("Frontend patched successfully.");
}
