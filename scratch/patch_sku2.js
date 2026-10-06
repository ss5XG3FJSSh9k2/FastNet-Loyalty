const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/App.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Drop regionId filter
content = content.replace(
  /const prRes = await fetch\(`\$\{API_BASE\}\/products\?regionId=\$\{currentUser\.region_id\}&stockistId=\$\{pData\.id\}`\);/g,
  'const prRes = await fetch(`${API_BASE}/products?stockistId=${pData.id}`);'
);

// 2. Add action support to showToast
content = content.replace(
  /const showToast = \(message, type = 'success'\) => \{\n\s*setToast\(\{ message, type \}\);\n\s*setTimeout\(\(\) => setToast\(null\), 4000\);\n\s*\};/g,
  `const showToast = (message, type = 'success', action = null) => {\n    setToast({ message, type, action });\n    setTimeout(() => setToast(null), action ? 6000 : 4000);\n  };`
);

// 3. Update the toast renderer
content = content.replace(
  /<span>\{toast\.message\}<\/span>\n\s*<\/div>/g,
  `<span>{toast.message}</span>\n            {toast.action && (\n              <button \n                onClick={(e) => { e.stopPropagation(); toast.action.onClick(); setToast(null); }} \n                className="btn-accent" \n                style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '0.8em', border: 'none', borderRadius: '4px', cursor: 'pointer', zIndex: 1001 }}\n              >\n                {toast.action.label}\n              </button>\n            )}\n          </div>`
);

// Add highlightedProductId state
if (!content.includes('const [highlightedProductId, setHighlightedProductId] = useState(null);')) {
  content = content.replace(
    /const \[stockistProducts, setStockistProducts\] = useState\(\[\]\);/g,
    `const [stockistProducts, setStockistProducts] = useState([]);\n  const [highlightedProductId, setHighlightedProductId] = useState(null);`
  );
}

// 4. Update handleAddNewProduct
const oldAddProductStr = `      const data = await res.json().catch(() => ({}));
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

const newAddProductStr = `      const data = await res.json().catch(() => ({}));
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

if (content.includes(oldAddProductStr)) {
  content = content.replace(oldAddProductStr, newAddProductStr);
} else {
  console.log("oldAddProductStr not found. Please verify the exact string.");
  // Dump the substring to see what it is
  const idx = content.indexOf('const data = await res.json().catch(() => ({}));');
  if (idx !== -1) {
    console.log(content.substring(idx, idx + 600));
  }
}

// 5. Scroll highlighted product into view
const rowRenderStr = `                  <tr key={prod.id}>
                    <td>
                      <img src={prod.image_url} alt={prod.name} className="product-image" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                    </td>`;
const newRowRenderStr = `                  <tr key={prod.id} ref={el => { if (el && prod.id === highlightedProductId) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} style={{ transition: 'background-color 1s', backgroundColor: prod.id === highlightedProductId ? 'rgba(76, 175, 80, 0.2)' : 'transparent' }}>
                    <td>
                      <img src={prod.image_url} alt={prod.name} className="product-image" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />
                    </td>`;

if (content.includes(rowRenderStr)) {
  content = content.replace(rowRenderStr, newRowRenderStr);
} else {
  console.log("rowRenderStr not found.");
}

// 6. Show product's status badge
// Each inventory row shows a small badge: "Awaiting bill check" while its bill is PENDING, "Verified" once approved, and "Rejected" with the reason when rejected.
// Let's find where product name is rendered in stockist inventory table
const prodNameRenderStr = `                    <td>
                      <div style={{ fontWeight: '500' }}>{prod.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{t(prod.category, prod.category, prod.category)}</div>
                    </td>`;
                    
const newProdNameRenderStr = `                    <td>
                      <div style={{ fontWeight: '500' }}>
                        {prod.name}
                        {prod.bill_status === 'PENDING' && (
                          <span style={{ marginLeft: 8, fontSize: '0.7em', background: 'var(--warning)', color: '#000', padding: '2px 6px', borderRadius: 10 }}>
                            {t('Awaiting bill check', 'बिल की जांच की प्रतीक्षा', 'বিলের চেকের অপেক্ষায়')}
                          </span>
                        )}
                        {prod.bill_status === 'VERIFIED' && (
                          <span style={{ marginLeft: 8, fontSize: '0.7em', background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: 10 }}>
                            {t('Verified', 'सत्यापित', 'যাচাইকৃত')}
                          </span>
                        )}
                        {prod.bill_status === 'REJECTED' && (
                          <span style={{ marginLeft: 8, fontSize: '0.7em', background: 'var(--danger)', color: '#fff', padding: '2px 6px', borderRadius: 10 }} title={prod.rejection_reason}>
                            {t('Rejected', 'अस्वीकृत', 'প্রত্যাখ্যাত')}{prod.rejection_reason ? \`: \${prod.rejection_reason}\` : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>{t(prod.category, prod.category, prod.category)}</div>
                    </td>`;

if (content.includes(prodNameRenderStr)) {
  content = content.replace(prodNameRenderStr, newProdNameRenderStr);
} else {
  console.log("prodNameRenderStr not found. Finding alternatives...");
  const searchStr = `                      <div style={{ fontWeight: '500' }}>{prod.name}</div>`;
  if (content.includes(searchStr)) {
    console.log("Found alternative");
  } else {
    console.log("Alternative not found");
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log("Patch 2 applied.");
