const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const target = `    let subtotal = 0;
    let totalProfitMargin = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) return res.status(400).json({ error: \`Product \${item.productId} not found\` });
      if (product.is_sellable === false) {
        return res.status(400).json({ error: 'product_unavailable', message: 'One or more items are no longer available.' });
      }
      const inv = inventory.find(i => i.stockist_id === stockistId && i.product_id === product.id);
      if (!inv || inv.stock_qty < item.quantity) {
        return res.status(400).json({ error: \`Insufficient stock for \${product.name}\` });
      }

      const itemPrice = parseFloat(product.price);
      const itemCost = parseFloat(product.cost_price);
      subtotal += itemPrice * item.quantity;
      totalProfitMargin += (itemPrice - itemCost) * item.quantity;

      orderItems.push({
        id: 'oi-' + generateId(),
        product_id: product.id,
        name: product.name,
        quantity: item.quantity,
        price: itemPrice,
        cost_price: itemCost
      });
    }`;

const replacement = `    let subtotal = 0;
    let totalProfitMargin = 0;
    const orderItems = [];

    const aggregatedItems = {};
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > cfg.MAX_ITEM_QUANTITY_PER_LINE) {
        return res.status(400).json({ error: 'validation_failed', message: 'Invalid quantity', fields: { quantity: 'Quantity must be between 1 and ' + cfg.MAX_ITEM_QUANTITY_PER_LINE } });
      }
      if (aggregatedItems[item.productId]) {
        aggregatedItems[item.productId] += item.quantity;
      } else {
        aggregatedItems[item.productId] = item.quantity;
      }
    }

    for (const productId of Object.keys(aggregatedItems)) {
      const quantity = aggregatedItems[productId];
      const product = products.find(p => p.id === productId);
      if (!product) return res.status(400).json({ error: \`Product \${productId} not found\` });
      if (product.is_sellable === false) {
        return res.status(400).json({ error: 'product_unavailable', message: 'One or more items are no longer available.' });
      }
      const inv = inventory.find(i => i.stockist_id === stockistId && i.product_id === product.id);
      if (!inv || inv.stock_qty < quantity) {
        return res.status(400).json({ error: 'validation_failed', message: \`Insufficient stock for \${product.name}\`, fields: { quantity: 'Insufficient stock' } });
      }

      const itemPrice = parseFloat(product.price);
      const itemCost = parseFloat(product.cost_price);
      subtotal += itemPrice * quantity;
      totalProfitMargin += (itemPrice - itemCost) * quantity;

      orderItems.push({
        id: 'oi-' + generateId(),
        product_id: product.id,
        name: product.name,
        quantity: quantity,
        price: itemPrice,
        cost_price: itemCost
      });
    }
`;

code = code.replace(target, replacement);

const checkTarget = `    const amountPaid = totalPrice - couponDiscount;

    const reqModel = req.body.commission_model || (!req.body.stores ? 'gross_v1' : 'profit_v2');`;

const checkReplacement = `    const amountPaid = totalPrice - couponDiscount;

    if (subtotal <= 0 || totalPrice <= 0) {
      return res.status(400).json({ error: 'validation_failed', message: 'Order total must be positive', fields: { total_price: 'Must be positive' } });
    }

    const reqModel = req.body.commission_model || (!req.body.stores ? 'gross_v1' : 'profit_v2');`;

code = code.replace(checkTarget, checkReplacement);

fs.writeFileSync('backend/server.js', code, 'utf8');
