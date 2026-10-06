const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/App.jsx');
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// 1. handleAddNewProduct
const addProductOld = `      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(\`Product \${newProdName} added successfully with bill!\`, 'success');
        if (data.bill_photo && data.bill_photo.public_url) {
          setUploadedBillPreviewUrl(data.bill_photo.public_url);
        }
        setShowAddProductModal(false);
        setNewProdName('');
        setNewProdDescription('');
        setNewProdPrice('');
        setNewProdCostPrice('');
        setNewProdCategory('groceries');
        setNewProdInitialStock('10');
        setNewProdBillFile(null);
        setNewProdImageFile(null);
        setNewProdImagePreview(null);
        loadStockistData();
        fetchDbState();
      } else {`;

const addProductNew = `      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.bill_photo && data.bill_photo.public_url) {
          setUploadedBillPreviewUrl(data.bill_photo.public_url);
        }
        
        if (data.product) {
          setStockistProducts(prev => [data.product, ...prev]);
        }
        
        setStockistProductSearch('');
        setStockistActiveTab('inventory');
        
        setShowAddProductModal(false);
        setNewProdName('');
        setNewProdDescription('');
        setNewProdPrice('');
        setNewProdCostPrice('');
        setNewProdCategory('groceries');
        setNewProdInitialStock('10');
        setNewProdBillFile(null);
        setNewProdImageFile(null);
        setNewProdImagePreview(null);
        
        const newProductId = data.product ? data.product.id : null;
        if (newProductId) {
          setHighlightedProductId(newProductId);
          setTimeout(() => setHighlightedProductId(null), 3000);
        }
        
        const doRefresh = () => {
          fetch(\`\${API_BASE}/products?stockistId=\${stockistProfile.id}\`)
            .then(prRes => {
              if (!prRes.ok) throw new Error('Refresh failed');
              return prRes.json();
            })
            .then(prData => {
              if (Array.isArray(prData)) {
                setStockistProducts(prev => {
                  const newMap = new Map(prData.map(p => [p.id, p]));
                  const merged = [...prev];
                  for (let i = 0; i < merged.length; i++) {
                    if (newMap.has(merged[i].id)) {
                      merged[i] = newMap.get(merged[i].id);
                      newMap.delete(merged[i].id);
                    }
                  }
                  return [...merged, ...Array.from(newMap.values())];
                });
                showToast(t('Added and live for customers', 'जोड़ा गया और ग्राहकों के लिए लाइव', 'যোগ করা হয়েছে এবং গ্রাহকদের জন্য লাইভ'), 'success');
              } else {
                throw new Error('Not an array');
              }
            })
            .catch(err => {
              showToast('Product saved, but the list could not refresh. Pull to refresh.', 'warning', {
                label: 'Retry',
                onClick: doRefresh
              });
            });
        };
        doRefresh();
        
      } else {`;

if (content.includes(addProductOld)) {
  content = content.replace(addProductOld, addProductNew);
  console.log("Replaced handleAddNewProduct");
} else {
  console.log("Could not find handleAddNewProduct");
}

const rowRenderOld = `                            return (
                              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: isLowStock ? '1px dashed var(--warning)' : '1px solid var(--border-color)', fontSize: '0.75rem', position: 'relative' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {p.name}
                                    {p.is_sellable === false && (`;

const rowRenderNew = `                            return (
                              <div key={p.id} ref={el => { if (el && p.id === highlightedProductId) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: p.id === highlightedProductId ? 'rgba(76, 175, 80, 0.2)' : 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: isLowStock ? '1px dashed var(--warning)' : '1px solid var(--border-color)', fontSize: '0.75rem', position: 'relative', transition: 'background-color 1s' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    {p.name}
                                    {p.bill_status === 'PENDING' && (
                                      <span style={{ fontSize: '0.65rem', background: 'var(--warning)', color: '#000', padding: '2px 6px', borderRadius: 10 }}>
                                        {t('Awaiting bill check', 'बिल की जांच की प्रतीक्षा', 'বিলের চেকের অপেক্ষায়')}
                                      </span>
                                    )}
                                    {p.bill_status === 'VERIFIED' && (
                                      <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: 10 }}>
                                        {t('Verified', 'सत्यापित', 'যাচাইকৃত')}
                                      </span>
                                    )}
                                    {p.bill_status === 'REJECTED' && (
                                      <span style={{ fontSize: '0.65rem', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: 10 }} title={p.rejection_reason}>
                                        {t('Rejected', 'अस्वीकृत', 'প্রত্যাখ্যাত')}{p.rejection_reason ? \`: \${p.rejection_reason}\` : ''}
                                      </span>
                                    )}
                                    {p.is_sellable === false && (`;

if (content.includes(rowRenderOld)) {
  content = content.replace(rowRenderOld, rowRenderNew);
  console.log("Replaced rowRender");
} else {
  console.log("Could not find rowRender");
}

fs.writeFileSync(file, content, 'utf8');
