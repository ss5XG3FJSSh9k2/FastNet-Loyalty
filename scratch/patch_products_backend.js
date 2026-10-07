const fs = require('fs');
const file = 'x:/app/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    search: `  let filtered = products;
  if (req.query.customer === 'true') {
    filtered = filtered.filter(p => p.is_sellable !== false);
  }`,
    replace: `  let filtered = products.filter(p => !p.deleted_at);
  if (req.query.customer === 'true') {
    filtered = filtered.filter(p => p.is_sellable !== false);
  }`
  },
  {
    search: `app.patch('/api/products/:id', requireAuth, uploadBillMiddleware, async (req, res) => {`,
    replace: `app.delete('/api/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const products = await db.getTable('products');
  const user = req.user;
  
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'product_not_found', message: 'Product not found' });
  }

  let isOwner = false;
  let isAdmin = user.role === 'ADMIN';

  if (user.role === 'STOCKIST') {
    const stockists = await db.getTable('stockists');
    const myShop = stockists.find(s => (s.phone === user.phone || s.user_id === user.id));
    if (myShop && myShop.id === product.stockist_id) {
      isOwner = true;
    }
  }

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'forbidden', message: 'You do not own this product' });
  }

  if (product.deleted_at) {
    return res.status(200).json({ message: 'Already deleted' });
  }

  const inventory = await db.getTable('stockist_inventory');
  const inv = inventory.find(i => i.product_id === product.id && i.stockist_id === product.stockist_id);
  const stockQty = inv ? inv.stock_qty : 0;

  await db.updateRow('products', product.id, { deleted_at: new Date().toISOString(), is_sellable: false });
  if (inv) {
    await db.updateRow('stockist_inventory', inv.id, { is_available: false });
  }

  await writeAdminAudit(user.id, 'DELETE_PRODUCT', {
    product_id: product.id,
    product_name: product.name,
    shop_id: product.stockist_id,
    stock_qty: stockQty
  });

  return res.status(200).json({ message: 'Product deleted successfully' });
});

app.patch('/api/products/:id', requireAuth, uploadBillMiddleware, async (req, res) => {`
  },
  {
    search: `    return {
      ...b,
      created_at: b.uploaded_at,
      product_name: p ? p.name : 'Unknown Product',`,
    replace: `    return {
      ...b,
      created_at: b.uploaded_at,
      product_name: p ? (p.deleted_at ? p.name + ' (Deleted by shopkeeper)' : p.name) : 'Unknown Product',`
  },
  {
    search: `  const similarProducts = products.filter(p => p.region_id === regionId && p.name.toLowerCase().includes(name.toLowerCase()));`,
    replace: `  const similarProducts = products.filter(p => !p.deleted_at && p.region_id === regionId && p.name.toLowerCase().includes(name.toLowerCase()));`
  },
  {
    search: `      if (product.is_sellable === false) {
        return res.status(400).json({ error: 'product_unavailable', message: 'One or more items are no longer available.' });
      }`,
    replace: `      if (product.deleted_at) {
        return res.status(400).json({ error: 'product_unavailable', message: \`\${product.name} is no longer available.\` });
      }
      if (product.is_sellable === false) {
        return res.status(400).json({ error: 'product_unavailable', message: 'One or more items are no longer available.' });
      }`
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
  console.log("Backend patched successfully.");
}
