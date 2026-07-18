const express = require('express');
const cors = require('cors');
const db = require('./db');
const cfg = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory OTP storage
const otpStore = new Map();

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper for IST Day Boundary
function getISTDateString(date = new Date()) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  return istDate.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// Helper: append a payment ledger event (append-only audit)
function appendPaymentEvent(orderId, eventType, amount, metadata = {}) {
  const ledger = db.getTable('payment_ledger');
  ledger.push({
    id: 'pl-' + generateId(),
    order_id: orderId,
    event_type: eventType,
    amount,
    metadata,
    created_at: new Date().toISOString()
  });
  db.saveTable('payment_ledger', ledger);
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------

// Send Mock OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  const otp = '123456';
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[SMS Gateway] Sent OTP ${otp} to phone ${phone}`);
  return res.json({ success: true, message: 'OTP sent successfully (Use 123456 for demo)' });
});

// Verify OTP & Login
app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const record = otpStore.get(phone);
  if (otp !== '123456' && (!record || record.otp !== otp || record.expiresAt < Date.now())) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  otpStore.delete(phone);

  const users = db.getTable('users');
  const user = users.find(u => u.phone === phone);

  if (!user) {
    return res.json({ requires_registration: true, phone });
  }

  return res.json({ success: true, user });
});

// Register new Customer
app.post('/api/auth/register-customer', (req, res) => {
  const { phone, name, regionId, address } = req.body;
  if (!phone || !name || !regionId) {
    return res.status(400).json({ error: 'Name, phone, and region are required' });
  }

  const users = db.getTable('users');
  if (users.some(u => u.phone === phone)) {
    return res.status(400).json({ error: 'An account with this phone number already exists' });
  }

  const user = {
    id: 'u-' + generateId(),
    tenant_id: 't1',
    region_id: regionId,
    phone,
    name,
    role: 'CUSTOMER',
    kyc_status: 'APPROVED',
    no_show_count: 0,
    address: address || '',
    created_at: new Date().toISOString()
  };

  users.push(user);
  db.saveTable('users', users);
  return res.json({ success: true, user });
});

// Register new Stockist (PENDING KYC)
app.post('/api/auth/register-stockist', (req, res) => {
  const { phone, name, shopName, regionId, idType, idNumber, address } = req.body;
  if (!phone || !name || !shopName || !regionId || !idType || !idNumber || !address) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const users = db.getTable('users');
  if (users.some(u => u.phone === phone)) {
    return res.status(400).json({ error: 'An account with this phone number already exists' });
  }

  const user = {
    id: 'u-' + generateId(),
    tenant_id: 't1',
    region_id: regionId,
    phone,
    name,
    role: 'STOCKIST',
    kyc_status: 'PENDING',
    no_show_count: 0,
    kyc_details: {
      id_type: idType,
      id_number: idNumber,
      shop_name: shopName,
      shop_address: address
    },
    address,
    created_at: new Date().toISOString()
  };

  users.push(user);
  db.saveTable('users', users);
  return res.json({
    success: true,
    message: 'Registration submitted. Awaiting admin approval.',
    user
  });
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
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60'
  };

  products.push(newProduct);
  db.saveTable('products', products);

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
        alternatives.push({ shopId: stockist.id, shopName: stockist.name, stockQty: inv.stock_qty, price: p.price });
      }
    });
  });

  return res.json(alternatives);
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
      if (rate >= 90) reliabilityBadge = 'Highly Reliable (90%+ Fulfilled)';
      else if (rate >= 80) reliabilityBadge = 'Reliable Partner';
    } else {
      reliabilityBadge = 'New Stockist (Verified)';
    }

    return { ...s, reliabilityBadge };
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

  const total_fulfilled = deliveredOrders.length;
  const total_cancelled = orders.filter(o => o.status === 'CANCELLED').length;

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

  const top_products = Object.values(productQuantities).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const weekly_data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const istStr = getISTDateString(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' });
    const dayOrders = orders.filter(o => o.status === 'DELIVERED' && getISTDateString(new Date(o.created_at)) === istStr);
    const dayEarnings = dayOrders.reduce((sum, o) => sum + (enrichOrder(o).stockist_amount || 0), 0);
    weekly_data.push({ day: dayName, earnings: Math.round(dayEarnings * 100) / 100 });
  }

  const monthly_data = [];
  for (let i = 3; i >= 0; i--) {
    const startOffset = (i + 1) * 7;
    const endOffset = i * 7;
    let weekEarnings = 0;
    for (let dayOffset = startOffset - 1; dayOffset >= endOffset; dayOffset--) {
      const d = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
      const istStr = getISTDateString(d);
      const dayOrders = orders.filter(o => o.status === 'DELIVERED' && getISTDateString(new Date(o.created_at)) === istStr);
      weekEarnings += dayOrders.reduce((sum, o) => sum + (enrichOrder(o).stockist_amount || 0), 0);
    }
    monthly_data.push({ day: `Wk -${i}`, earnings: Math.round(weekEarnings * 100) / 100 });
  }

  // COD commission outstanding for this stockist
  const codLedger = db.getTable('cod_commission_ledger');
  const cod_commission_outstanding = codLedger
    .filter(e => e.stockist_id === id && !e.settled)
    .reduce((sum, e) => sum + e.amount_owed, 0);

  return res.json({
    today_earnings,
    today_order_count,
    avg_order_value,
    total_fulfilled,
    total_cancelled,
    top_products,
    weekly_data,
    monthly_data,
    cod_commission_outstanding: Math.round(cod_commission_outstanding * 100) / 100
  });
});

// Restock inventory
app.post('/api/stockists/restock', (req, res) => {
  const { stockistId, items, vendorId } = req.body;
  if (!stockistId || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid restock parameters' });
  }

  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === stockistId);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });

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
      inventory.push({ stockist_id: stockistId, product_id: item.productId, stock_qty: parseInt(item.quantity, 10), is_available: true });
    }
  });

  db.saveTable('stockist_inventory', inventory);
  return res.json({ success: true, message: 'Stock updated successfully.' });
});

// ----------------------------------------------------
// ORDER & PAYMENT SPLIT ENDPOINTS
// ----------------------------------------------------

// Helper: Settlement Engine
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

  return { commissionRateUsed: commissionRate, earnRateUsed: earnRatePercent, platformCommission, pointsCredited };
}

// Helper: Reverse points if order is cancelled (only if points were already credited)
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
  const stockistPayout = o.subtotal - platformCommission + (o.delivery_fee || 0);
  const platformPayout = platformCommission + (o.low_order_fee || 0);

  return {
    ...o,
    items,
    pointsCredited: o.points_credited !== undefined ? o.points_credited : 0,
    points_credited: o.points_credited !== undefined ? o.points_credited : 0,
    earnRatePercent: o.earn_rate_used !== undefined ? o.earn_rate_used : 40,
    earn_rate_used: o.earn_rate_used !== undefined ? o.earn_rate_used : 40,
    margin: o.margin !== undefined ? o.margin : (o.subtotal * 0.25),
    customer_name: customer ? customer.name : 'Unknown Subscriber',
    customer_phone: customer ? customer.phone : '',
    stockist_amount: payout ? parseFloat(payout.stockist_amount) : stockistPayout,
    platform_amount: payout ? parseFloat(payout.platform_amount) : platformPayout
  };
}

// Helper: Run fraud detection scoring after an order is created
function runFraudDetection(order, customer) {
  const orders = db.getTable('orders');
  const allCustomerOrders = orders.filter(o => o.customer_id === customer.id);
  const rulesFired = [];
  const metricValues = {};

  // Rule 1: Repeat-pair frequency vs. region average
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentPairOrders = allCustomerOrders.filter(o => o.stockist_id === order.stockist_id && o.created_at >= last24h);
  const allRegionPairs = orders.filter(o => o.region_id === customer.region_id && o.created_at >= last24h);
  const uniquePairs = {};
  allRegionPairs.forEach(o => {
    const key = `${o.customer_id}:${o.stockist_id}`;
    uniquePairs[key] = (uniquePairs[key] || 0) + 1;
  });
  const pairCounts = Object.values(uniquePairs);
  const regionAvg = pairCounts.length > 0 ? pairCounts.reduce((s, v) => s + v, 0) / pairCounts.length : 1;
  metricValues.pair_count = recentPairOrders.length;
  metricValues.region_avg = Math.round(regionAvg * 100) / 100;
  if (recentPairOrders.length >= cfg.REPEAT_PAIR_MULTIPLIER * Math.max(regionAvg, 1)) {
    rulesFired.push('REPEAT_PAIR');
  }

  // Rule 2: Rapid cancel loops
  const rapidWindow = new Date(Date.now() - cfg.RAPID_CANCEL_WINDOW_MINUTES * 60 * 1000).toISOString();
  const recentCancels = allCustomerOrders.filter(o => o.status === 'CANCELLED' && o.created_at >= rapidWindow);
  metricValues.recent_cancels = recentCancels.length;
  if (recentCancels.length >= cfg.RAPID_CANCEL_THRESHOLD) {
    rulesFired.push('RAPID_CANCEL_LOOP');
  }

  // Rule 3: Points velocity vs. region (90th-percentile approximation — high earner)
  const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const pointsLedger = db.getTable('points_ledger');
  const customerPts7d = pointsLedger.filter(l => l.customer_id === customer.id && l.type === 'EARN' && l.created_at >= last7d)
    .reduce((s, l) => s + l.amount, 0);
  const regionCustomers = db.getTable('users').filter(u => u.region_id === customer.region_id && u.role === 'CUSTOMER');
  const allEarnings = regionCustomers.map(u =>
    pointsLedger.filter(l => l.customer_id === u.id && l.type === 'EARN' && l.created_at >= last7d).reduce((s, l) => s + l.amount, 0)
  ).sort((a, b) => a - b);
  const p90 = allEarnings[Math.floor(allEarnings.length * 0.9)] || 0;
  metricValues.points_7d = Math.round(customerPts7d * 100) / 100;
  metricValues.region_p90_pts = Math.round(p90 * 100) / 100;
  if (allEarnings.length >= 5 && customerPts7d > p90 * 2) {
    rulesFired.push('POINTS_VELOCITY');
  }

  // Rule 4: New-account burst
  const accountAgeMs = Date.now() - new Date(customer.created_at).getTime();
  const accountAgeHours = accountAgeMs / (1000 * 60 * 60);
  const recentOrderCount = allCustomerOrders.filter(o => o.created_at >= new Date(customer.created_at).toISOString()).length;
  metricValues.account_age_hours = Math.round(accountAgeHours * 10) / 10;
  metricValues.orders_since_signup = recentOrderCount;
  if (accountAgeHours < cfg.ACCOUNT_BURST_HOURS && recentOrderCount >= cfg.ACCOUNT_BURST_ORDER_THRESHOLD) {
    rulesFired.push('NEW_ACCOUNT_BURST');
  }

  // Rule 5: Self-dealing — address overlap between customer and stockist
  const stockists = db.getTable('stockists');
  const users = db.getTable('users');
  const stockistUser = users.find(u => u.id === (stockists.find(s => s.id === order.stockist_id) || {}).user_id);
  const custAddr = (customer.address || '').toLowerCase().trim();
  const stkAddr = (stockistUser ? stockistUser.address || '' : '').toLowerCase().trim();
  if (custAddr.length > 4 && stkAddr.length > 4 && (custAddr.includes(stkAddr) || stkAddr.includes(custAddr))) {
    rulesFired.push('SELF_DEALING');
    metricValues.customer_address = customer.address;
    metricValues.stockist_address = stockistUser ? stockistUser.address : '';
  }

  if (rulesFired.length > 0) {
    const anomalyLogs = db.getTable('anomaly_logs');
    anomalyLogs.push({
      id: 'an-' + generateId(),
      tenant_id: customer.tenant_id,
      region_id: customer.region_id,
      customer_id: customer.id,
      customer_name: customer.name,
      stockist_id: order.stockist_id,
      stockist_name: order.stockist_name,
      order_id: order.id,
      rules_fired: rulesFired,
      metric_values: metricValues,
      reason: `Fraud rules fired: ${rulesFired.join(', ')}`,
      status: 'PENDING',
      dismissed: false,
      dismiss_reason: null,
      investigated: false,
      created_at: new Date().toISOString()
    });
    db.saveTable('anomaly_logs', anomalyLogs);
  }
}

// POST /api/orders — multi-store aware, slot-required, HELD payment, CONFIRMING state
app.post('/api/orders', (req, res) => {
  // Supports both old format { customerId, stockistId, items, fulfillmentType }
  // and new format { customerId, stores: [{ stockistId, items, pickupSlot }], fulfillmentType, paymentMethod }
  const { customerId, fulfillmentType, paymentMethod } = req.body;
  let stores = req.body.stores;

  // Backwards-compat: if old single-store format
  if (!stores && req.body.stockistId && req.body.items) {
    stores = [{ stockistId: req.body.stockistId, items: req.body.items, pickupSlot: req.body.pickupSlot || null }];
  }

  if (!customerId || !stores || stores.length === 0) {
    return res.status(400).json({ error: 'Invalid order request' });
  }

  const users = db.getTable('users');
  const customer = users.find(u => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const reqFulfillment = fulfillmentType || 'PICKUP';

  // §C9: multi-store cart forces PICKUP
  if (stores.length > 1 && reqFulfillment === 'DELIVERY') {
    return res.status(400).json({ error: 'Multi-store orders are pickup only. Please switch to Store Pickup.' });
  }

  // §E13: pickup orders require a slot per store
  if (reqFulfillment === 'PICKUP') {
    for (const store of stores) {
      if (!store.pickupSlot) {
        return res.status(400).json({ error: `Pickup slot is required for store order. Please select a time slot.` });
      }
    }
  }

  // prepaid-pickup restriction check for excessive no-shows
  if (reqFulfillment === 'PICKUP' && (customer.prepaid_pickup_restricted || (customer.no_show_count || 0) >= cfg.MAX_NOSHOWS_BEFORE_RESTRICTION)) {
    return res.status(400).json({ error: 'Prepaid pickup is restricted due to excessive no-shows. Please choose Home Delivery (COD).' });
  }

  const stockistsTable = db.getTable('stockists');
  const products = db.getTable('products');
  const inventory = db.getTable('stockist_inventory');
  const now = new Date();
  const cancelDeadline = new Date(now.getTime() + cfg.CANCEL_WINDOW_MINUTES * 60 * 1000).toISOString();
  const cartId = 'cart-' + generateId();
  const createdOrders = [];

  for (const storeEntry of stores) {
    const { stockistId, items, pickupSlot } = storeEntry;
    if (!stockistId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Each store entry must have a stockistId and items' });
    }

    const stockist = stockistsTable.find(s => s.id === stockistId);
    if (!stockist) return res.status(404).json({ error: `Stockist ${stockistId} not found` });

    let subtotal = 0;
    let totalProfitMargin = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
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

    const deliveryFee = reqFulfillment === 'DELIVERY' ? (cfg.DELIVERY_FEE_BY_REGION[stockist.region_id] || 40.00) : 0.00;
    const totalPrice = subtotal + deliveryFee;

    const settlement = calculateSettlement(subtotal, totalProfitMargin, stockistId, customer.region_id);
    const platformCommission = settlement.platformCommission;
    const stockistPayout = subtotal - platformCommission + deliveryFee;
    const platformPayout = platformCommission;

    // Determine payment status
    // Pickup = UPI → HELD. Delivery COD = COD. Delivery UPI = HELD.
    const effectivePaymentMethod = paymentMethod || (reqFulfillment === 'PICKUP' ? 'UPI' : 'COD');
    const paymentStatus = effectivePaymentMethod === 'COD' ? 'COD' : 'HELD';

    // Deduct stock
    inventory.forEach(inv => {
      const item = items.find(it => it.productId === inv.product_id && inv.stockist_id === stockistId);
      if (item) {
        inv.stock_qty -= item.quantity;
        inv.is_available = inv.stock_qty > 0;
      }
    });

    const orderId = 'o-' + generateId();
    const order = {
      id: orderId,
      cart_id: cartId,
      tenant_id: customer.tenant_id,
      region_id: customer.region_id,
      customer_id: customer.id,
      stockist_id: stockistId,
      stockist_name: stockist.name,
      status: 'CONFIRMING',          // §F17: holds for cancel window
      subtotal,
      delivery_fee: deliveryFee,
      low_order_fee: 0,
      total_price: totalPrice,
      fulfillment_type: reqFulfillment,
      pickup_slot: reqFulfillment === 'PICKUP' ? pickupSlot : null,
      pickup_eta_minutes: stockist.prep_eta_minutes || cfg.DEFAULT_PREP_ETA_MINUTES,
      pickup_pin: Math.floor(1000 + Math.random() * 9000).toString(),
      payment_status: paymentStatus,
      payment_method: effectivePaymentMethod,
      points_credited: settlement.pointsCredited,            // §REGULATORY: points only credited to ledger on DELIVERED
      margin: totalProfitMargin,
      earn_rate_used: settlement.earnRateUsed,
      cancel_deadline: cancelDeadline,
      no_show_count: 0,
      reschedule_used: false,
      razorpay_order_id: 'rzp_order_' + generateId(),
      razorpay_payment_id: 'rzp_pay_' + generateId(),
      split_released: false,
      created_at: now.toISOString()
    };

    const orders = db.getTable('orders');
    orders.push(order);
    db.saveTable('orders', orders);

    const savedOrderItems = db.getTable('order_items');
    orderItems.forEach(oi => { oi.order_id = orderId; savedOrderItems.push(oi); });
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
      status: paymentStatus === 'HELD' ? 'HELD' : 'PENDING_COD',
      created_at: now.toISOString()
    });
    db.saveTable('split_payouts', splitPayouts);

    // Payment ledger event
    appendPaymentEvent(orderId, paymentStatus === 'COD' ? 'COD_ORDER_CREATED' : 'HELD', totalPrice, {
      method: effectivePaymentMethod,
      stockist_share: stockistPayout,
      platform_share: platformPayout
    });

    // COD commission accrual
    if (paymentStatus === 'COD') {
      const codLedger = db.getTable('cod_commission_ledger');
      codLedger.push({
        id: 'cod-' + generateId(),
        stockist_id: stockistId,
        order_id: orderId,
        amount_owed: platformCommission,
        settled: false,
        created_at: now.toISOString()
      });
      db.saveTable('cod_commission_ledger', codLedger);
      appendPaymentEvent(orderId, 'COD_COMMISSION_ACCRUED', platformCommission, { stockist_id: stockistId });
    }

    // Fraud detection
    runFraudDetection(order, customer);

    createdOrders.push(enrichOrder(order));
  }

  db.saveTable('stockist_inventory', inventory);

  return res.json({
    success: true,
    cart_id: cartId,
    orders: createdOrders,
    // Backwards compat: expose first order's id/points for single-store clients
    orderId: createdOrders[0].id,
    pointsCredited: createdOrders.reduce((sum, o) => sum + (o.points_credited || 0), 0),
    totalPointsCredited: createdOrders.reduce((sum, o) => sum + (o.points_credited || 0), 0),
    margin: createdOrders[0].margin,
    earnRatePercent: createdOrders[0].earn_rate_used,
    order: createdOrders[0]
  });
});

// Cancel an order — enforces cancel window
app.post('/api/orders/:id/cancel', (req, res) => {
  const { id } = req.params;
  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (['CANCELLED', 'DELIVERED'].includes(order.status)) {
    return res.status(400).json({ error: 'Order is already completed or cancelled' });
  }

  const now = new Date();
  const deadline = new Date(order.cancel_deadline || order.created_at);
  if (now > deadline && order.status !== 'CONFIRMING') {
    return res.status(400).json({
      error: 'Cancellation window has closed. You can no longer cancel this order.',
      code: 'CANCEL_WINDOW_CLOSED'
    });
  }

  order.status = 'CANCELLED';

  // Refund flow — never credits points
  if (order.payment_status === 'HELD') {
    const splitPayouts = db.getTable('split_payouts');
    const payout = splitPayouts.find(sp => sp.order_id === id);
    const platformCommission = payout ? parseFloat(payout.platform_amount) : 0;
    const refundAmount = order.total_price - platformCommission;

    order.payment_status = 'REFUND_INITIATED';
    appendPaymentEvent(id, 'REFUND_INITIATED', refundAmount, { reason: 'Customer cancellation', commission_retained: platformCommission });

    // Simulate immediate refund completion
    order.payment_status = 'REFUNDED';
    appendPaymentEvent(id, 'REFUNDED', refundAmount, { net_refund: refundAmount });
  }

  // Record no-show / late cancel on customer profile
  const users = db.getTable('users');
  const custIdx = users.findIndex(u => u.id === order.customer_id);
  if (custIdx > -1) {
    if (!users[custIdx].no_show_count) users[custIdx].no_show_count = 0;
  }

  db.saveTable('orders', orders);
  db.saveTable('users', users);

  // Reverse any points that may have been credited (safety guard — should be 0 per regulatory constraint)
  reverseOrderPoints(id);

  return res.json({ success: true, order: enrichOrder(order) });
});

// No-show action: RESCHEDULE or CANCEL
app.post('/api/orders/:id/noshw-action', (req, res) => {
  const { id } = req.params;
  const { action, newSlot } = req.body;

  if (!['RESCHEDULE', 'CANCEL'].includes(action)) {
    return res.status(400).json({ error: 'action must be RESCHEDULE or CANCEL' });
  }

  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (action === 'RESCHEDULE') {
    if (order.reschedule_used) {
      return res.status(400).json({ error: 'Reschedule already used. You may only reschedule once.' });
    }
    if (!newSlot) {
      return res.status(400).json({ error: 'newSlot is required for reschedule' });
    }
    order.pickup_slot = newSlot;
    order.reschedule_used = true;
    order.status = 'READY_FOR_PICKUP'; // Reset to allow new pickup window
    db.saveTable('orders', orders);
    return res.json({ success: true, order: enrichOrder(order) });
  }

  if (action === 'CANCEL') {
    order.status = 'CANCELLED';

    // Refund minus commission
    if (order.payment_status === 'HELD') {
      const splitPayouts = db.getTable('split_payouts');
      const payout = splitPayouts.find(sp => sp.order_id === id);
      const platformCommission = payout ? parseFloat(payout.platform_amount) : 0;
      const refundAmount = order.total_price - platformCommission;

      order.payment_status = 'REFUNDED';
      appendPaymentEvent(id, 'REFUND_INITIATED', refundAmount, { reason: 'No-show auto-cancel', commission_retained: platformCommission });
      appendPaymentEvent(id, 'REFUNDED', refundAmount, {});
    }

    // Record no-show on customer profile
    const users = db.getTable('users');
    const custIdx = users.findIndex(u => u.id === order.customer_id);
    if (custIdx > -1) {
      users[custIdx].no_show_count = (users[custIdx].no_show_count || 0) + 1;
      if (users[custIdx].no_show_count >= cfg.MAX_NOSHOWS_BEFORE_RESTRICTION) {
        users[custIdx].prepaid_pickup_restricted = true;
      }
    }
    db.saveTable('users', users);

    db.saveTable('orders', orders);
    reverseOrderPoints(id);
    return res.json({ success: true, order: enrichOrder(order) });
  }
});

// Verify pickup PIN and complete order
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

  // §REGULATORY: Points credited only on delivery confirmation
  _creditPointsOnDelivery(order);

  const splitPayouts = db.getTable('split_payouts');
  const payout = splitPayouts.find(sp => sp.order_id === id);
  if (payout) {
    payout.status = 'PROCESSED_IMMEDIATELY';
    db.saveTable('split_payouts', splitPayouts);
  }

  return res.json({ success: true, order: enrichOrder(order) });
});

// Internal: credit points when order is delivered (idempotent)
function _creditPointsOnDelivery(order) {
  const ledger = db.getTable('points_ledger');
  const alreadyEarned = ledger.some(l => l.order_id === order.id && l.type === 'EARN');
  if (alreadyEarned) return; // idempotent

  if (!order.points_credited || order.points_credited === 0) return; // no points to credit

  const users = db.getTable('users');
  const customer = users.find(u => u.id === order.customer_id);
  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === order.stockist_id);

  ledger.push({
    id: 'l-' + generateId(),
    tenant_id: order.tenant_id,
    region_id: order.region_id,
    customer_id: order.customer_id,
    amount: order.points_credited,
    type: 'EARN',
    order_id: order.id,
    description: `Earned from Order #${order.id.substring(2).toUpperCase()} at ${stockist ? stockist.name : 'Store'}`,
    created_at: new Date().toISOString(),
    billing_sync_status: 'PENDING'
  });
  db.saveTable('points_ledger', ledger);
}

// Get orders
app.get('/api/orders', (req, res) => {
  const { customerId, stockistId } = req.query;
  const orders = db.getTable('orders');
  let filtered = orders;

  if (customerId) filtered = filtered.filter(o => o.customer_id === customerId);
  if (stockistId) filtered = filtered.filter(o => o.stockist_id === stockistId);

  // For stockist view: transition CONFIRMING→PENDING in DB if window has closed
  if (stockistId && !customerId) {
    const now = new Date();
    // Transition CONFIRMING→PENDING in DB if window has closed
    const allOrders = db.getTable('orders');
    let changed = false;
    allOrders.forEach(o => {
      if (o.status === 'CONFIRMING' && o.stockist_id === stockistId && new Date(o.cancel_deadline) <= now) {
        o.status = 'PENDING';
        changed = true;
      }
    });
    if (changed) db.saveTable('orders', allOrders);
  }

  const enriched = filtered.map(o => enrichOrder(o)).reverse();
  return res.json(enriched);
});

// Update Order Status
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  let { status } = req.body;

  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (status === 'SHIPPED') {
    status = order.fulfillment_type === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY';
  }

  const validStatuses = ['CONFIRMING', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  order.status = status;
  db.saveTable('orders', orders);

  if (status === 'DELIVERED') {
    // §REGULATORY: credit points only on delivery
    // Recalculate points at delivery time to ensure accuracy
    const products = db.getTable('products');
    const orderItems = db.getTable('order_items').filter(oi => oi.order_id === id);
    let totalProfitMargin = 0;
    orderItems.forEach(oi => {
      const product = products.find(p => p.id === oi.product_id);
      const cost = product ? parseFloat(product.cost_price) : oi.cost_price || oi.price * 0.75;
      totalProfitMargin += (oi.price - cost) * oi.quantity;
    });
    const settlement = calculateSettlement(order.subtotal, totalProfitMargin, order.stockist_id, order.region_id);
    order.points_credited = settlement.pointsCredited;
    db.saveTable('orders', orders);
    _creditPointsOnDelivery(order);

    // Release split if HELD
    if (order.payment_status === 'HELD' && !order.split_released) {
      // Auto-release on delivery (can also be done manually by admin)
    }
  }

  if (status === 'CANCELLED') {
    reverseOrderPoints(id);
  }

  return res.json({ success: true, order: enrichOrder(order) });
});

// PATCH fulfillment — slot change enforced, one-way delivery switch
app.patch('/api/orders/:id/fulfillment', (req, res) => {
  const { id } = req.params;
  const { fulfillmentType, pickupSlot } = req.body;

  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (fulfillmentType) {
    if (fulfillmentType === 'PICKUP') {
      if (order.fulfillment_type === 'DELIVERY') {
        return res.status(400).json({ error: 'Already switched to delivery. Cannot switch back.', code: 'ONE_WAY_DELIVERY' });
      }
      order.fulfillment_type = 'PICKUP';
    } else if (fulfillmentType === 'DELIVERY') {
      if (order.fulfillment_type !== 'DELIVERY') {
        order.fulfillment_type = 'DELIVERY';
        const stockistsTable = db.getTable('stockists');
        const stockist = stockistsTable.find(s => s.id === order.stockist_id);
        const deliveryFee = cfg.DELIVERY_FEE_BY_REGION[(stockist || {}).region_id] || 40.00;

        order.delivery_fee = deliveryFee;
        order.total_price = order.subtotal + deliveryFee + (order.low_order_fee || 0);
        order.pickup_slot = null;

        const splitPayouts = db.getTable('split_payouts');
        const payout = splitPayouts.find(sp => sp.order_id === id);
        const settlement = calculateSettlement(order.subtotal, 0, order.stockist_id, order.region_id);
        const stockistPayout = order.subtotal - settlement.platformCommission + deliveryFee;
        const platformPayout = settlement.platformCommission + (order.low_order_fee || 0);

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

  if (pickupSlot !== undefined) {
    // §E14: slot is locked once order is READY_FOR_PICKUP or later
    const lockedStatuses = ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP'];
    if (lockedStatuses.includes(order.status)) {
      return res.status(400).json({ error: 'Pickup slot is locked once the order is ready for pickup.', code: 'SLOT_LOCKED' });
    }
    if (order.fulfillment_type === 'DELIVERY') {
      return res.status(400).json({ error: 'Cannot set pickup slot for delivery orders.' });
    }
    order.pickup_slot = pickupSlot;
  }

  db.saveTable('orders', orders);
  return res.json({ success: true, order: enrichOrder(order) });
});

// Offline sync
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
      let statusToSet = upd.status;
      if (statusToSet === 'SHIPPED') {
        statusToSet = order.fulfillment_type === 'PICKUP' ? 'READY_FOR_PICKUP' : 'OUT_FOR_DELIVERY';
      }
      order.status = statusToSet;
      syncCount++;
      if (statusToSet === 'CANCELLED') reverseOrderPoints(upd.orderId);
    }
  });

  if (syncCount > 0) db.saveTable('orders', orders);
  return res.json({ success: true, synced_count: syncCount });
});

// ----------------------------------------------------
// ADMIN — RELEASE SPLIT (idempotent)
// ----------------------------------------------------

app.post('/api/admin/release-split/:orderId', (req, res) => {
  const { orderId } = req.params;
  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.split_released) {
    return res.json({ success: true, no_op: true, message: 'Split already released. No action taken.' });
  }

  if (order.payment_status !== 'HELD') {
    return res.status(400).json({ error: 'Order is not in HELD state. Cannot release.' });
  }

  order.payment_status = 'SPLIT_RELEASED';
  order.split_released = true;
  db.saveTable('orders', orders);

  const splitPayouts = db.getTable('split_payouts');
  const payout = splitPayouts.find(sp => sp.order_id === orderId);
  if (payout) {
    payout.status = 'SPLIT_RELEASED';
    db.saveTable('split_payouts', splitPayouts);
  }

  appendPaymentEvent(orderId, 'SPLIT_RELEASED', order.total_price, {
    stockist_share: payout ? payout.stockist_amount : 0,
    platform_share: payout ? payout.platform_amount : 0
  });

  // Net against COD outstanding for this stockist
  const codLedger = db.getTable('cod_commission_ledger');
  const unsettledCod = codLedger.filter(e => e.stockist_id === order.stockist_id && !e.settled);
  const platformShare = payout ? parseFloat(payout.platform_amount) : 0;
  let remaining = platformShare;
  unsettledCod.forEach(e => {
    if (remaining > 0 && e.amount_owed <= remaining) {
      e.settled = true;
      remaining -= e.amount_owed;
      appendPaymentEvent(orderId, 'COD_COMMISSION_SETTLED', e.amount_owed, { cod_order_id: e.order_id });
    }
  });
  db.saveTable('cod_commission_ledger', codLedger);

  return res.json({ success: true, order: enrichOrder(order) });
});

// GET /api/admin/transactions — enriched with payment state
app.get('/api/admin/transactions', (req, res) => {
  const orders = db.getTable('orders');
  const enriched = orders.map(o => enrichOrder(o)).reverse();
  return res.json(enriched);
});

// GET /api/admin/cod-commission — per-stockist COD outstanding
app.get('/api/admin/cod-commission', (req, res) => {
  const codLedger = db.getTable('cod_commission_ledger');
  const stockists = db.getTable('stockists');

  const summary = {};
  codLedger.forEach(e => {
    if (!summary[e.stockist_id]) {
      const s = stockists.find(st => st.id === e.stockist_id);
      summary[e.stockist_id] = { stockist_id: e.stockist_id, stockist_name: s ? s.name : 'Unknown', total_outstanding: 0, total_settled: 0 };
    }
    if (e.settled) summary[e.stockist_id].total_settled += e.amount_owed;
    else summary[e.stockist_id].total_outstanding += e.amount_owed;
  });

  return res.json(Object.values(summary));
});

// GET /api/admin/payment-ledger
app.get('/api/admin/payment-ledger', (req, res) => {
  const { orderId } = req.query;
  const ledger = db.getTable('payment_ledger');
  const filtered = orderId ? ledger.filter(e => e.order_id === orderId) : ledger;
  return res.json(filtered.reverse());
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

function getRedemptionDescription(type, pts) {
  if (type === 'BROADBAND_DISCOUNT') return `Broadband Bill Discount - ₹${pts.toFixed(0)}`;
  if (type === 'BROADBAND_DISCOUNT_50') return 'Broadband Bill Discount - ₹50';
  if (type === 'BROADBAND_DISCOUNT_100') return 'Broadband Bill Discount - ₹100';
  if (type === 'WIFI_TOPUP') return 'WiFi Speed Booster 48h (100 Mbps)';
  if (type === 'DATA_TOPUP') return 'WiFi Data Top-up 10 GB';
  if (type === 'CABLE_RECHARGE') {
    if (pts === 100) return 'Cable TV Basic Pack - 1 Month Free';
    if (pts === 250) return 'Cable TV HD Premium Pack - 1 Month';
    if (pts === 120) return 'Cable TV Kids & Family Bundle';
    return 'Cable TV Recharge Package';
  }
  return 'Redeemed points against Broadband Bill';
}

app.post('/api/ledger/redeem', (req, res) => {
  const { customerId, amount, redemptionType } = req.body;
  if (!customerId || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid redemption parameters' });
  }

  const ALLOWED_REDEMPTION_TYPES = ['BROADBAND_DISCOUNT', 'BROADBAND_DISCOUNT_50', 'BROADBAND_DISCOUNT_100', 'WIFI_TOPUP', 'DATA_TOPUP', 'CABLE_RECHARGE'];
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

  return res.json({ success: true, ledgerId, remaining_balance: currentBalance + redeemAmount, message: 'Points successfully queued for redemption.' });
});

// ----------------------------------------------------
// FEEDBACK & REPORT ENDPOINTS
// ----------------------------------------------------

app.post('/api/feedback', (req, res) => {
  const { reporterId, reporterRole, targetId, targetRole, orderId, rating, reason, reportFlag } = req.body;
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
    report_flag: !!reportFlag,
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

    return { ...fb, reporter_name: reporterName, target_name: targetName };
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
  const shopName = (user.kyc_details && user.kyc_details.shop_name) ? user.kyc_details.shop_name : user.name + ' Store';
  const newStockist = {
    id: 's-' + generateId(),
    tenant_id: user.tenant_id,
    region_id: user.region_id,
    user_id: user.id,
    name: shopName,
    vendor_id: vendorId,
    delivery_radius_km: parseFloat(deliveryRadius) || 5.0,
    min_order_value: 0,
    is_active: true,
    opening_time: cfg.DEFAULT_OPENING_TIME,
    closing_time: cfg.DEFAULT_CLOSING_TIME,
    prep_eta_minutes: cfg.DEFAULT_PREP_ETA_MINUTES,
    created_at: new Date().toISOString()
  };

  stockists.push(newStockist);
  db.saveTable('stockists', stockists);

  const stockistVendors = db.getTable('stockist_vendors');
  stockistVendors.push({ stockist_id: newStockist.id, vendor_id: vendorId, approved_at: new Date().toISOString() });
  db.saveTable('stockist_vendors', stockistVendors);

  const products = db.getTable('products').filter(p => p.region_id === user.region_id);
  const inventory = db.getTable('stockist_inventory');
  products.forEach(p => {
    inventory.push({ stockist_id: newStockist.id, product_id: p.id, stock_qty: 0, is_available: false });
  });
  db.saveTable('stockist_inventory', inventory);

  return res.json({ success: true, stockist: newStockist });
});

app.get('/api/admin/commission-rates', (req, res) => res.json(db.getTable('commission_rates')));

app.post('/api/admin/commission-rates', (req, res) => {
  const { category, ratePercent, regionId } = req.body;
  if (!category || ratePercent === undefined || !regionId) {
    return res.status(400).json({ error: 'Category, regionId and ratePercent are required' });
  }
  const rates = db.getTable('commission_rates');
  const idx = rates.findIndex(r => r.region_id === regionId && r.category === category);
  if (idx > -1) { rates[idx].rate_percent = parseFloat(ratePercent); }
  else { rates.push({ id: 'cr-' + generateId(), tenant_id: 't1', region_id: regionId, category, rate_percent: parseFloat(ratePercent), created_at: new Date().toISOString() }); }
  db.saveTable('commission_rates', rates);
  return res.json({ success: true, rates });
});

app.get('/api/admin/stockist-commission-rates', (req, res) => res.json(db.getTable('stockist_commission_rates')));

app.post('/api/admin/stockist-commission-rates', (req, res) => {
  const { stockistId, ratePercent } = req.body;
  if (!stockistId || ratePercent === undefined) return res.status(400).json({ error: 'stockistId and ratePercent are required' });
  const rates = db.getTable('stockist_commission_rates');
  const idx = rates.findIndex(r => r.stockist_id === stockistId);
  if (idx > -1) { rates[idx].rate_percent = parseFloat(ratePercent); }
  else { rates.push({ id: 'scr-' + generateId(), stockist_id: stockistId, rate_percent: parseFloat(ratePercent), created_at: new Date().toISOString() }); }
  db.saveTable('stockist_commission_rates', rates);
  return res.json({ success: true, rates });
});

app.get('/api/admin/points-earn-config', (req, res) => res.json(db.getTable('points_earn_config')));

app.post('/api/admin/points-earn-config', (req, res) => {
  const { regionId, stockistId, earnRatePercent } = req.body;
  if (earnRatePercent === undefined) return res.status(400).json({ error: 'earnRatePercent is required' });
  const configs = db.getTable('points_earn_config');
  let idx = stockistId ? configs.findIndex(c => c.stockist_id === stockistId) : regionId ? configs.findIndex(c => c.region_id === regionId && !c.stockist_id) : -1;
  if (!stockistId && !regionId) return res.status(400).json({ error: 'Either regionId or stockistId is required' });
  const updatedConfig = { id: idx > -1 ? configs[idx].id : 'pec-' + generateId(), region_id: regionId || null, stockist_id: stockistId || null, earn_rate_percent: parseFloat(earnRatePercent), created_at: idx > -1 ? configs[idx].created_at : new Date().toISOString() };
  if (idx > -1) configs[idx] = updatedConfig; else configs.push(updatedConfig);
  db.saveTable('points_earn_config', configs);
  return res.json({ success: true, configs });
});

app.post('/api/admin/stockist-vendors', (req, res) => {
  const { stockistId, vendorId } = req.body;
  if (!stockistId || !vendorId) return res.status(400).json({ error: 'stockistId and vendorId are required' });
  const stockistVendors = db.getTable('stockist_vendors');
  if (!stockistVendors.some(sv => sv.stockist_id === stockistId && sv.vendor_id === vendorId)) {
    stockistVendors.push({ stockist_id: stockistId, vendor_id: vendorId, approved_at: new Date().toISOString() });
    db.saveTable('stockist_vendors', stockistVendors);
  }
  return res.json({ success: true, stockistVendors });
});

app.get('/api/stockists/:stockistId/vendors', (req, res) => {
  const { stockistId } = req.params;
  const stockistVendors = db.getTable('stockist_vendors');
  const vendors = db.getTable('vendors');
  const approvedIds = stockistVendors.filter(sv => sv.stockist_id === stockistId).map(sv => sv.vendor_id);
  return res.json(vendors.filter(v => approvedIds.includes(v.id)));
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

app.post('/api/admin/anomalies/:id/dismiss', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const logs = db.getTable('anomaly_logs');
  const idx = logs.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Anomaly log not found.' });
  logs[idx].status = 'DISMISSED';
  logs[idx].dismissed = true;
  logs[idx].dismiss_reason = reason || 'No reason provided';
  logs[idx].dismiss_at = new Date().toISOString();
  db.saveTable('anomaly_logs', logs);
  return res.json({ success: true, log: logs[idx] });
});

app.post('/api/admin/anomalies/:id/investigate', (req, res) => {
  const { id } = req.params;
  const logs = db.getTable('anomaly_logs');
  const idx = logs.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Anomaly log not found.' });
  logs[idx].status = 'INVESTIGATED';
  logs[idx].investigated = true;
  db.saveTable('anomaly_logs', logs);
  return res.json({ success: true, log: logs[idx] });
});

// Admin: customer no-show count and reset
app.get('/api/admin/customer-noshows', (req, res) => {
  const users = db.getTable('users');
  const customers = users.filter(u => u.role === 'CUSTOMER' && (u.no_show_count || 0) > 0);
  return res.json(customers.map(u => ({ id: u.id, name: u.name, phone: u.phone, no_show_count: u.no_show_count || 0, prepaid_pickup_restricted: !!u.prepaid_pickup_restricted })));
});

app.post('/api/admin/reset-noshows/:userId', (req, res) => {
  const { userId } = req.params;
  const users = db.getTable('users');
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx].no_show_count = 0;
  users[idx].prepaid_pickup_restricted = false;
  db.saveTable('users', users);
  return res.json({ success: true });
});

app.get('/api/admin/redemptions', (req, res) => {
  const ledger = db.getTable('points_ledger');
  const users = db.getTable('users');
  const redemptions = ledger.filter(l => l.type === 'REDEEM').map(l => {
    const user = users.find(u => u.id === l.customer_id);
    return { ...l, customer_name: user ? user.name : 'Unknown Customer', customer_phone: user ? user.phone : '' };
  }).reverse();
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

app.get('/api/admin/vendors', (req, res) => res.json(db.getTable('vendors')));

app.post('/api/admin/vendors', (req, res) => {
  const { name, regionId } = req.body;
  if (!name || !regionId) return res.status(400).json({ error: 'Name and regionId required' });
  const vendors = db.getTable('vendors');
  const newVendor = { id: 'v-' + generateId(), tenant_id: 't1', region_id: regionId, name, created_at: new Date().toISOString() };
  vendors.push(newVendor);
  db.saveTable('vendors', vendors);
  return res.json({ success: true, vendor: newVendor });
});

// Partner Leads Routes
app.post('/api/partner-leads', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  const leads = db.getTable('partner_leads');
  const newLead = {
    id: 'lead-' + generateId(),
    name,
    phone,
    created_at: new Date().toISOString(),
    status: 'NEW'
  };
  leads.push(newLead);
  db.saveTable('partner_leads', leads);
  return res.json({ success: true, lead: newLead });
});

app.get('/api/admin/partner-leads', (req, res) => {
  return res.json(db.getTable('partner_leads'));
});

// Reset DB
app.post('/api/admin/reset-db', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const DB_PATH = path.join(__dirname, 'db.json');
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  const fresh = db.read();
  return res.json({ success: true, message: 'Database reset successfully.', state: fresh });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Backend Server] ISP-Commerce Loyalty API listening on port ${PORT}`);
});
