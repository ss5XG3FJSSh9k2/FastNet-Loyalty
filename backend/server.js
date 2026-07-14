const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory OTP storage
const otpStore = new Map();

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

// Send Mock OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  // Generate a mock 6-digit OTP
  const otp = '123456';
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[SMS Gateway] Sent OTP ${otp} to phone ${phone}`);
  return res.json({ success: true, message: 'OTP sent successfully (Use 123456 for demo)' });
});

// Verify OTP & Login/Register
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, name, regionId } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  // OTP Validation (default demo OTP 123456 is always accepted)
  const record = otpStore.get(phone);
  if (otp !== '123456' && (!record || record.otp !== otp || record.expiresAt < Date.now())) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  otpStore.delete(phone);

  const users = db.getTable('users');
  let user = users.find(u => u.phone === phone);

  if (!user) {
    // Register new user as CUSTOMER if not found
    if (!name || !regionId) {
      return res.json({ requires_registration: true, phone });
    }
    user = {
      id: 'u-' + generateId(),
      tenant_id: 't1',
      region_id: regionId,
      phone,
      name,
      role: 'CUSTOMER',
      kyc_status: 'APPROVED',
      created_at: new Date().toISOString()
    };
    users.push(user);
    db.saveTable('users', users);
  }

  return res.json({ success: true, user });
});

// Register stockist KYC
app.post('/api/auth/register-stockist', (req, res) => {
  const { phone, name, regionId, idType, idNumber, address } = req.body;
  if (!phone || !name || !regionId || !idType || !idNumber || !address) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const users = db.getTable('users');
  if (users.some(u => u.phone === phone)) {
    return res.status(400).json({ error: 'User with this phone number already exists' });
  }

  const user = {
    id: 'u-' + generateId(),
    tenant_id: 't1',
    region_id: regionId,
    phone,
    name,
    role: 'STOCKIST',
    kyc_status: 'PENDING',
    kyc_details: {
      id_type: idType,
      id_number: idNumber,
      shop_address: address
    },
    created_at: new Date().toISOString()
  };

  users.push(user);
  db.saveTable('users', users);
  return res.json({ success: true, message: 'KYC submitted successfully. Awaiting Admin approval.', user });
});

// ----------------------------------------------------
// PRODUCT & INVENTORY ENDPOINTS
// ----------------------------------------------------

app.get('/api/products', (req, res) => {
  const { regionId, stockistId } = req.query;
  const products = db.getTable('products');
  const inventory = db.getTable('stockist_inventory');

  let filtered = products;
  if (regionId) {
    filtered = filtered.filter(p => p.region_id === regionId);
  }

  // Attach inventory stock if stockistId is supplied
  if (stockistId) {
    filtered = filtered.map(p => {
      const inv = inventory.find(i => i.stockist_id === stockistId && i.product_id === p.id);
      return {
        ...p,
        stock_qty: inv ? inv.stock_qty : 0,
        is_available: inv ? inv.is_available : false
      };
    });
  }

  return res.json(filtered);
});

// Product SKU creation endpoint (§A2)
app.post('/api/products', (req, res) => {
  const { name, price, costPrice, category, initialStock, stockistId, regionId } = req.body;
  if (!name || !price || !category || initialStock === undefined || !stockistId || !regionId) {
    return res.status(400).json({ error: 'Missing product fields' });
  }

  const products = db.getTable('products');
  const productId = 'p-' + generateId();
  
  const newProduct = {
    id: productId,
    tenant_id: 't1',
    region_id: regionId,
    name,
    category,
    price: parseFloat(price),
    cost_price: costPrice ? parseFloat(costPrice) : parseFloat(price) * 0.75,
    description: name + ' added by local stockist',
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  };

  products.push(newProduct);
  db.saveTable('products', products);

  // Add to stockist inventory
  const inventory = db.getTable('stockist_inventory');
  inventory.push({
    stockist_id: stockistId,
    product_id: productId,
    stock_qty: parseInt(initialStock, 10),
    is_available: parseInt(initialStock, 10) > 0
  });
  db.saveTable('stockist_inventory', inventory);

  return res.json({ success: true, product: newProduct });
});

// Search alternative shops having item in stock (§A3)
app.get('/api/products/search-alternatives', (req, res) => {
  const { name, regionId, excludeStockistId } = req.query;
  if (!name || !regionId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const products = db.getTable('products');
  const inventory = db.getTable('stockist_inventory');
  const stockists = db.getTable('stockists');

  const similarProducts = products.filter(p => p.region_id === regionId && p.name.toLowerCase().includes(name.toLowerCase()));
  
  const alternatives = [];
  similarProducts.forEach(p => {
    const invList = inventory.filter(i => i.product_id === p.id && i.stock_qty > 0 && i.stockist_id !== excludeStockistId);
    invList.forEach(inv => {
      const stockist = stockists.find(s => s.id === inv.stockist_id && s.is_active);
      if (stockist) {
        alternatives.push({
          shopId: stockist.id,
          shopName: stockist.name,
          stockQty: inv.stock_qty,
          price: p.price
        });
      }
    });
  });

  return res.json(alternatives);
});

// Verify pickup PIN and complete order (§B4)
app.post('/api/orders/:id/verify-pickup', (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;

  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.pickup_pin !== pin) {
    return res.status(400).json({ error: 'Incorrect pickup verification PIN.' });
  }

  order.status = 'DELIVERED';
  db.saveTable('orders', orders);

  // Sync split payout status if exists
  const splitPayouts = db.getTable('split_payouts');
  const payout = splitPayouts.find(sp => sp.order_id === id);
  if (payout) {
    payout.status = 'PROCESSED_IMMEDIATELY';
    db.saveTable('split_payouts', splitPayouts);
  }

  return res.json({ success: true, order: enrichOrder(order) });
});

// Restock inventory from vendor
app.post('/api/stockists/restock', (req, res) => {
  const { stockistId, items, vendorId } = req.body; // items: [{productId, quantity}], optional vendorId
  if (!stockistId || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid restock parameters' });
  }

  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === stockistId);
  if (!stockist) {
    return res.status(404).json({ error: 'Stockist not found' });
  }

  // Check approved vendors from junction table
  const stockistVendors = db.getTable('stockist_vendors');
  const approved = stockistVendors.filter(sv => sv.stockist_id === stockistId);
  if (approved.length === 0) {
    return res.status(400).json({ error: 'No approved Wholesalers assigned. Please contact Admin.' });
  }

  if (vendorId) {
    const isApproved = approved.some(sv => sv.vendor_id === vendorId);
    if (!isApproved) {
      return res.status(400).json({ error: 'Selected wholesaler is not approved for this store.' });
    }
  }

  const inventory = db.getTable('stockist_inventory');
  items.forEach(item => {
    let inv = inventory.find(i => i.stockist_id === stockistId && i.product_id === item.productId);
    if (inv) {
      inv.stock_qty += parseInt(item.quantity, 10);
      inv.is_available = inv.stock_qty > 0;
    } else {
      inventory.push({
        stockist_id: stockistId,
        product_id: item.productId,
        stock_qty: parseInt(item.quantity, 10),
        is_available: true
      });
    }
  });

  db.saveTable('stockist_inventory', inventory);
  return res.json({ success: true, message: 'Stock updated successfully.' });
});

// ----------------------------------------------------
// STOCKIST ENDPOINTS
// ----------------------------------------------------

app.get('/api/stockists', (req, res) => {
  const { regionId } = req.query;
  const stockists = db.getTable('stockists');
  const filtered = regionId ? stockists.filter(s => s.region_id === regionId && s.is_active) : stockists;

  const orders = db.getTable('orders');
  const enriched = filtered.map(s => {
    const shopOrders = orders.filter(o => o.stockist_id === s.id);
    const finished = shopOrders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));
    const delivered = finished.filter(o => o.status === 'DELIVERED').length;
    const totalFinished = finished.length;

    let reliabilityBadge = 'Active Partner';
    if (totalFinished > 0) {
      const rate = (delivered / totalFinished) * 100;
      if (rate >= 90) {
        reliabilityBadge = 'Highly Reliable (90%+ Fulfilled)';
      } else if (rate >= 80) {
        reliabilityBadge = 'Reliable Partner';
      }
    } else {
      reliabilityBadge = 'New Stockist (Verified)';
    }

    return {
      ...s,
      reliabilityBadge
    };
  });

  return res.json(enriched);
});

app.get('/api/stockists/by-user/:userId', (req, res) => {
  const { userId } = req.params;
  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.user_id === userId);
  if (!stockist) {
    return res.status(404).json({ error: 'Stockist record not found or pending KYC' });
  }
  return res.json(stockist);
});

// Helper for IST Day Boundary
function getISTDateString(date = new Date()) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  return istDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

app.get('/api/stockists/:id/stats', (req, res) => {
  const { id } = req.params;
  const orders = db.getTable('orders').filter(o => o.stockist_id === id);
  const todayStr = getISTDateString();

  const todayOrders = orders.filter(o => getISTDateString(new Date(o.created_at)) === todayStr);
  const todayDelivered = todayOrders.filter(o => o.status === 'DELIVERED');
  
  const today_earnings = todayDelivered.reduce((sum, o) => {
    const enriched = enrichOrder(o);
    return sum + (enriched.stockist_amount || 0);
  }, 0);
  
  const today_order_count = todayDelivered.length;

  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const totalDeliveredValue = deliveredOrders.reduce((sum, o) => {
    const enriched = enrichOrder(o);
    return sum + (enriched.stockist_amount || 0);
  }, 0);
  const avg_order_value = deliveredOrders.length > 0 ? (totalDeliveredValue / deliveredOrders.length) : 0;

  const total_fulfilled = orders.filter(o => o.status === 'DELIVERED').length;
  const total_cancelled = orders.filter(o => o.status === 'CANCELLED').length;

  // Top 5 selling products
  const orderItems = db.getTable('order_items');
  const deliveredOrderIds = new Set(deliveredOrders.map(o => o.id));
  const items = orderItems.filter(oi => deliveredOrderIds.has(oi.order_id));

  const productQuantities = {};
  items.forEach(item => {
    if (!productQuantities[item.product_id]) {
      productQuantities[item.product_id] = { id: item.product_id, name: item.name, qty: 0 };
    }
    productQuantities[item.product_id].qty += item.quantity;
  });

  const top_products = Object.values(productQuantities)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Weekly data (last 7 days trend)
  const weekly_data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const istStr = getISTDateString(d);
    const options = { weekday: 'short', timeZone: 'Asia/Kolkata' };
    const dayName = d.toLocaleDateString('en-US', options);

    const dayOrders = orders.filter(o => o.status === 'DELIVERED' && getISTDateString(new Date(o.created_at)) === istStr);
    const dayEarnings = dayOrders.reduce((sum, o) => {
      const enriched = enrichOrder(o);
      return sum + (enriched.stockist_amount || 0);
    }, 0);

    weekly_data.push({
      day: dayName,
      earnings: Math.round(dayEarnings * 100) / 100
    });
  }

  // Monthly data (last 28 days trend, grouped by 4 weeks)
  const monthly_data = [];
  for (let i = 3; i >= 0; i--) {
    const startOffset = (i + 1) * 7;
    const endOffset = i * 7;
    let weekEarnings = 0;
    
    for (let dayOffset = startOffset - 1; dayOffset >= endOffset; dayOffset--) {
      const d = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
      const istStr = getISTDateString(d);
      const dayOrders = orders.filter(o => o.status === 'DELIVERED' && getISTDateString(new Date(o.created_at)) === istStr);
      weekEarnings += dayOrders.reduce((sum, o) => {
        const enriched = enrichOrder(o);
        return sum + (enriched.stockist_amount || 0);
      }, 0);
    }
    
    monthly_data.push({
      day: `Wk -${i}`,
      earnings: Math.round(weekEarnings * 100) / 100
    });
  }

  return res.json({
    today_earnings,
    today_order_count,
    avg_order_value,
    total_fulfilled,
    total_cancelled,
    top_products,
    weekly_data,
    monthly_data
  });
});

// ----------------------------------------------------
// ORDER & PAYMENT SPLIT ENDPOINTS
// ----------------------------------------------------

// Helper: Settlement Engine (§14)
function calculateSettlement(subtotal, totalProfitMargin, stockistId, regionId) {
  const stockistCommissionRates = db.getTable('stockist_commission_rates');
  const scr = stockistCommissionRates.find(r => r.stockist_id === stockistId);
  const commissionRate = scr ? parseFloat(scr.rate_percent) : 10.00;
  const platformCommission = (subtotal * commissionRate) / 100;

  const pointsEarnConfig = db.getTable('points_earn_config');
  const pecStockist = pointsEarnConfig.find(r => r.stockist_id === stockistId);
  const pecRegion = pointsEarnConfig.find(r => r.region_id === regionId && !r.stockist_id);
  const earnRatePercent = pecStockist ? parseFloat(pecStockist.earn_rate_percent) : (pecRegion ? parseFloat(pecRegion.earn_rate_percent) : 45.0);

  const pointsCredited = Math.round(totalProfitMargin * (earnRatePercent / 100) * 100) / 100;

  return {
    commissionRateUsed: commissionRate,
    earnRateUsed: earnRatePercent,
    platformCommission,
    pointsCredited
  };
}

// Helper: Reverse points if order is cancelled
function reverseOrderPoints(orderId) {
  const ledger = db.getTable('points_ledger');
  const existingEarn = ledger.find(l => l.order_id === orderId && l.type === 'EARN');
  if (existingEarn) {
    const alreadyReversed = ledger.some(l => l.order_id === orderId && l.type === 'REVERSAL');
    if (!alreadyReversed) {
      ledger.push({
        id: 'l-' + generateId(),
        tenant_id: existingEarn.tenant_id,
        region_id: existingEarn.region_id,
        customer_id: existingEarn.customer_id,
        amount: -existingEarn.amount,
        type: 'REVERSAL',
        order_id: orderId,
        description: `Reversal of points earned from Cancelled Order #${orderId.substring(2).toUpperCase()}`,
        created_at: new Date().toISOString(),
        billing_sync_status: 'PENDING'
      });
      db.saveTable('points_ledger', ledger);
    }
  }
}

// Helper: Enrich Order
function enrichOrder(o) {
  if (!o) return null;
  const orderItems = db.getTable('order_items');
  const users = db.getTable('users');
  const splitPayouts = db.getTable('split_payouts');
  
  const items = orderItems.filter(oi => oi.order_id === o.id);
  const customer = users.find(u => u.id === o.customer_id);
  const payout = splitPayouts.find(sp => sp.order_id === o.id);

  const stockistCommissionRates = db.getTable('stockist_commission_rates');
  const scr = stockistCommissionRates.find(r => r.stockist_id === o.stockist_id);
  const commissionRate = scr ? parseFloat(scr.rate_percent) : 10.00;
  const platformCommission = (o.subtotal * commissionRate) / 100;
  const stockistPayout = o.subtotal - platformCommission + o.delivery_fee;
  const platformPayout = platformCommission + o.low_order_fee;

  return {
    ...o,
    items,
    pointsCredited: o.points_credited !== undefined ? o.points_credited : (o.points_credited || 0),
    points_credited: o.points_credited !== undefined ? o.points_credited : (o.points_credited || 0),
    earnRatePercent: o.earn_rate_used !== undefined ? o.earn_rate_used : (o.earn_rate_used || 40),
    earn_rate_used: o.earn_rate_used !== undefined ? o.earn_rate_used : (o.earn_rate_used || 40),
    margin: o.margin !== undefined ? o.margin : (o.margin || (o.subtotal * 0.25).toFixed(1)),
    customer_name: customer ? customer.name : 'Unknown Subscriber',
    customer_phone: customer ? customer.phone : '',
    stockist_amount: payout ? parseFloat(payout.stockist_amount) : stockistPayout,
    platform_amount: payout ? parseFloat(payout.platform_amount) : platformPayout
  };
}

app.post('/api/orders', (req, res) => {
  const { customerId, stockistId, items, fulfillmentType } = req.body; // items: [{productId, quantity}]
  if (!customerId || !stockistId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order request' });
  }

  const users = db.getTable('users');
  const customer = users.find(u => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === stockistId);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });

  const products = db.getTable('products');
  const inventory = db.getTable('stockist_inventory');
  
  let subtotal = 0;
  let totalProfitMargin = 0;
  const orderItems = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Product ${item.productId} not found` });
    }
    const inv = inventory.find(i => i.stockist_id === stockistId && i.product_id === product.id);
    if (!inv || inv.stock_qty < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
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
  }

  // §3: Remove minimum order value and low-order cart fee — for now. Bypassed.

  // §7: Default fulfillment option is pickup, delivery fee is 0 initially.
  const reqFulfillment = fulfillmentType || 'PICKUP';
  const deliveryFee = reqFulfillment === 'DELIVERY' ? (stockist.region_id === 'r2' ? 30.00 : 40.00) : 0.00;
  const lowOrderFee = 0.00; // Removed per §3
  const totalPrice = subtotal + deliveryFee + lowOrderFee;

  // §14: Settlement engine deterministic calculation
  const settlement = calculateSettlement(subtotal, totalProfitMargin, stockistId, customer.region_id);
  const platformCommission = settlement.platformCommission;
  const pointsCredited = settlement.pointsCredited;

  // Stockist Payout = Subtotal - Commission + Delivery Fee
  const stockistPayout = subtotal - platformCommission + deliveryFee;
  const platformPayout = platformCommission + lowOrderFee;

  inventory.forEach(inv => {
    const item = items.find(it => it.productId === inv.product_id && inv.stockist_id === stockistId);
    if (item) {
      inv.stock_qty -= item.quantity;
      inv.is_available = inv.stock_qty > 0;
    }
  });
  db.saveTable('stockist_inventory', inventory);

  const orderId = 'o-' + generateId();
  const order = {
    id: orderId,
    tenant_id: customer.tenant_id,
    region_id: customer.region_id,
    customer_id: customer.id,
    stockist_id: stockistId,
    stockist_name: stockist.name,
    status: 'PENDING',
    subtotal,
    delivery_fee: deliveryFee,
    low_order_fee: lowOrderFee,
    total_price: totalPrice,
    fulfillment_type: reqFulfillment,
    pickup_slot: null,
    pickup_eta_minutes: 10,
    pickup_pin: Math.floor(1000 + Math.random() * 9000).toString(), // Generated Verification PIN (§B4)
    payment_status: 'PAID',
    points_credited: pointsCredited,
    margin: totalProfitMargin,
    earn_rate_used: settlement.earnRateUsed,
    razorpay_order_id: 'rzp_order_' + generateId(),
    razorpay_payment_id: 'rzp_pay_' + generateId(),
    created_at: new Date().toISOString()
  };

  const orders = db.getTable('orders');
  orders.push(order);
  db.saveTable('orders', orders);

  const savedOrderItems = db.getTable('order_items');
  orderItems.forEach(oi => {
    oi.order_id = orderId;
    savedOrderItems.push(oi);
  });
  db.saveTable('order_items', savedOrderItems);

  const splitPayouts = db.getTable('split_payouts');
  splitPayouts.push({
    id: 'sp-' + generateId(),
    order_id: orderId,
    stockist_id: stockistId,
    stockist_amount: stockistPayout,
    platform_amount: platformPayout,
    commission_rate_used: settlement.commissionRateUsed,
    earn_rate_used: settlement.earnRateUsed,
    status: 'PROCESSED_IMMEDIATELY',
    created_at: new Date().toISOString()
  });
  db.saveTable('split_payouts', splitPayouts);

  const pointsLedger = db.getTable('points_ledger');
  pointsLedger.push({
    id: 'l-' + generateId(),
    tenant_id: customer.tenant_id,
    region_id: customer.region_id,
    customer_id: customer.id,
    amount: pointsCredited,
    type: 'EARN',
    order_id: orderId,
    description: `Earned from Order #${orderId.substring(2).toUpperCase()} at ${stockist.name}`,
    created_at: new Date().toISOString()
  });
  db.saveTable('points_ledger', pointsLedger);

  // Anomaly Check
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentOrders = orders.filter(o => 
    o.customer_id === customerId && 
    o.stockist_id === stockistId && 
    o.created_at >= last24h
  );

  if (recentOrders.length >= 3) {
    const anomalyLogs = db.getTable('anomaly_logs');
    anomalyLogs.push({
      id: 'an-' + generateId(),
      tenant_id: customer.tenant_id,
      region_id: customer.region_id,
      customer_id: customerId,
      customer_name: customer.name,
      stockist_id: stockistId,
      stockist_name: stockist.name,
      reason: 'High order frequency detected: customer placed ' + recentOrders.length + ' orders with this stockist in 24 hours.',
      frequency_metric: `${recentOrders.length} orders / 24h`,
      status: 'PENDING',
      created_at: new Date().toISOString()
    });
    db.saveTable('anomaly_logs', anomalyLogs);
  }

  return res.json({
    success: true,
    orderId,
    pointsCredited,
    margin: totalProfitMargin,
    earnRatePercent: settlement.earnRateUsed,
    order,
    razorpay_split: {
      stockist_share: stockistPayout,
      platform_share: platformPayout
    }
  });
});

// Get orders
app.get('/api/orders', (req, res) => {
  const { customerId, stockistId } = req.query;
  const orders = db.getTable('orders');
  let filtered = orders;

  if (customerId) {
    filtered = filtered.filter(o => o.customer_id === customerId);
  }
  if (stockistId) {
    filtered = filtered.filter(o => o.stockist_id === stockistId);
  }

  const orderItems = db.getTable('order_items');
  const users = db.getTable('users');
  const splitPayouts = db.getTable('split_payouts');
  const enriched = filtered.map(o => enrichOrder(o)).reverse(); // Sort newest first

  return res.json(enriched);
});

// Update Order Status
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = status;
  db.saveTable('orders', orders);

  if (status === 'CANCELLED') {
    reverseOrderPoints(id);
  }

  return res.json({ success: true, order: enrichOrder(order) });
});

// PATCH fulfillment endpoint (§7)
app.patch('/api/orders/:id/fulfillment', (req, res) => {
  const { id } = req.params;
  const { fulfillmentType, pickupSlot } = req.body;

  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (fulfillmentType) {
    if (fulfillmentType === 'PICKUP') {
      if (order.fulfillment_type === 'DELIVERY') {
        return res.status(400).json({ error: 'Already switched to delivery. Cannot switch back.' });
      }
      order.fulfillment_type = 'PICKUP';
    } else if (fulfillmentType === 'DELIVERY') {
      if (order.fulfillment_type !== 'DELIVERY') {
        order.fulfillment_type = 'DELIVERY';
        
        const stockists = db.getTable('stockists');
        const stockist = stockists.find(s => s.id === order.stockist_id);
        const deliveryFee = stockist.region_id === 'r2' ? 30.00 : 40.00;

        order.delivery_fee = deliveryFee;
        order.total_price = order.subtotal + deliveryFee + order.low_order_fee;

        // Recalculate splits
        const splitPayouts = db.getTable('split_payouts');
        const payout = splitPayouts.find(sp => sp.order_id === id);
        
        // Settlement calculations
        const settlement = calculateSettlement(order.subtotal, 0, order.stockist_id, order.region_id);
        const stockistPayout = order.subtotal - settlement.platformCommission + deliveryFee;
        const platformPayout = settlement.platformCommission + order.low_order_fee;

        if (payout) {
          payout.stockist_amount = stockistPayout;
          payout.platform_amount = platformPayout;
          db.saveTable('split_payouts', splitPayouts);
        }
      }
    } else {
      return res.status(400).json({ error: 'Invalid parameters.' });
    }
  }

  if (pickupSlot) {
    if (order.fulfillment_type === 'DELIVERY') {
      return res.status(400).json({ error: 'Cannot set pickup slot for delivery orders.' });
    }
    order.pickup_slot = pickupSlot;
  }

  db.saveTable('orders', orders);
  return res.json({ success: true, order: enrichOrder(order) });
});

// Offline sync endpoint
app.post('/api/orders/sync', (req, res) => {
  const { updates } = req.body;
  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ error: 'Invalid sync payload' });
  }

  const orders = db.getTable('orders');
  let syncCount = 0;

  updates.forEach(upd => {
    const order = orders.find(o => o.id === upd.orderId);
    if (order) {
      order.status = upd.status;
      syncCount++;
      if (upd.status === 'CANCELLED') {
        reverseOrderPoints(upd.orderId);
      }
    }
  });

  if (syncCount > 0) {
    db.saveTable('orders', orders);
  }

  return res.json({ success: true, synced_count: syncCount });
});

// ----------------------------------------------------
// POINTS LEDGER & REDEMPTION ENDPOINTS
// ----------------------------------------------------

app.get('/api/ledger/balance/:customerId', (req, res) => {
  const { customerId } = req.params;
  const ledger = db.getTable('points_ledger');
  const customerLedger = ledger.filter(l => l.customer_id === customerId);

  const balance = customerLedger.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  return res.json({ balance: Math.round(balance * 100) / 100 });
});

app.get('/api/ledger/history/:customerId', (req, res) => {
  const { customerId } = req.params;
  const ledger = db.getTable('points_ledger');
  const customerLedger = ledger.filter(l => l.customer_id === customerId).reverse();
  return res.json(customerLedger);
});

// Helper: Get Redemption Description (§2)
function getRedemptionDescription(type, pts) {
  if (type === 'BROADBAND_DISCOUNT') {
    return `Broadband Bill Discount - ₹${pts.toFixed(0)}`;
  }
  if (type === 'BROADBAND_DISCOUNT_50') {
    return 'Broadband Bill Discount - ₹50';
  }
  if (type === 'BROADBAND_DISCOUNT_100') {
    return 'Broadband Bill Discount - ₹100';
  }
  if (type === 'WIFI_TOPUP') {
    return 'WiFi Speed Booster 48h (100 Mbps)';
  }
  if (type === 'DATA_TOPUP') {
    return 'WiFi Data Top-up 10 GB';
  }
  if (type === 'CABLE_RECHARGE') {
    if (pts === 100) return 'Cable TV Basic Pack - 1 Month Free';
    if (pts === 250) return 'Cable TV HD Premium Pack - 1 Month';
    if (pts === 120) return 'Cable TV Kids & Family Bundle';
    return 'Cable TV Recharge Package';
  }
  return 'Redeemed points against Broadband Bill';
}

// Redeem Points (§5)
app.post('/api/ledger/redeem', (req, res) => {
  const { customerId, amount, redemptionType } = req.body;
  if (!customerId || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid redemption parameters' });
  }

  const ALLOWED_REDEMPTION_TYPES = [
    'BROADBAND_DISCOUNT',
    'BROADBAND_DISCOUNT_50',
    'BROADBAND_DISCOUNT_100',
    'WIFI_TOPUP',
    'DATA_TOPUP',
    'CABLE_RECHARGE'
  ];

  if (!redemptionType || !ALLOWED_REDEMPTION_TYPES.includes(redemptionType)) {
    return res.status(400).json({ error: 'Invalid redemption type.' });
  }

  const users = db.getTable('users');
  const customer = users.find(u => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const ledger = db.getTable('points_ledger');
  const customerLedger = ledger.filter(l => l.customer_id === customerId);
  const currentBalance = customerLedger.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  if (currentBalance < parseFloat(amount)) {
    return res.status(400).json({ error: 'Insufficient points balance' });
  }

  const redeemAmount = -Math.abs(parseFloat(amount));
  const ledgerId = 'l-' + generateId();
  const pts = parseFloat(amount);
  const description = getRedemptionDescription(redemptionType, pts);

  ledger.push({
    id: ledgerId,
    tenant_id: customer.tenant_id,
    region_id: customer.region_id,
    customer_id: customer.id,
    amount: redeemAmount,
    type: 'REDEEM',
    redemption_type: redemptionType,
    order_id: null,
    description,
    created_at: new Date().toISOString(),
    billing_sync_status: 'PENDING'
  });
  db.saveTable('points_ledger', ledger);

  return res.json({
    success: true,
    ledgerId,
    remaining_balance: currentBalance + redeemAmount,
    message: 'Points successfully queued for redemption.'
  });
});

// ----------------------------------------------------
// FEEDBACK & REPORT ENDPOINTS (§11)
// ----------------------------------------------------

app.post('/api/feedback', (req, res) => {
  const { reporterId, reporterRole, targetId, targetRole, orderId, rating, reason } = req.body;
  if (!reporterId || !reporterRole || !targetId || !targetRole || !orderId || rating === undefined) {
    return res.status(400).json({ error: 'Reporter, target, order ID, and rating are required.' });
  }

  const feedback = db.getTable('feedback_reports');
  const newFeedback = {
    id: 'fb-' + generateId(),
    reporter_id: reporterId,
    reporter_role: reporterRole,
    target_id: targetId,
    target_role: targetRole,
    order_id: orderId,
    rating: parseInt(rating, 10),
    reason: reason || '',
    created_at: new Date().toISOString()
  };

  feedback.push(newFeedback);
  db.saveTable('feedback_reports', feedback);
  return res.json({ success: true, feedback: newFeedback });
});

app.get('/api/admin/feedback', (req, res) => {
  const feedback = db.getTable('feedback_reports');
  const users = db.getTable('users');
  const stockists = db.getTable('stockists');

  const enriched = feedback.map(fb => {
    let reporterName = 'Unknown';
    let targetName = 'Unknown';

    if (fb.reporter_role === 'CUSTOMER') {
      const u = users.find(x => x.id === fb.reporter_id);
      reporterName = u ? u.name : 'Unknown Customer';
    } else {
      const s = stockists.find(x => x.id === fb.reporter_id);
      reporterName = s ? s.name : 'Unknown Shopkeeper';
    }

    if (fb.target_role === 'CUSTOMER') {
      const u = users.find(x => x.id === fb.target_id);
      targetName = u ? u.name : 'Unknown Customer';
    } else {
      const s = stockists.find(x => x.id === fb.target_id);
      targetName = s ? s.name : 'Unknown Shopkeeper';
    }

    return {
      ...fb,
      reporter_name: reporterName,
      target_name: targetName
    };
  }).reverse();

  return res.json(enriched);
});

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

app.get('/api/admin/kyc-queue', (req, res) => {
  const users = db.getTable('users');
  const pending = users.filter(u => u.role === 'STOCKIST' && u.kyc_status === 'PENDING');
  return res.json(pending);
});

app.post('/api/admin/approve-kyc', (req, res) => {
  const { userId, vendorId, deliveryRadius, minOrderValue } = req.body;
  if (!userId || !vendorId) {
    return res.status(400).json({ error: 'User ID and Vendor ID are required' });
  }

  const users = db.getTable('users');
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  users[userIndex].kyc_status = 'APPROVED';
  db.saveTable('users', users);

  const user = users[userIndex];
  const stockists = db.getTable('stockists');
  const newStockist = {
    id: 's-' + generateId(),
    tenant_id: user.tenant_id,
    region_id: user.region_id,
    user_id: user.id,
    name: user.name + ' Store',
    vendor_id: vendorId, // backward compatibility
    delivery_radius_km: parseFloat(deliveryRadius) || 5.0,
    min_order_value: 0, // Bypassed min order fee
    is_active: true,
    created_at: new Date().toISOString()
  };
  
  stockists.push(newStockist);
  db.saveTable('stockists', stockists);

  // Initialize junction table (§12)
  const stockistVendors = db.getTable('stockist_vendors');
  stockistVendors.push({
    stockist_id: newStockist.id,
    vendor_id: vendorId,
    approved_at: new Date().toISOString()
  });
  db.saveTable('stockist_vendors', stockistVendors);

  const products = db.getTable('products').filter(p => p.region_id === user.region_id);
  const inventory = db.getTable('stockist_inventory');
  products.forEach(p => {
    inventory.push({
      stockist_id: newStockist.id,
      product_id: p.id,
      stock_qty: 0,
      is_available: false
    });
  });
  db.saveTable('stockist_inventory', inventory);

  return res.json({ success: true, stockist: newStockist });
});

app.get('/api/admin/commission-rates', (req, res) => {
  const rates = db.getTable('commission_rates');
  return res.json(rates);
});

app.post('/api/admin/commission-rates', (req, res) => {
  const { category, ratePercent, regionId } = req.body;
  if (!category || ratePercent === undefined || !regionId) {
    return res.status(400).json({ error: 'Category, regionId and ratePercent are required' });
  }

  const rates = db.getTable('commission_rates');
  const idx = rates.findIndex(r => r.region_id === regionId && r.category === category);
  
  if (idx > -1) {
    rates[idx].rate_percent = parseFloat(ratePercent);
  } else {
    rates.push({
      id: 'cr-' + generateId(),
      tenant_id: 't1',
      region_id: regionId,
      category,
      rate_percent: parseFloat(ratePercent),
      created_at: new Date().toISOString()
    });
  }

  db.saveTable('commission_rates', rates);
  return res.json({ success: true, rates });
});

// Per-stockist commission endpoints (§9)
app.get('/api/admin/stockist-commission-rates', (req, res) => {
  const rates = db.getTable('stockist_commission_rates');
  return res.json(rates);
});

app.post('/api/admin/stockist-commission-rates', (req, res) => {
  const { stockistId, ratePercent } = req.body;
  if (!stockistId || ratePercent === undefined) {
    return res.status(400).json({ error: 'stockistId and ratePercent are required' });
  }

  const rates = db.getTable('stockist_commission_rates');
  const idx = rates.findIndex(r => r.stockist_id === stockistId);

  if (idx > -1) {
    rates[idx].rate_percent = parseFloat(ratePercent);
  } else {
    rates.push({
      id: 'scr-' + generateId(),
      stockist_id: stockistId,
      rate_percent: parseFloat(ratePercent),
      created_at: new Date().toISOString()
    });
  }

  db.saveTable('stockist_commission_rates', rates);
  return res.json({ success: true, rates });
});

// Points earn config endpoints (§10)
app.get('/api/admin/points-earn-config', (req, res) => {
  const configs = db.getTable('points_earn_config');
  return res.json(configs);
});

app.post('/api/admin/points-earn-config', (req, res) => {
  const { regionId, stockistId, earnRatePercent } = req.body;
  if (earnRatePercent === undefined) {
    return res.status(400).json({ error: 'earnRatePercent is required' });
  }

  const configs = db.getTable('points_earn_config');
  let idx = -1;
  if (stockistId) {
    idx = configs.findIndex(c => c.stockist_id === stockistId);
  } else if (regionId) {
    idx = configs.findIndex(c => c.region_id === regionId && !c.stockist_id);
  } else {
    return res.status(400).json({ error: 'Either regionId or stockistId is required' });
  }

  const updatedConfig = {
    id: idx > -1 ? configs[idx].id : 'pec-' + generateId(),
    region_id: regionId || null,
    stockist_id: stockistId || null,
    earn_rate_percent: parseFloat(earnRatePercent),
    created_at: idx > -1 ? configs[idx].created_at : new Date().toISOString()
  };

  if (idx > -1) {
    configs[idx] = updatedConfig;
  } else {
    configs.push(updatedConfig);
  }

  db.saveTable('points_earn_config', configs);
  return res.json({ success: true, configs });
});

// Approved vendors junction management (§12)
app.post('/api/admin/stockist-vendors', (req, res) => {
  const { stockistId, vendorId } = req.body;
  if (!stockistId || !vendorId) {
    return res.status(400).json({ error: 'stockistId and vendorId are required' });
  }

  const stockistVendors = db.getTable('stockist_vendors');
  const exists = stockistVendors.some(sv => sv.stockist_id === stockistId && sv.vendor_id === vendorId);

  if (!exists) {
    stockistVendors.push({
      stockist_id: stockistId,
      vendor_id: vendorId,
      approved_at: new Date().toISOString()
    });
    db.saveTable('stockist_vendors', stockistVendors);
  }

  return res.json({ success: true, stockistVendors });
});

app.get('/api/stockists/:stockistId/vendors', (req, res) => {
  const { stockistId } = req.params;
  const stockistVendors = db.getTable('stockist_vendors');
  const vendors = db.getTable('vendors');

  const approvedIds = stockistVendors
    .filter(sv => sv.stockist_id === stockistId)
    .map(sv => sv.vendor_id);

  const approvedVendors = vendors.filter(v => approvedIds.includes(v.id));
  return res.json(approvedVendors);
});

app.get('/api/admin/anomalies', (req, res) => {
  const logs = db.getTable('anomaly_logs');
  return res.json(logs);
});

app.post('/api/admin/anomalies/:id/flag', (req, res) => {
  const { id } = req.params;
  const logs = db.getTable('anomaly_logs');
  const idx = logs.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Anomaly log not found.' });

  logs[idx].status = 'FLAGGED';
  db.saveTable('anomaly_logs', logs);
  return res.json({ success: true, log: logs[idx] });
});

app.get('/api/admin/redemptions', (req, res) => {
  const ledger = db.getTable('points_ledger');
  const users = db.getTable('users');

  const redemptions = ledger
    .filter(l => l.type === 'REDEEM')
    .map(l => {
      const user = users.find(u => u.id === l.customer_id);
      return {
        ...l,
        customer_name: user ? user.name : 'Unknown Customer',
        customer_phone: user ? user.phone : ''
      };
    })
    .reverse();

  return res.json(redemptions);
});

app.post('/api/admin/complete-redemption', (req, res) => {
  const { ledgerId } = req.body;
  if (!ledgerId) return res.status(400).json({ error: 'Ledger ID required' });

  const ledger = db.getTable('points_ledger');
  const idx = ledger.findIndex(l => l.id === ledgerId);
  if (idx === -1) return res.status(404).json({ error: 'Ledger entry not found' });

  ledger[idx].billing_sync_status = 'SYNCED';
  db.saveTable('points_ledger', ledger);
  return res.json({ success: true, entry: ledger[idx] });
});

app.get('/api/admin/vendors', (req, res) => {
  const vendors = db.getTable('vendors');
  return res.json(vendors);
});

app.post('/api/admin/vendors', (req, res) => {
  const { name, regionId } = req.body;
  if (!name || !regionId) return res.status(400).json({ error: 'Name and regionId required' });

  const vendors = db.getTable('vendors');
  const newVendor = {
    id: 'v-' + generateId(),
    tenant_id: 't1',
    region_id: regionId,
    name,
    created_at: new Date().toISOString()
  };
  vendors.push(newVendor);
  db.saveTable('vendors', vendors);
  return res.json({ success: true, vendor: newVendor });
});

// Reset DB
app.post('/api/admin/reset-db', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const DB_PATH = path.join(__dirname, 'db.json');
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  const fresh = db.read();
  return res.json({ success: true, message: 'Database reset successfully.', state: fresh });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Backend Server] ISP-Commerce Loyalty API listening on port ${PORT}`);
});
