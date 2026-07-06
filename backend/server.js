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

// Restock inventory from vendor
app.post('/api/stockists/restock', (req, res) => {
  const { stockistId, items } = req.body; // items: [{productId, quantity}]
  if (!stockistId || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid restock parameters' });
  }

  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === stockistId);
  if (!stockist) {
    return res.status(404).json({ error: 'Stockist not found' });
  }
  if (!stockist.vendor_id) {
    return res.status(400).json({ error: 'No approved Vendor assigned. Please contact Admin.' });
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
  return res.json({ success: true, message: 'Stock updated successfully from vendor.' });
});

// ----------------------------------------------------
// STOCKIST ENDPOINTS
// ----------------------------------------------------

app.get('/api/stockists', (req, res) => {
  const { regionId } = req.query;
  const stockists = db.getTable('stockists');
  const filtered = regionId ? stockists.filter(s => s.region_id === regionId && s.is_active) : stockists;
  return res.json(filtered);
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

// ----------------------------------------------------
// ORDER & PAYMENT SPLIT ENDPOINTS
// ----------------------------------------------------

app.post('/api/orders', (req, res) => {
  const { customerId, stockistId, items } = req.body; // items: [{productId, quantity}]
  if (!customerId || !stockistId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order request' });
  }

  const users = db.getTable('users');
  const customer = users.find(u => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === stockistId);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });

  // 1. Fetch products & inventory
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

  // 2. Validate Min Order Value
  if (subtotal < parseFloat(stockist.min_order_value)) {
    return res.status(400).json({ error: `Minimum order value for ${stockist.name} is ₹${stockist.min_order_value}` });
  }

  // 3. Calculate Fees
  // Delivery Fee: Default ₹30 for Bishnupur, ₹40 for Kolkata
  const deliveryFee = stockist.region_id === 'r2' ? 30.00 : 40.00;
  
  // Low Order Fee (Zomato/Swiggy style): If subtotal < ₹150, charge ₹20 fee (keeps as platform revenue, not loyalty pool)
  const lowOrderFee = subtotal < 150.00 ? 20.00 : 0.00;
  
  const totalPrice = subtotal + deliveryFee + lowOrderFee;

  // 4. Calculate Platform Commission (tiered categories/regions)
  const commissionRates = db.getTable('commission_rates');
  // Simple check for groceries tier
  const rateRecord = commissionRates.find(c => c.region_id === stockist.region_id && c.category === 'groceries');
  const commissionRate = rateRecord ? parseFloat(rateRecord.rate_percent) : 10.00;
  const platformCommission = (subtotal * commissionRate) / 100;

  // 5. Razorpay split calculations
  // Stockist Payout = Subtotal - Commission + Delivery Fee
  // Platform Retains = Commission + Low Order Fee
  const stockistPayout = subtotal - platformCommission + deliveryFee;
  const platformPayout = platformCommission + lowOrderFee;

  // 6. Points credit (40-50% of profit margin)
  // Let's use 45% as standard
  const pointsCredited = Math.round(totalProfitMargin * 0.45 * 100) / 100;

  // 7. Deduct inventory quantities
  inventory.forEach(inv => {
    const item = items.find(it => it.productId === inv.product_id && inv.stockist_id === stockistId);
    if (item) {
      inv.stock_qty -= item.quantity;
      inv.is_available = inv.stock_qty > 0;
    }
  });
  db.saveTable('stockist_inventory', inventory);

  // 8. Create Order Record
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
    payment_status: 'PAID', // Instant mock success
    razorpay_order_id: 'rzp_order_' + generateId(),
    razorpay_payment_id: 'rzp_pay_' + generateId(),
    created_at: new Date().toISOString()
  };

  const orders = db.getTable('orders');
  orders.push(order);
  db.saveTable('orders', orders);

  // Save Order Items
  const savedOrderItems = db.getTable('order_items');
  orderItems.forEach(oi => {
    oi.order_id = orderId;
    savedOrderItems.push(oi);
  });
  db.saveTable('order_items', savedOrderItems);

  // 9. Log Razorpay Split Payout
  const splitPayouts = db.getTable('split_payouts');
  splitPayouts.push({
    id: 'sp-' + generateId(),
    order_id: orderId,
    stockist_id: stockistId,
    stockist_amount: stockistPayout,
    platform_amount: platformPayout,
    status: 'PROCESSED_IMMEDIATELY',
    created_at: new Date().toISOString()
  });
  db.saveTable('split_payouts', splitPayouts);

  // 10. Append Points Ledger Row
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

  // 11. Anomaly Check
  // Check orders in last 24h for this customer & stockist
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
      created_at: new Date().toISOString()
    });
    db.saveTable('anomaly_logs', anomalyLogs);
    console.log(`[ANOMALY WARNING] Collusion flag raised for customer ${customer.name} and stockist ${stockist.name}`);
  }

  return res.json({
    success: true,
    orderId,
    pointsCredited,
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

  // Attach items to response
  const orderItems = db.getTable('order_items');
  const users = db.getTable('users');
  const splitPayouts = db.getTable('split_payouts');
  const enriched = filtered.map(o => {
    const items = orderItems.filter(oi => oi.order_id === o.id);
    const customer = users.find(u => u.id === o.customer_id);
    const payout = splitPayouts.find(sp => sp.order_id === o.id);

    // Commission fallback calculation if not found in split_payouts table
    const commissionRates = db.getTable('commission_rates');
    const rateRecord = commissionRates.find(c => c.region_id === o.region_id && c.category === 'groceries');
    const commissionRate = rateRecord ? parseFloat(rateRecord.rate_percent) : 10.00;
    const platformCommission = (o.subtotal * commissionRate) / 100;
    const stockistPayout = o.subtotal - platformCommission + o.delivery_fee;
    const platformPayout = platformCommission + o.low_order_fee;

    return { 
      ...o, 
      items,
      customer_name: customer ? customer.name : 'Unknown Subscriber',
      customer_phone: customer ? customer.phone : '',
      stockist_amount: payout ? parseFloat(payout.stockist_amount) : stockistPayout,
      platform_amount: payout ? parseFloat(payout.platform_amount) : platformPayout
    };
  }).reverse(); // Sort newest first

  return res.json(enriched);
});

// Update Order Status (or batch updates for Offline tolerance)
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
  return res.json({ success: true, order });
});

// Offline sync endpoint
app.post('/api/orders/sync', (req, res) => {
  const { updates } = req.body; // Array of { orderId, status, updatedAt }
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

// Redeem Points (closed-loop: must apply to ISP bill)
app.post('/api/ledger/redeem', (req, res) => {
  const { customerId, amount } = req.body;
  if (!customerId || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid redemption parameters' });
  }

  const users = db.getTable('users');
  const customer = users.find(u => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  // 1. Calculate current balance
  const ledger = db.getTable('points_ledger');
  const customerLedger = ledger.filter(l => l.customer_id === customerId);
  const currentBalance = customerLedger.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  if (currentBalance < parseFloat(amount)) {
    return res.status(400).json({ error: 'Insufficient points balance' });
  }

  // 2. Append REDEEM ledger entry
  const redeemAmount = -Math.abs(parseFloat(amount));
  const ledgerId = 'l-' + generateId();
  
  ledger.push({
    id: ledgerId,
    tenant_id: customer.tenant_id,
    region_id: customer.region_id,
    customer_id: customer.id,
    amount: redeemAmount,
    type: 'REDEEM',
    order_id: null,
    description: `Redeemed points against Broadband Bill`,
    created_at: new Date().toISOString(),
    billing_sync_status: 'PENDING' // Track manual billing sync
  });
  db.saveTable('points_ledger', ledger);

  return res.json({
    success: true,
    ledgerId,
    remaining_balance: currentBalance + redeemAmount,
    message: 'Points successfully queued for redemption. Discount will be applied on your next ISP bill.'
  });
});

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// Get KYC Queue
app.get('/api/admin/kyc-queue', (req, res) => {
  const users = db.getTable('users');
  const pending = users.filter(u => u.role === 'STOCKIST' && u.kyc_status === 'PENDING');
  return res.json(pending);
});

// Approve KYC & Assign Vendor
app.post('/api/admin/approve-kyc', (req, res) => {
  const { userId, vendorId, deliveryRadius, minOrderValue } = req.body;
  if (!userId || !vendorId) {
    return res.status(400).json({ error: 'User ID and Vendor ID are required' });
  }

  const users = db.getTable('users');
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  // Update User Status
  users[userIndex].kyc_status = 'APPROVED';
  db.saveTable('users', users);

  const user = users[userIndex];

  // Create Stockist Profile
  const stockists = db.getTable('stockists');
  const newStockist = {
    id: 's-' + generateId(),
    tenant_id: user.tenant_id,
    region_id: user.region_id,
    user_id: user.id,
    name: user.name + ' Store',
    vendor_id: vendorId,
    delivery_radius_km: parseFloat(deliveryRadius) || 5.0,
    min_order_value: parseFloat(minOrderValue) || 150.0,
    is_active: true,
    created_at: new Date().toISOString()
  };
  
  stockists.push(newStockist);
  db.saveTable('stockists', stockists);

  // Initialize basic inventory for this new stockist (empty or default products mapped)
  const products = db.getTable('products').filter(p => p.region_id === user.region_id);
  const inventory = db.getTable('stockist_inventory');
  products.forEach(p => {
    inventory.push({
      stockist_id: newStockist.id,
      product_id: p.id,
      stock_qty: 0, // Starts out of stock, must restock from vendor
      is_available: false
    });
  });
  db.saveTable('stockist_inventory', inventory);

  return res.json({ success: true, stockist: newStockist });
});

// Get Commission Rates Config
app.get('/api/admin/commission-rates', (req, res) => {
  const rates = db.getTable('commission_rates');
  return res.json(rates);
});

// Update Commission Rates
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

// Get Anomaly Flags
app.get('/api/admin/anomalies', (req, res) => {
  const logs = db.getTable('anomaly_logs');
  return res.json(logs);
});

// Get Billing Sync Redemptions
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

// Complete redemption manually (billing integration sync)
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

// Get list of Vendors
app.get('/api/admin/vendors', (req, res) => {
  const vendors = db.getTable('vendors');
  return res.json(vendors);
});

// Create Vendor
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

// Reset DB (Demo helper)
app.post('/api/admin/reset-db', (req, res) => {
  db.write(db.read()); // This triggers default if empty, but let's delete files to hard-reset
  const path = require('path');
  const fs = require('fs');
  const DB_PATH = path.join(__dirname, 'db.json');
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  const fresh = db.read();
  return res.json({ success: true, message: 'Database reset to default seed data successfully.', state: fresh });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[Backend Server] ISP-Commerce Loyalty API listening on port ${PORT}`);
});
