const fs = require('fs');

let code = fs.readFileSync('backend/server.js', 'utf8');

// 1. handleCreateOrderRoute (orders)
code = code.replace(
  /for \(const storeEntry of stores\) \{\s*const \{ stockistId, items, pickupSlot \} = storeEntry;/,
  `for (const storeEntry of stores) {
    const { stockistId, items, pickupSlot } = storeEntry;
    if (!stockistId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Each store entry must have a stockistId and items' });
    }

    // Group and aggregate items by productId
    const aggregatedItemsMap = new Map();
    for (const item of items) {
      if (!item.productId) return res.status(400).json({ error: 'validation_failed', message: 'Missing productId', fields: { productId: 'required' } });
      const qty = item.quantity;
      if (typeof qty !== 'number' || !Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1 || qty > cfg.MAX_ITEM_QUANTITY_PER_LINE) {
        return res.status(400).json({ error: 'validation_failed', message: 'Invalid quantity', fields: { quantity: 'must be an integer >= 1 and <= MAX_ITEM_QUANTITY_PER_LINE' } });
      }
      if (aggregatedItemsMap.has(item.productId)) {
        aggregatedItemsMap.get(item.productId).quantity += qty;
      } else {
        aggregatedItemsMap.set(item.productId, { ...item, quantity: qty });
      }
    }
    const aggregatedItems = Array.from(aggregatedItemsMap.values());`
);

code = code.replace(
  /for \(const item of items\) \{\s*const product = products.find\(p => p.id === item.productId\);/,
  `for (const item of aggregatedItems) {
      const product = products.find(p => p.id === item.productId);`
);

code = code.replace(
  /const amountPaid = totalPrice - couponDiscount;/,
  `const amountPaid = totalPrice - couponDiscount;
    if (subtotal <= 0 || totalPrice <= 0) {
      return res.status(400).json({ error: 'validation_failed', message: 'Order total must be positive', fields: { total_price: 'must be > 0' } });
    }`
);

// 2. /api/orders/sync validation
code = code.replace(
  /app\.post\('\/api\/orders\/sync', requireAuth, async \(req, res\) => \{\s*const \{ customerId, orders \} = req\.body;/,
  `app.post('/api/orders/sync', requireAuth, async (req, res) => {
  const { customerId, orders } = req.body;`
);

// We need to inject validation into POST /api/orders/sync. Let's find where it parses items.
code = code.replace(
  /for \(const reqOrder of orders\) \{\s*const \{ stockistId, items, paymentMethod, total, fulfillmentType, pickupSlot \} = reqOrder;/,
  `for (const reqOrder of orders) {
    const { stockistId, items, paymentMethod, total, fulfillmentType, pickupSlot } = reqOrder;

    const aggregatedItemsMap = new Map();
    let hasValidationErr = false;
    let validationErrMsg = '';
    for (const item of items) {
      if (!item.productId) { hasValidationErr = true; validationErrMsg = 'Missing productId'; break; }
      const qty = item.quantity;
      if (typeof qty !== 'number' || !Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1 || qty > cfg.MAX_ITEM_QUANTITY_PER_LINE) {
        hasValidationErr = true; validationErrMsg = 'Invalid quantity'; break;
      }
      if (aggregatedItemsMap.has(item.productId)) {
        aggregatedItemsMap.get(item.productId).quantity += qty;
      } else {
        aggregatedItemsMap.set(item.productId, { ...item, quantity: qty });
      }
    }
    if (hasValidationErr) {
      return res.status(400).json({ error: 'validation_failed', message: validationErrMsg, fields: { quantity: 'must be valid' } });
    }
    const aggregatedItems = Array.from(aggregatedItemsMap.values());
    reqOrder.items = aggregatedItems;
`
);

// Update items loop in sync
code = code.replace(
  /for \(const item of items\) \{\s*const product = products.find\(p => p.id === item.productId\);/g,
  `for (const item of (typeof reqOrder !== 'undefined' && reqOrder.items ? reqOrder.items : items)) {
      const product = products.find(p => p.id === item.productId);`
);

// 3. Generic Rewards POST
code = code.replace(
  /if \(\!name \|\| \!point_cost\) return res\.status\(400\)\.json\(\{ error: 'Missing fields' \}\);/,
  `if (typeof name !== 'string' || !name.trim() || name.trim().length < 1 || name.trim().length > cfg.REWARD_NAME_MAX_LENGTH) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid name', fields: { name: 'required and max length' } });
  }
  if (description && typeof description === 'string' && description.length > cfg.REWARD_DESCRIPTION_MAX_LENGTH) {
    return res.status(400).json({ error: 'validation_failed', message: 'Description too long', fields: { description: 'max length' } });
  }
  const ptCost = Number(point_cost);
  if (!Number.isFinite(ptCost) || !Number.isInteger(ptCost) || ptCost < 1 || ptCost > cfg.REWARD_POINT_COST_MAX || (typeof point_cost !== 'number' && !/^\\d+$/.test(String(point_cost).trim()))) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid point cost', fields: { point_cost: 'integer >= 1' } });
  }
  const valRs = Number(value_rupees);
  if (!Number.isFinite(valRs) || valRs < 0 || valRs > cfg.REWARD_VALUE_MAX_RUPEES) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid value', fields: { value_rupees: 'number >= 0' } });
  }`
);

// 4. Generic Rewards PATCH
code = code.replace(
  /if \(name !== undefined\) reward\.name = name;/,
  `if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length < 1 || name.trim().length > cfg.REWARD_NAME_MAX_LENGTH) return res.status(400).json({ error: 'validation_failed', message: 'Invalid name', fields: { name: 'required and max length' } });
    reward.name = name.trim();
  }`
);
code = code.replace(
  /if \(description !== undefined\) reward\.description = description;/,
  `if (description !== undefined) {
    if (description && typeof description === 'string' && description.length > cfg.REWARD_DESCRIPTION_MAX_LENGTH) return res.status(400).json({ error: 'validation_failed', message: 'Description too long', fields: { description: 'max length' } });
    reward.description = description;
  }`
);
code = code.replace(
  /if \(point_cost !== undefined\) reward\.point_cost = parseInt\(point_cost, 10\);/,
  `if (point_cost !== undefined) {
    const ptCost = Number(point_cost);
    if (!Number.isFinite(ptCost) || !Number.isInteger(ptCost) || ptCost < 1 || ptCost > cfg.REWARD_POINT_COST_MAX || (typeof point_cost !== 'number' && !/^\\d+$/.test(String(point_cost).trim()))) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid point cost', fields: { point_cost: 'integer >= 1' } });
    }
    reward.point_cost = ptCost;
  }`
);
code = code.replace(
  /if \(value_rupees !== undefined\) reward\.value_rupees = parseFloat\(value_rupees\);/,
  `if (value_rupees !== undefined) {
    const valRs = Number(value_rupees);
    if (!Number.isFinite(valRs) || valRs < 0 || valRs > cfg.REWARD_VALUE_MAX_RUPEES) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid value', fields: { value_rupees: 'number >= 0' } });
    }
    reward.value_rupees = valRs;
  }`
);
code = code.replace(
  /if \(is_active !== undefined\) reward\.is_active = is_active;/,
  `if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'validation_failed', message: 'Invalid is_active', fields: { is_active: 'must be boolean' } });
    reward.is_active = is_active;
  }`
);

// 5. Manual points credit
code = code.replace(
  /const numAmount = parseFloat\(amount\);\s*if \(isNaN\(numAmount\) \|\| numAmount <= 0\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Amount must be a positive number' \}\);\s*\}/,
  `const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0 || numAmount > cfg.MANUAL_CREDIT_MAX_POINTS) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid amount', fields: { amount: \`must be > 0 and <= \${cfg.MANUAL_CREDIT_MAX_POINTS}\` } });
  }`
);
code = code.replace(
  /if \(\!reason \|\| \!reason\.trim\(\)\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Reason is required' \}\);\s*\}/,
  `if (typeof reason !== 'string' || !reason.trim() || reason.trim().length < 5) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid reason', fields: { reason: 'must be at least 5 characters' } });
  }`
);

// 6. Product Create validation
code = code.replace(
  /const name = String\(req\.body\.name \|\| ''\)\.trim\(\);\s*if \(name\.length < 2\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Product name is required' \}\);\s*\}/,
  `const name = String(req.body.name || '').trim();
  if (name.length < 1 || name.length > cfg.PRODUCT_NAME_MAX_LENGTH) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid name', fields: { name: \`non-empty max \${cfg.PRODUCT_NAME_MAX_LENGTH}\` } });
  }`
);

code = code.replace(
  /const parsedPrice = parseFloat\(price\);\s*const parsedCostPrice = costPrice !== undefined \? parseFloat\(costPrice\) : parsedPrice \* 0\.75;\s*if \(parsedPrice <= 0\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Price must be greater than 0' \}\);\s*\}\s*if \(parsedCostPrice < 0 \|\| parsedCostPrice > parsedPrice\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Cost price must be between 0 and selling price' \}\);\s*\}/,
  `const parsedPrice = Number(price);
  const parsedCostPrice = costPrice !== undefined ? Number(costPrice) : parsedPrice * 0.75;
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > cfg.PRODUCT_PRICE_MAX_RUPEES) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid price', fields: { price: \`must be > 0 and <= \${cfg.PRODUCT_PRICE_MAX_RUPEES}\` } });
  }
  if (!Number.isFinite(parsedCostPrice) || parsedCostPrice < 0 || parsedCostPrice > parsedPrice) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid cost price', fields: { costPrice: 'must be >= 0 and <= price' } });
  }
  const initialStockNum = parseInt(initialStock, 10);
  if (!Number.isInteger(initialStockNum) || initialStockNum < 0 || initialStockNum > cfg.PRODUCT_STOCK_MAX) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid stock', fields: { stock: \`integer >= 0 and <= \${cfg.PRODUCT_STOCK_MAX}\` } });
  }`
);

// 7. Product Update validation
code = code.replace(
  /const targetPrice = req\.body\.price !== undefined \? parseFloat\(req\.body\.price\) : product\.price;\s*const targetCost = req\.body\.cost_price !== undefined \? parseFloat\(req\.body\.cost_price\) : product\.cost_price;\s*if \(targetCost > targetPrice\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Cost price cannot exceed selling price' \}\);\s*\}/,
  `const targetPrice = req.body.price !== undefined ? Number(req.body.price) : product.price;
  const targetCost = req.body.cost_price !== undefined ? Number(req.body.cost_price) : product.cost_price;
  if (req.body.price !== undefined && (!Number.isFinite(targetPrice) || targetPrice <= 0 || targetPrice > cfg.PRODUCT_PRICE_MAX_RUPEES)) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid price', fields: { price: 'must be > 0 and within limits' } });
  }
  if (req.body.cost_price !== undefined && (!Number.isFinite(targetCost) || targetCost < 0)) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid cost price', fields: { cost_price: 'must be >= 0' } });
  }
  if (targetCost > targetPrice) {
    return res.status(400).json({ error: 'validation_failed', message: 'Cost price cannot exceed selling price', fields: { cost_price: '<= price' } });
  }
  if (req.body.name !== undefined) {
    const pName = String(req.body.name).trim();
    if (pName.length < 1 || pName.length > cfg.PRODUCT_NAME_MAX_LENGTH) {
      return res.status(400).json({ error: 'validation_failed', message: 'Invalid name', fields: { name: 'non-empty max length' } });
    }
  }`
);

// 8. Restock validation
code = code.replace(
  /app\.post\('\/api\/stockists\/restock', requireAuth, async \(req, res\) => \{\s*const stockistId = req\.headers\['x-user-id'\];\s*if \(!await assertOwnsStockist\(req, res, stockistId\)\) return;\s*const \{ product_id, stock_added \} = req\.body;\s*const added = parseInt\(stock_added, 10\);\s*if \(\!product_id \|\| isNaN\(added\) \|\| added <= 0\) \{\s*return res\.status\(400\)\.json\(\{ error: 'Invalid restock parameters' \}\);\s*\}/,
  `app.post('/api/stockists/restock', requireAuth, async (req, res) => {
  const stockistId = req.headers['x-user-id'];
  if (!await assertOwnsStockist(req, res, stockistId)) return;
  const { product_id, stock_added } = req.body;
  const added = Number(stock_added);
  if (!product_id || !Number.isFinite(added) || !Number.isInteger(added) || added < 1 || added > cfg.PRODUCT_STOCK_MAX) {
    return res.status(400).json({ error: 'validation_failed', message: 'Invalid restock parameters', fields: { stock_added: \`must be integer >= 1 and <= \${cfg.PRODUCT_STOCK_MAX}\` } });
  }`
);

fs.writeFileSync('backend/server.js', code);
console.log('Patch complete.');
