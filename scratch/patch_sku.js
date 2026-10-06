const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/App.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Update loadStockistData to drop regionId for stockist inventory
content = content.replace(
  /const prRes = await fetch\(`\$\{API_BASE\}\/products\?regionId=\$\{currentUser\.region_id\}&stockistId=\$\{pData\.id\}`\);/g,
  'const prRes = await fetch(`${API_BASE}/products?stockistId=${pData.id}`);'
);

// 2. Add action support to showToast
content = content.replace(
  /const showToast = \(message, type = 'success'\) => \{\s+setToast\(\{ message, type \}\);\s+setTimeout\(\(\) => setToast\(null\), 4000\);\s+\};/g,
  `const showToast = (message, type = 'success', action = null) => {
    setToast({ message, type, action });
    setTimeout(() => setToast(null), action ? 6000 : 4000);
  };`
);

// 3. Update the toast renderer
content = content.replace(
  /<span>\{toast\.message\}<\/span>\s+<\/div>/g,
  `<span>{toast.message}</span>
            {toast.action && (
              <button 
                onClick={(e) => { e.stopPropagation(); toast.action.onClick(); setToast(null); }} 
                className="btn-accent" 
                style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '0.8em', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {toast.action.label}
              </button>
            )}
          </div>`
);

// 4. Update handleAddNewProduct
// First, find handleAddNewProduct
const addProductStartRegex = /const handleAddNewProduct = async \(\) => \{[\s\S]*?if \(!newProdName/g;
if (!addProductStartRegex.test(content)) {
  console.log("Could not find handleAddNewProduct");
  process.exit(1);
}

// Replace the success block of handleAddNewProduct
const successBlockOld = `      const data = await res.json().catch(() => ({}));
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

const successBlockNew = `      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.bill_photo && data.bill_photo.public_url) {
          setUploadedBillPreviewUrl(data.bill_photo.public_url);
        }
        
        if (data.product) {
          setStockistProducts(prev => [data.product, ...prev]);
        }
        
        setStockistProductSearch('');
        if (typeof setActiveStockistTab === 'function') {
          setActiveStockistTab('inventory');
        } else if (typeof setActiveTab === 'function' && stockistProfile) {
          // Fallback if the tab state is something else, check how tabs work
        }
        
        // Ensure modal is closed
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
        
        // Do not call loadStockistData() to reload everything, just reload the list
        // And scroll into view and highlight
        const newProductId = data.product ? data.product.id : null;
        if (newProductId) {
          if (typeof setHighlightedProductId === 'function') {
            setHighlightedProductId(newProductId);
            setTimeout(() => setHighlightedProductId(null), 3000);
          }
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

if (content.includes(successBlockOld)) {
  content = content.replace(successBlockOld, successBlockNew);
} else {
  console.log("Could not find success block to replace");
}

fs.writeFileSync(file, content, 'utf8');
console.log("Patch applied.");
