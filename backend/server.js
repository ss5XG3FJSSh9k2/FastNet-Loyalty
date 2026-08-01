const express = require('express');
const cors = require('cors');
const db = require('./db');
const cfg = require('./config');

const multer = require('multer');
const r2 = require('./lib/r2');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

const uploadBillMiddleware = (req, res, next) => {
  upload.single('bill_photo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'file_too_large', message: 'Bill photo exceeds 8 MB limit.' });
      }
      return res.status(400).json({ error: 'upload_error', message: err.message });
    }
    next();
  });
};

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const emailHelper = require('./lib/email');
const sessionHelper = require('./lib/session');

if (!r2.isR2Configured()) {
  console.warn('[Storage Warning] bill upload disabled — R2 not configured');
}

if (!emailHelper.isEmailConfigured()) {
  console.warn('email delivery disabled — mock and SendGrid both off');
}

// In-memory rate limiting and token stores
const loginPasswordFailedAttempts = new Map();
const otpRequestAttempts = new Map();
const resetTokens = new Map();

// Helper: sanitize user object (remove password_hash)
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

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

// Helper: append an admin audit log entry
function appendAudit(req, action, entity_type, entity_id, before = null, after = null, reason = '') {
  const admin_user_id = (req && req.headers && req.headers['x-admin-id']) || (req && req.body && req.body.admin_user_id) || 'u-admin';
  const log = db.getTable('admin_audit_log');
  const entry = {
    id: 'audit-' + generateId(),
    admin_user_id,
    action,
    entity_type,
    entity_id,
    before: before !== undefined ? before : null,
    after: after !== undefined ? after : null,
    reason: reason || '',
    created_at: new Date().toISOString()
  };
  log.push(entry);
  db.saveTable('admin_audit_log', log);
  return entry;
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

  if (user.is_active === false) {
    return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });
  }

  return res.json({ success: true, user });
});

// Register new Customer
app.post('/api/auth/register-customer', (req, res) => {
  const { phone, name, regionId, address, cable_partner_id, broadband_partner_id } = req.body;
  if (!phone || !name || !regionId) {
    return res.status(400).json({ error: 'Name, phone, and region are required' });
  }

  const users = db.getTable('users');
  if (users.some(u => u.phone === phone)) {
    return res.status(400).json({ error: 'An account with this phone number already exists' });
  }

  const partners = db.getTable('partners');
  const partnerRegions = db.getTable('partner_regions');

  if (cable_partner_id) {
    const cp = partners.find(p => p.id === cable_partner_id && p.is_active !== false);
    const cpServes = cp && partnerRegions.some(pr => pr.partner_id === cable_partner_id && pr.region_id === regionId && pr.service_type === 'CABLE' && pr.is_active !== false);
    if (!cp || !cpServes) {
      return res.status(400).json({ error: 'invalid_partner_binding', field: 'cable_partner_id', message: 'Cable partner invalid or does not serve region' });
    }
  }

  if (broadband_partner_id) {
    const bp = partners.find(p => p.id === broadband_partner_id && p.is_active !== false);
    const bpServes = bp && partnerRegions.some(pr => pr.partner_id === broadband_partner_id && pr.region_id === regionId && pr.service_type === 'BROADBAND' && pr.is_active !== false);
    if (!bp || !bpServes) {
      return res.status(400).json({ error: 'invalid_partner_binding', field: 'broadband_partner_id', message: 'Broadband partner invalid or does not serve region' });
    }
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

  let bindings = null;
  if (cable_partner_id || broadband_partner_id) {
    const customerPartnerBindings = db.getTable('customer_partner_bindings');
    const now = new Date().toISOString();
    bindings = {
      customer_user_id: user.id,
      cable_partner_id: cable_partner_id || null,
      broadband_partner_id: broadband_partner_id || null,
      created_at: now,
      updated_at: now
    };
    customerPartnerBindings.push(bindings);
    db.saveTable('customer_partner_bindings', customerPartnerBindings);
    appendAudit(req, 'CREATE_PARTNER_BINDING', 'customer_partner_binding', user.id, null, bindings);
  }

  const resObj = { success: true, user };
  if (bindings) resObj.bindings = bindings;
  return res.json(resObj);
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

app.post('/api/products', uploadBillMiddleware, async (req, res) => {
  if (req.headers['x-r2-mock'] === 'false' || !r2.isR2Configured()) {
    return res.status(503).json({ error: 'r2_not_configured', message: 'Bill upload service unavailable' });
  }

  // If content-type is JSON or no req.file present:
  if (!req.file) {
    return res.status(400).json({
      error: 'bill_photo_required',
      message: "New SKUs require a bill photo. Send as multipart/form-data with a 'bill_photo' file field."
    });
  }

  // Validate file MIME
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: 'invalid_file_type',
      message: 'Only JPG, PNG, and WebP bill photos are allowed.'
    });
  }

  // Validate file size (8MB)
  if (req.file.size > 8 * 1024 * 1024) {
    return res.status(400).json({
      error: 'file_too_large',
      message: 'Bill photo exceeds 8 MB limit.'
    });
  }

  const name = req.body.name;
  const price = req.body.price;
  const costPrice = req.body.costPrice || req.body.cost_price;
  const category = req.body.category;
  const initialStock = req.body.initialStock !== undefined ? req.body.initialStock : req.body.stock_qty;
  const stockistId = req.body.stockistId || req.body.stockist_id;
  const regionId = req.body.regionId || req.body.region_id;
  const description = req.body.description;
  const imageUrl = req.body.image_url;

  if (!name || price === undefined || !category || initialStock === undefined || !stockistId || !regionId) {
    return res.status(400).json({ error: 'Missing product fields' });
  }

  const parsedPrice = parseFloat(price);
  const parsedCostPrice = costPrice !== undefined ? parseFloat(costPrice) : parsedPrice * 0.75;

  if (parsedPrice <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }
  if (parsedCostPrice < 0 || parsedCostPrice > parsedPrice) {
    return res.status(400).json({ error: 'Cost price must be between 0 and selling price' });
  }

  // Upload bill to R2
  let uploadRes;
  try {
    uploadRes = await r2.uploadBillPhoto(req.file.buffer, req.file.mimetype, `bills/${stockistId}`);
  } catch (uploadErr) {
    return res.status(500).json({ error: 'upload_failed', message: uploadErr.message });
  }

  const billPhotos = db.getTable('product_bill_photos');
  const billPhotoId = 'pbp-' + generateId();
  const productId = 'p-' + generateId();

  const billPhotoRow = {
    id: billPhotoId,
    product_id: productId,
    stockist_id: stockistId,
    r2_key: uploadRes.key,
    public_url: uploadRes.publicUrl,
    selling_price_at_upload: parsedPrice,
    cost_price_at_upload: parsedCostPrice,
    file_size_bytes: req.file.size,
    content_type: req.file.mimetype,
    flag_status: 'CLEAN',
    flag_reason: null,
    flagged_by_admin_id: null,
    flagged_at: null,
    uploaded_at: new Date().toISOString(),
    uploaded_by_stockist_admin_id: req.body.uploaded_by || stockistId
  };

  billPhotos.push(billPhotoRow);
  db.saveTable('product_bill_photos', billPhotos);

  const products = db.getTable('products');
  const newProduct = {
    id: productId,
    tenant_id: 't1',
    region_id: regionId,
    name,
    category,
    price: parsedPrice,
    cost_price: parsedCostPrice,
    description: description || (name + ' added by local stockist'),
    image_url: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=60',
    latest_bill_photo_id: billPhotoId,
    has_flagged_bill: false,
    created_at: new Date().toISOString()
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

  return res.json({ success: true, product: newProduct, bill_photo: billPhotoRow });
});

app.patch('/api/products/:id', uploadBillMiddleware, async (req, res) => {
  const { id } = req.params;
  const stockistId = req.body.stockistId || req.body.stockist_id;

  if (!stockistId) {
    return res.status(400).json({ error: 'Missing stockistId' });
  }

  // Ownership check
  const inventory = db.getTable('stockist_inventory');
  const inv = inventory.find(i => i.product_id === id && i.stockist_id === stockistId);
  if (!inv) {
    return res.status(403).json({ error: 'Not the owning stockist' });
  }

  const products = db.getTable('products');
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const reqPrice = req.body.price;
  const reqCostPrice = req.body.costPrice !== undefined ? req.body.costPrice : req.body.cost_price;

  const newPrice = reqPrice !== undefined ? parseFloat(reqPrice) : product.price;
  const newCostPrice = reqCostPrice !== undefined ? parseFloat(reqCostPrice) : product.cost_price;

  if (newPrice <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }
  if (newCostPrice < 0 || newCostPrice > newPrice) {
    return res.status(400).json({ error: 'Cost price must be between 0 and selling price' });
  }

  const priceChanged = Math.abs(newPrice - product.price) > 0.001 || Math.abs(newCostPrice - product.cost_price) > 0.001;

  if (priceChanged && !req.file) {
    return res.status(400).json({
      error: 'bill_required_for_price_change',
      message: 'Price change detected. A new bill photo is required.'
    });
  }

  let billPhotoRow = null;
  if (req.file) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'invalid_file_type',
        message: 'Only JPG, PNG, and WebP bill photos are allowed.'
      });
    }
    if (req.file.size > 8 * 1024 * 1024) {
      return res.status(400).json({
        error: 'file_too_large',
        message: 'Bill photo exceeds 8 MB limit.'
      });
    }

    if (!r2.isR2Configured()) {
      return res.status(503).json({ error: 'r2_not_configured', message: 'Bill upload service unavailable' });
    }

    let uploadRes;
    try {
      uploadRes = await r2.uploadBillPhoto(req.file.buffer, req.file.mimetype, `bills/${stockistId}`);
    } catch (uploadErr) {
      return res.status(500).json({ error: 'upload_failed', message: uploadErr.message });
    }

    const billPhotos = db.getTable('product_bill_photos');
    billPhotoRow = {
      id: 'pbp-' + generateId(),
      product_id: id,
      stockist_id: stockistId,
      r2_key: uploadRes.key,
      public_url: uploadRes.publicUrl,
      selling_price_at_upload: newPrice,
      cost_price_at_upload: newCostPrice,
      file_size_bytes: req.file.size,
      content_type: req.file.mimetype,
      flag_status: 'CLEAN',
      flag_reason: null,
      flagged_by_admin_id: null,
      flagged_at: null,
      uploaded_at: new Date().toISOString(),
      uploaded_by_stockist_admin_id: req.body.uploaded_by || stockistId
    };

    billPhotos.push(billPhotoRow);
    db.saveTable('product_bill_photos', billPhotos);

    product.latest_bill_photo_id = billPhotoRow.id;
  }

  if (req.body.name !== undefined) product.name = req.body.name;
  if (req.body.description !== undefined) product.description = req.body.description;
  if (req.body.category !== undefined) product.category = req.body.category;
  if (req.body.image_url !== undefined) product.image_url = req.body.image_url;

  product.price = newPrice;
  product.cost_price = newCostPrice;

  db.saveTable('products', products);

  return res.json({ success: true, product, bill_photo: billPhotoRow });
});

// GET /api/products/:id/bill-history
app.get('/api/products/:id/bill-history', (req, res) => {
  const { id } = req.params;
  const billPhotos = db.getTable('product_bill_photos');
  const history = billPhotos
    .filter(b => b.product_id === id)
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
  return res.json(history);
});

// GET /api/admin/bill-photos
app.get('/api/admin/bill-photos', (req, res) => {
  const { flag_status, stockist_id, date_from, date_to, page = 1 } = req.query;
  let billPhotos = db.getTable('product_bill_photos');
  const products = db.getTable('products');
  const stockists = db.getTable('stockists');

  if (flag_status) {
    billPhotos = billPhotos.filter(b => b.flag_status === flag_status);
  }
  if (stockist_id) {
    billPhotos = billPhotos.filter(b => b.stockist_id === stockist_id);
  }
  if (date_from) {
    const fromTime = new Date(date_from).getTime();
    billPhotos = billPhotos.filter(b => new Date(b.uploaded_at).getTime() >= fromTime);
  }
  if (date_to) {
    const toTime = new Date(date_to).getTime();
    billPhotos = billPhotos.filter(b => new Date(b.uploaded_at).getTime() <= toTime);
  }

  billPhotos.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));

  const pageSize = 50;
  const pageNum = parseInt(page, 10) || 1;
  const startIndex = (pageNum - 1) * pageSize;
  const paginated = billPhotos.slice(startIndex, startIndex + pageSize);

  const enriched = paginated.map(b => {
    const p = products.find(prod => prod.id === b.product_id);
    const s = stockists.find(st => st.id === b.stockist_id);
    return {
      ...b,
      product_name: p ? p.name : 'Unknown Product',
      stockist_name: s ? s.name : 'Unknown Stockist'
    };
  });

  return res.json({
    total: billPhotos.length,
    page: pageNum,
    page_size: pageSize,
    data: enriched
  });
});

// POST /api/admin/bill-photos/:id/flag
app.post('/api/admin/bill-photos/:id/flag', (req, res) => {
  const { id } = req.params;
  const { admin_id, reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({ error: 'reason_too_short', message: 'reason must be at least 10 characters' });
  }

  const billPhotos = db.getTable('product_bill_photos');
  const bill = billPhotos.find(b => b.id === id);
  if (!bill) return res.status(404).json({ error: 'Bill photo not found' });

  const beforeState = bill.flag_status;
  bill.flag_status = 'FLAGGED';
  bill.flag_reason = reason.trim();
  bill.flagged_by_admin_id = admin_id || 'u-admin';
  bill.flagged_at = new Date().toISOString();
  db.saveTable('product_bill_photos', billPhotos);

  const products = db.getTable('products');
  const product = products.find(p => p.id === bill.product_id);
  if (product) {
    product.has_flagged_bill = true;
    db.saveTable('products', products);
  }

  appendAudit(req, 'BILL_PHOTO_FLAG', 'product_bill_photos', id, beforeState, 'FLAGGED', reason.trim());

  return res.json({ success: true, bill, product });
});

// POST /api/admin/bill-photos/:id/unflag
app.post('/api/admin/bill-photos/:id/unflag', (req, res) => {
  const { id } = req.params;

  const billPhotos = db.getTable('product_bill_photos');
  const bill = billPhotos.find(b => b.id === id);
  if (!bill) return res.status(404).json({ error: 'Bill photo not found' });

  const beforeState = bill.flag_status;
  bill.flag_status = 'RESOLVED';
  db.saveTable('product_bill_photos', billPhotos);

  const products = db.getTable('products');
  const product = products.find(p => p.id === bill.product_id);
  if (product) {
    const hasOtherFlagged = billPhotos.some(b => b.product_id === bill.product_id && b.flag_status === 'FLAGGED');
    product.has_flagged_bill = hasOtherFlagged;
    db.saveTable('products', products);
  }

  appendAudit(req, 'BILL_PHOTO_UNFLAG', 'product_bill_photos', id, beforeState, 'RESOLVED', 'Admin resolved flag');

  return res.json({ success: true, bill, product });
});

// POST /api/admin/bill-photos/:id/signed-url
app.post('/api/admin/bill-photos/:id/signed-url', async (req, res) => {
  const { id } = req.params;
  const billPhotos = db.getTable('product_bill_photos');
  const bill = billPhotos.find(b => b.id === id);
  if (!bill) return res.status(404).json({ error: 'Bill photo not found' });

  try {
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const signedUrl = await r2.getSignedReadUrl(bill.r2_key, 3600);
    return res.json({ signed_url: signedUrl, expires_at: expiresAt });
  } catch (err) {
    return res.status(500).json({ error: 'failed_signed_url', message: err.message });
  }
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
// Helper: Get Commission Config (STORE first, GLOBAL fallback)
function getCommissionConfig(stockistId = null) {
  const configs = db.getTable('commission_config');
  if (stockistId) {
    const storeCfg = configs.find(c => c.scope === 'STORE' && c.stockist_id === stockistId);
    if (storeCfg) return storeCfg;
  }
  const globalCfg = configs.find(c => c.scope === 'GLOBAL');
  if (globalCfg) return globalCfg;

  console.error('[CommissionConfig] Missing config row in database! Falling back to 50/40/12 defaults.');
  return {
    id: 'cc-fallback',
    scope: 'GLOBAL',
    stockist_id: null,
    stockist_reinvest_pct: 50,
    points_from_pot_pct: 40,
    partner_redemption_cut_pct: 12
  };
}

// Helper: Calculate Partner Payout
function calculatePartnerPayout(redemptionValue, stockistId = null) {
  const cfg = getCommissionConfig(stockistId);
  const cutPct = parseFloat(cfg.partner_redemption_cut_pct);
  const platformCut = Math.round(redemptionValue * cutPct) / 100;
  const partnerPayout = Math.round((redemptionValue - platformCut) * 100) / 100;
  return { platformCut, partnerPayout, cutPctUsed: cutPct };
}

// Helper: Settlement Engine (Profit-basis v2)
function calculateSettlement(subtotal, totalProfitMargin, stockistId, regionId) {
  const cfg = getCommissionConfig(stockistId);

  // 2.1 Guard against negative or zero profit
  if (!totalProfitMargin || totalProfitMargin <= 0) {
    console.warn(`[Settlement] Non-positive profit margin (${totalProfitMargin}) for stockist ${stockistId}. Setting settlement outputs to 0.`);
    return {
      commission_model: 'profit_v2',
      config_row_id: cfg ? cfg.id : null,
      stockistReinvest: 0,
      platformPot: 0,
      platformCommission: 0,
      pointsCredited: 0,
      commissionRateUsed: null,
      earnRateUsed: null
    };
  }

  const reinvestPct = parseFloat(cfg.stockist_reinvest_pct) || 50;
  const pointsPct = parseFloat(cfg.points_from_pot_pct) || 40;

  const stockistReinvest = totalProfitMargin * (reinvestPct / 100);
  const platformPot = totalProfitMargin - stockistReinvest;

  const pointsCredited = Math.round(platformPot * (pointsPct / 100) * 100) / 100;
  const platformCommission = Math.round((platformPot - pointsCredited) * 100) / 100;

  return {
    commission_model: 'profit_v2',
    config_row_id: cfg.id,
    stockistReinvest,
    platformPot,
    platformCommission,
    pointsCredited,
    commissionRateUsed: null,
    earnRateUsed: null
  };
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

function processOrderCancellation(order) {
  order.status = 'CANCELLED';
  reverseOrderPoints(order.id);

  if (order.payment_status === 'HELD') {
    const splitPayouts = db.getTable('split_payouts');
    const payout = splitPayouts.find(sp => sp.order_id === order.id);
    const platformCommission = payout ? parseFloat(payout.platform_amount) : 0;
    const refundAmount = order.total_price - platformCommission;

    order.payment_status = 'REFUND_DUE';
    appendPaymentEvent(order.id, 'REFUND_DUE', refundAmount, {
      reason: 'Order cancellation',
      commission_retained: platformCommission
    });
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

  let platformCommission = o.platform_commission;
  let stockistPayout = o.stockist_payout;

  if (platformCommission === undefined) {
    if (payout) {
      platformCommission = parseFloat(payout.platform_amount);
    } else {
      const stockistCommissionRates = db.getTable('stockist_commission_rates');
      const scr = stockistCommissionRates.find(r => r.stockist_id === o.stockist_id);
      const commissionRate = scr ? parseFloat(scr.rate_percent) : 10.00;
      platformCommission = (o.subtotal * commissionRate) / 100;
    }
  }

  if (stockistPayout === undefined) {
    if (payout) {
      stockistPayout = parseFloat(payout.stockist_amount);
    } else {
      stockistPayout = o.subtotal - platformCommission + (o.delivery_fee || 0);
    }
  }

  const platformPayout = payout ? parseFloat(payout.platform_amount) : (platformCommission + (o.low_order_fee || 0));

  return {
    ...o,
    commission_model: o.commission_model || 'gross_v1',
    items,
    pointsCredited: o.points_credited !== undefined ? o.points_credited : 0,
    points_credited: o.points_credited !== undefined ? o.points_credited : 0,
    platform_commission: platformCommission,
    stockist_payout: stockistPayout,
    earnRatePercent: o.earn_rate_used !== undefined ? o.earn_rate_used : 40,
    earn_rate_used: o.earn_rate_used !== undefined ? o.earn_rate_used : 40,
    margin: o.margin !== undefined ? o.margin : (o.subtotal * 0.25),
    customer_name: customer ? customer.name : 'Unknown Subscriber',
    customer_phone: customer ? customer.phone : '',
    stockist_amount: stockistPayout,
    platform_amount: platformPayout
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

    const reqModel = req.body.commission_model || (!req.body.stores ? 'gross_v1' : 'profit_v2');
    let settlement;
    let platformCommission, pointsCredited, stockistReinvest, platformPot, stockistPayout, platformPayout;

    if (reqModel === 'gross_v1') {
      const stockistCommissionRates = db.getTable('stockist_commission_rates');
      const scr = stockistCommissionRates.find(r => r.stockist_id === stockistId);
      const commissionRate = scr ? parseFloat(scr.rate_percent) : 10.00;
      platformCommission = (subtotal * commissionRate) / 100;

      const pointsEarnConfig = db.getTable('points_earn_config');
      const pecStockist = pointsEarnConfig.find(r => r.stockist_id === stockistId);
      const pecRegion = pointsEarnConfig.find(r => r.region_id === customer.region_id && !r.stockist_id);
      const earnRatePercent = pecStockist ? parseFloat(pecStockist.earn_rate_percent) : (pecRegion ? parseFloat(pecRegion.earn_rate_percent) : 45.0);

      pointsCredited = Math.round(totalProfitMargin * (earnRatePercent / 100) * 100) / 100;
      stockistReinvest = 0;
      platformPot = platformCommission;
      stockistPayout = subtotal - platformCommission + deliveryFee;
      platformPayout = platformCommission;

      settlement = {
        commission_model: 'gross_v1',
        config_row_id: null,
        stockistReinvest: 0,
        platformPot: platformCommission,
        platformCommission,
        pointsCredited,
        commissionRateUsed: commissionRate,
        earnRateUsed: earnRatePercent
      };
    } else {
      settlement = calculateSettlement(subtotal, totalProfitMargin, stockistId, customer.region_id);
      platformCommission = settlement.platformCommission;
      pointsCredited = settlement.pointsCredited;
      stockistReinvest = settlement.stockistReinvest;
      platformPot = settlement.platformPot;
      stockistPayout = subtotal + deliveryFee - platformPot;
      platformPayout = platformCommission;
    }

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
      commission_model: settlement.commission_model,
      config_row_id: settlement.config_row_id,
      platform_commission: platformCommission,
      points_credited: pointsCredited,
      stockist_reinvest: stockistReinvest,
      platform_pot: platformPot,
      stockist_payout: stockistPayout,
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

  if (['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(order.status)) {
    return res.status(400).json({
      error: 'Order is ready or out for delivery, cancellation locked',
      code: 'CANCEL_LOCKED_READY'
    });
  }

  const now = new Date();
  const deadline = new Date(order.cancel_deadline || order.created_at);
  if (now > deadline) {
    return res.status(400).json({
      error: 'Cancellation window has closed. You can no longer cancel this order.',
      code: 'CANCEL_WINDOW_CLOSED'
    });
  }

  if (!['CONFIRMING', 'PENDING', 'ACCEPTED', 'PREPARING'].includes(order.status)) {
    return res.status(400).json({ error: 'Order status does not allow cancellation' });
  }

  processOrderCancellation(order);

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
    processOrderCancellation(order);

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

  if (status === 'DELIVERED' && order.fulfillment_type === 'DELIVERY') {
    return res.status(400).json({
      error: 'Direct delivery transition blocked. PIN verification required for handoff completion.',
      code: 'PIN_REQUIRED'
    });
  }

  if (status === 'CANCELLED') {
    if (!['CONFIRMING', 'PENDING'].includes(order.status)) {
      return res.status(403).json({
        error: 'Cancellation locked. Stockists can only cancel orders in CONFIRMING or PENDING states.',
        code: 'STOCKIST_CANCEL_LOCKED'
      });
    }
    processOrderCancellation(order);
  } else {
    order.status = status;
  }
  db.saveTable('orders', orders);

  if (status === 'DELIVERED') {
    // §REGULATORY: credit points only on delivery
    if (order.commission_model !== 'gross_v1') {
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
    }
    _creditPointsOnDelivery(order);

    // Release split if HELD
    if (order.payment_status === 'HELD' && !order.split_released) {
      // Auto-release on delivery (can also be done manually by admin)
    }
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

app.post('/api/admin/orders/:id/refund', (req, res) => {
  const { id } = req.params;
  const orders = db.getTable('orders');
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.payment_status === 'REFUNDED') {
    return res.json({ success: true, order: enrichOrder(order) });
  }

  if (order.payment_status !== 'REFUND_DUE') {
    return res.status(400).json({ error: 'Order is not in REFUND_DUE state' });
  }

  const splitPayouts = db.getTable('split_payouts');
  const payout = splitPayouts.find(sp => sp.order_id === id);
  const platformCommission = payout ? parseFloat(payout.platform_amount) : 0;
  const refundAmount = order.total_price - platformCommission;

  order.payment_status = 'REFUNDED';
  db.saveTable('orders', orders);

  appendPaymentEvent(id, 'REFUNDED', refundAmount, { net_refund: refundAmount });

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
  const customerId = req.body.customerId || req.body.customer_user_id;
  const { amount, redemptionType, partner_package_id } = req.body;
  if (!customerId || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid redemption parameters' });
  }

  const users = db.getTable('users');
  const customer = users.find(u => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const partnerPackages = db.getTable('partner_packages');
  let pkg = null;

  if (partner_package_id) {
    pkg = partnerPackages.find(p => p.id === partner_package_id);
    if (!pkg || pkg.is_active === false) {
      return res.status(400).json({ error: 'Package missing or inactive' });
    }

    // Customer binding check
    const bindings = db.getTable('customer_partner_bindings');
    const binding = bindings.find(b => b.customer_user_id === customerId);
    if (!binding) {
      return res.status(400).json({ error: 'binding_mismatch' });
    }
    if (pkg.service_type === 'CABLE' && binding.cable_partner_id !== pkg.partner_id) {
      return res.status(400).json({ error: 'binding_mismatch' });
    }
    if (pkg.service_type === 'BROADBAND' && binding.broadband_partner_id !== pkg.partner_id) {
      return res.status(400).json({ error: 'binding_mismatch' });
    }

    // Customer region coverage check
    const customerRegion = customer.region_id;
    const partnerRegions = db.getTable('partner_regions');
    const activeRegions = pkg.active_regions || [];
    const isRegionActive = activeRegions.includes(customerRegion) && partnerRegions.some(pr =>
      pr.partner_id === pkg.partner_id &&
      pr.region_id === customerRegion &&
      pr.service_type === pkg.service_type &&
      pr.is_active !== false
    );
    if (!isRegionActive) {
      return res.status(400).json({ error: 'partner_region_inactive' });
    }

    // Amount match check
    if (parseFloat(amount) !== parseFloat(pkg.point_cost)) {
      return res.status(400).json({ error: 'amount_mismatch' });
    }
  } else {
    // Legacy generic path validation
    const ALLOWED_REDEMPTION_TYPES = ['BROADBAND_DISCOUNT', 'BROADBAND_DISCOUNT_50', 'BROADBAND_DISCOUNT_100', 'WIFI_TOPUP', 'DATA_TOPUP', 'CABLE_RECHARGE'];
    if (!redemptionType || !ALLOWED_REDEMPTION_TYPES.includes(redemptionType)) {
      return res.status(400).json({ error: 'Invalid redemption type.' });
    }
  }

  const ledger = db.getTable('points_ledger');
  const customerLedger = ledger.filter(l => l.customer_id === customerId);
  const currentBalance = customerLedger.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  if (currentBalance < parseFloat(amount)) {
    return res.status(400).json({ error: 'Insufficient points balance' });
  }

  const redeemAmount = -Math.abs(parseFloat(amount));
  const ledgerId = 'l-' + generateId();
  const pts = parseFloat(amount);
  const finalRedemptionType = partner_package_id ? (pkg.service_type === 'CABLE' ? 'CABLE_RECHARGE' : 'BROADBAND_DISCOUNT') : redemptionType;
  const description = partner_package_id ? `Partner Package Redemption: ${pkg.name}` : getRedemptionDescription(finalRedemptionType, pts);

  ledger.push({
    id: ledgerId,
    tenant_id: customer.tenant_id,
    region_id: customer.region_id,
    customer_id: customer.id,
    amount: redeemAmount,
    type: 'REDEEM',
    redemption_type: finalRedemptionType,
    order_id: null,
    description,
    created_at: new Date().toISOString(),
    billing_sync_status: 'PENDING'
  });
  db.saveTable('points_ledger', ledger);

  let approvalId = null;
  if (partner_package_id) {
    const redemptionApprovals = db.getTable('redemption_approvals');
    approvalId = 'ra-' + generateId();
    const now = new Date().toISOString();
    const approvalRow = {
      id: approvalId,
      ledger_id: ledgerId,
      customer_user_id: customer.id,
      partner_id: pkg.partner_id,
      partner_package_id: pkg.id,
      face_value_rupees: pkg.face_value_rupees,
      points_deducted: pkg.point_cost,
      status: 'PENDING_ADMIN_APPROVAL',
      admin_notes: null,
      partner_notes: null,
      rejected_reason: null,
      disputed_reason: null,
      admin_id: null,
      approved_at: null,
      rejected_at: null,
      fulfilled_at: null,
      disputed_at: null,
      refund_ledger_id: null,
      created_at: now,
      updated_at: now
    };
    redemptionApprovals.push(approvalRow);
    db.saveTable('redemption_approvals', redemptionApprovals);
  }

  const responseObj = {
    success: true,
    ledgerId,
    remaining_balance: currentBalance + redeemAmount,
    message: 'Points successfully queued for redemption.'
  };
  if (approvalId) {
    responseObj.approval_id = approvalId;
    responseObj.redemption_approval = db.getTable('redemption_approvals').find(a => a.id === approvalId);
  }
  return res.json(responseObj);
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

// Commission Config (Part 5)
app.get('/api/admin/commission-config', (req, res) => {
  const configs = db.getTable('commission_config');
  return res.json(configs);
});

app.get('/api/admin/commission-config/effective', (req, res) => {
  const stockistId = req.query.stockist_id || null;
  const cfg = getCommissionConfig(stockistId);
  return res.json(cfg);
});

app.post('/api/admin/commission-config', (req, res) => {
  const { scope, stockist_id, stockist_reinvest_pct, points_from_pot_pct, partner_redemption_cut_pct } = req.body;

  if (!scope || !['GLOBAL', 'STORE'].includes(scope)) {
    return res.status(400).json({ error: 'Valid scope required (GLOBAL or STORE)' });
  }

  if (scope === 'STORE' && !stockist_id) {
    return res.status(400).json({ error: 'stockist_id is required for STORE scope' });
  }

  const reinvest = parseFloat(stockist_reinvest_pct);
  const points = parseFloat(points_from_pot_pct);
  const cut = parseFloat(partner_redemption_cut_pct);

  if (isNaN(reinvest) || reinvest < 0 || reinvest > 100 ||
      isNaN(points) || points < 0 || points > 100 ||
      isNaN(cut) || cut < 0 || cut > 100) {
    return res.status(400).json({ error: 'Config values must be numbers between 0 and 100' });
  }

  const configs = db.getTable('commission_config');
  let row = null;
  let isCreate = false;

  if (scope === 'GLOBAL') {
    row = configs.find(c => c.scope === 'GLOBAL');
    if (!row) {
      isCreate = true;
      row = {
        id: 'cc-default',
        scope: 'GLOBAL',
        stockist_id: null,
        created_at: new Date().toISOString()
      };
      configs.push(row);
    }
  } else {
    row = configs.find(c => c.scope === 'STORE' && c.stockist_id === stockist_id);
    if (!row) {
      isCreate = true;
      row = {
        id: 'cc-' + generateId(),
        scope: 'STORE',
        stockist_id,
        created_at: new Date().toISOString()
      };
      configs.push(row);
    }
  }

  const before = { ...row };

  row.stockist_reinvest_pct = reinvest;
  row.points_from_pot_pct = points;
  row.partner_redemption_cut_pct = cut;
  row.updated_at = new Date().toISOString();

  db.saveTable('commission_config', configs);

  const action = isCreate ? 'COMMISSION_CONFIG_CREATE' : 'COMMISSION_CONFIG_UPDATE';
  appendAudit(req, action, 'commission_config', row.id, before, row);

  return res.json({ success: true, config: row });
});

app.delete('/api/admin/commission-config/:id', (req, res) => {
  const { id } = req.params;
  const configs = db.getTable('commission_config');
  const index = configs.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Config not found' });
  }

  const target = configs[index];
  if (target.scope === 'GLOBAL' || target.id === 'cc-default') {
    return res.status(400).json({ error: 'cannot delete global default' });
  }

  const deletedRow = configs.splice(index, 1)[0];
  db.saveTable('commission_config', configs);

  appendAudit(req, 'COMMISSION_CONFIG_DELETE', 'commission_config', target.id, deletedRow, null);

  return res.json({ success: true, message: 'Store override deleted' });
});

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
    name: name.trim(),
    phone: phone.trim(),
    created_at: new Date().toISOString(),
    status: 'NEW',
    notes: []
  };
  leads.push(newLead);
  db.saveTable('partner_leads', leads);
  return res.json({ success: true, lead: newLead });
});

app.get('/api/admin/partner-leads', (req, res) => {
  let leads = db.getTable('partner_leads');
  const { status, region_id } = req.query;
  if (status) leads = leads.filter(l => l.status === status);
  if (region_id) leads = leads.filter(l => l.region_id === region_id);
  const enriched = leads.map(l => ({
    ...l,
    notes: l.notes || [],
    status: l.status || 'NEW'
  })).reverse();
  return res.json(enriched);
});

app.post('/api/admin/partner-leads/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['NEW', 'CONTACTED', 'NEGOTIATING', 'ONBOARDED', 'REJECTED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const leads = db.getTable('partner_leads');
  const lead = leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const oldStatus = lead.status || 'NEW';
  lead.status = status;
  db.saveTable('partner_leads', leads);
  appendAudit(req, 'UPDATE_LEAD_STATUS', 'partner_lead', id, { status: oldStatus }, { status });
  return res.json({ success: true, lead });
});

app.post('/api/admin/partner-leads/:id/notes', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Note text is required' });
  const leads = db.getTable('partner_leads');
  const lead = leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.notes) lead.notes = [];
  const noteObj = {
    id: 'n-' + generateId(),
    text: text.trim(),
    admin_id: req.body.admin_id || 'u-admin',
    created_at: new Date().toISOString()
  };
  lead.notes.push(noteObj);
  db.saveTable('partner_leads', leads);
  appendAudit(req, 'ADD_LEAD_NOTE', 'partner_lead', id, null, { note: text.trim() });
  return res.json({ success: true, lead });
});

app.delete('/api/admin/partner-leads/:id', (req, res) => {
  const { id } = req.params;
  const leads = db.getTable('partner_leads');
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  const oldLead = leads[idx];
  leads.splice(idx, 1);
  db.saveTable('partner_leads', leads);
  appendAudit(req, 'DELETE_LEAD', 'partner_lead', id, oldLead, null);
  return res.json({ success: true, message: 'Partner lead deleted' });
});

// Admin Audit Log GET
app.get('/api/admin/audit-log', (req, res) => {
  let log = db.getTable('admin_audit_log');
  const { admin_id, entity_type, action, start_date, end_date } = req.query;
  if (admin_id) log = log.filter(l => l.admin_user_id === admin_id);
  if (entity_type) log = log.filter(l => l.entity_type === entity_type);
  if (action) log = log.filter(l => l.action === action);
  if (start_date) log = log.filter(l => new Date(l.created_at) >= new Date(start_date));
  if (end_date) log = log.filter(l => new Date(l.created_at) <= new Date(end_date));
  return res.json(log.slice().reverse());
});

// Customer Fraud Report Submission
app.post('/api/customer/fraud-reports', (req, res) => {
  const { customerId, subject, description, linkedEntityType, linkedEntityId } = req.body;
  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: 'Subject is required' });
  }
  if (!description || description.trim().length < 20) {
    return res.status(400).json({ error: 'Description must be at least 20 characters long' });
  }
  const reports = db.getTable('fraud_reports');
  const report = {
    id: 'fr-' + generateId(),
    reporter_customer_id: customerId,
    subject: subject.trim(),
    description: description.trim(),
    linked_entity_type: linkedEntityType || null,
    linked_entity_id: linkedEntityId || null,
    status: 'NEW',
    admin_notes: '',
    created_at: new Date().toISOString(),
    resolved_at: null
  };
  reports.push(report);
  db.saveTable('fraud_reports', reports);
  return res.json({ success: true, report });
});

// Admin GET Fraud Reports
app.get('/api/admin/fraud-reports', (req, res) => {
  let reports = db.getTable('fraud_reports');
  const users = db.getTable('users');
  const { status, region_id } = req.query;
  if (status) {
    reports = reports.filter(r => r.status === status);
  }
  if (region_id) {
    reports = reports.filter(r => {
      const reporter = users.find(u => u.id === r.reporter_customer_id);
      return reporter && reporter.region_id === region_id;
    });
  }
  const enriched = reports.map(r => {
    const reporter = users.find(u => u.id === r.reporter_customer_id);
    return {
      ...r,
      reporter_name: reporter ? reporter.name : 'Unknown',
      reporter_phone: reporter ? reporter.phone : '',
      reporter_region_id: reporter ? reporter.region_id : null
    };
  }).reverse();
  return res.json(enriched);
});

// Admin Update Fraud Report Status
app.post('/api/admin/fraud-reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const validStatuses = ['NEW', 'TRIAGING', 'RESOLVED', 'DISMISSED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (['RESOLVED', 'DISMISSED'].includes(status)) {
    if (!adminNotes || adminNotes.trim().length < 10) {
      return res.status(400).json({ error: 'Admin notes of at least 10 characters required when resolving or dismissing' });
    }
  }
  const reports = db.getTable('fraud_reports');
  const report = reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'Fraud report not found' });
  const oldStatus = report.status;
  report.status = status;
  if (adminNotes) report.admin_notes = adminNotes.trim();
  if (['RESOLVED', 'DISMISSED'].includes(status)) {
    report.resolved_at = new Date().toISOString();
  }
  db.saveTable('fraud_reports', reports);
  appendAudit(req, 'UPDATE_FRAUD_REPORT_STATUS', 'fraud_report', id, { status: oldStatus }, { status, admin_notes: report.admin_notes }, adminNotes);
  return res.json({ success: true, report });
});

// Admin Customers Endpoints
app.get('/api/admin/customers', (req, res) => {
  const includeInactive = req.query.include_inactive === 'true';
  const users = db.getTable('users').filter(u => u.role === 'CUSTOMER');
  const pointsLedger = db.getTable('points_ledger');
  const orders = db.getTable('orders');
  
  const filteredUsers = includeInactive ? users : users.filter(u => u.is_active !== false);
  const result = filteredUsers.map(u => {
    const custLedger = pointsLedger.filter(l => l.customer_id === u.id);
    const balance = custLedger.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
    const custOrders = orders.filter(o => o.customer_id === u.id);
    return {
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email || '',
      region_id: u.region_id,
      is_active: u.is_active !== false,
      points_balance: balance,
      total_orders: custOrders.length,
      created_at: u.created_at,
      role: u.role,
      address: u.address || ''
    };
  });
  return res.json(result);
});

app.get('/api/admin/customers/:id', (req, res) => {
  const { id } = req.params;
  const users = db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  
  const pointsLedger = db.getTable('points_ledger').filter(l => l.customer_id === id);
  const balance = pointsLedger.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const orders = db.getTable('orders').filter(o => o.customer_id === id).map(o => enrichOrder(o));
  const fraudReports = db.getTable('fraud_reports').filter(f => f.reporter_customer_id === id);
  
  return res.json({
    customer: { ...user, is_active: user.is_active !== false, points_balance: balance },
    orders,
    ledger: pointsLedger.slice().reverse(),
    fraud_reports: fraudReports.slice().reverse()
  });
});

app.post('/api/admin/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const users = db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  const before = { name: user.name, email: user.email || '' };
  if (name) user.name = name.trim();
  if (email !== undefined) user.email = email.trim();
  db.saveTable('users', users);
  appendAudit(req, 'EDIT_CUSTOMER', 'customer', id, before, { name: user.name, email: user.email });
  return res.json({ success: true, customer: user });
});

app.post('/api/admin/customers/:id/phone-change', (req, res) => {
  const { id } = req.params;
  const { currentPhoneOtp, newPhone, newPhoneOtp } = req.body;
  const users = db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  if (!newPhone || !newPhone.trim()) return res.status(400).json({ error: 'New phone is required' });
  if (currentPhoneOtp && currentPhoneOtp !== '123456') {
    return res.status(400).json({ error: 'Invalid OTP for current phone' });
  }
  if (newPhoneOtp && newPhoneOtp !== '123456') {
    return res.status(400).json({ error: 'Invalid OTP for new phone' });
  }
  const oldPhone = user.phone;
  user.phone = newPhone.trim();
  db.saveTable('users', users);
  appendAudit(req, 'CHANGE_PHONE', 'customer', id, { phone: oldPhone }, { phone: user.phone });
  return res.json({ success: true, user });
});

app.post('/api/admin/customers/:id/points-credit', (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Reason is required' });
  }
  const users = db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  
  const ledger = db.getTable('points_ledger');
  const entry = {
    id: 'l-' + generateId(),
    tenant_id: user.tenant_id || 't1',
    region_id: user.region_id || 'r1',
    customer_id: id,
    amount: numAmount,
    type: 'MANUAL_CREDIT',
    source: 'ADMIN',
    admin_id: req.body.admin_id || 'u-admin',
    reason: reason.trim(),
    order_id: null,
    description: `Manual admin credit: ${reason.trim()}`,
    created_at: new Date().toISOString()
  };
  ledger.push(entry);
  db.saveTable('points_ledger', ledger);
  
  appendAudit(req, 'MANUAL_POINTS_CREDIT', 'customer', id, null, { amount: numAmount, reason: reason.trim() }, reason.trim());
  
  const updatedLedger = ledger.filter(l => l.customer_id === id);
  const newBalance = updatedLedger.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  return res.json({ success: true, new_balance: newBalance, entry });
});

app.post('/api/admin/customers/:id/deactivate', (req, res) => {
  const { id } = req.params;
  const users = db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  user.is_active = false;
  db.saveTable('users', users);
  appendAudit(req, 'DEACTIVATE_CUSTOMER', 'customer', id, { is_active: true }, { is_active: false });
  return res.json({ success: true, user });
});

app.post('/api/admin/customers/:id/reactivate', (req, res) => {
  const { id } = req.params;
  const users = db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  user.is_active = true;
  db.saveTable('users', users);
  appendAudit(req, 'REACTIVATE_CUSTOMER', 'customer', id, { is_active: false }, { is_active: true });
  return res.json({ success: true, user });
});

// Admin Stockists Endpoints
app.get('/api/admin/stockists', (req, res) => {
  const includeInactive = req.query.include_inactive === 'true';
  const stockists = db.getTable('stockists');
  const orders = db.getTable('orders');
  const rates = db.getTable('stockist_commission_rates');
  const users = db.getTable('users');
  
  const filtered = includeInactive ? stockists : stockists.filter(s => s.is_active !== false);
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  const result = filtered.map(s => {
    const stkOrders = orders.filter(o => o.stockist_id === s.id);
    const delivered30d = stkOrders.filter(o => o.status === 'DELIVERED' && new Date(o.created_at).getTime() >= thirtyDaysAgo);
    const gmv30d = delivered30d.reduce((sum, o) => sum + (parseFloat(o.total) || parseFloat(o.subtotal) || 0), 0);
    const pendingCount = stkOrders.filter(o => ['CONFIRMING', 'PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)).length;
    const stkRates = rates.filter(r => r.stockist_id === s.id);
    const latestRate = stkRates.length > 0 ? stkRates[stkRates.length - 1].rate_percent : 10.0;
    const user = users.find(u => u.id === s.user_id);
    return {
      ...s,
      is_active: s.is_active !== false,
      user_name: user ? user.name : s.name,
      user_phone: user ? user.phone : '',
      gmv_30d: gmv30d,
      pending_orders_count: pendingCount,
      commission_rate: latestRate
    };
  });
  return res.json(result);
});

app.get('/api/admin/stockists/:id', (req, res) => {
  const { id } = req.params;
  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === id);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
  const users = db.getTable('users');
  const user = users.find(u => u.id === stockist.user_id);
  const orders = db.getTable('orders').filter(o => o.stockist_id === id).map(o => enrichOrder(o));
  const rates = db.getTable('stockist_commission_rates').filter(r => r.stockist_id === id);
  const latestRate = rates.length > 0 ? rates[rates.length - 1].rate_percent : 10.0;
  
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const totalCommissionEarned = deliveredOrders.reduce((sum, o) => sum + ((parseFloat(o.subtotal) || 0) * (latestRate / 100)), 0);
  
  const inventory = db.getTable('stockist_inventory').filter(si => si.stockist_id === id);

  return res.json({
    stockist: { ...stockist, is_active: stockist.is_active !== false, commission_rate: latestRate },
    user,
    orders,
    commission_rates: rates,
    total_commission_earned: totalCommissionEarned,
    inventory
  });
});

app.post('/api/admin/stockists', (req, res) => {
  const { name, region_id, vendor_id, phone, delivery_radius_km, opening_time, closing_time, prep_eta_minutes, commission_rate } = req.body;
  if (!name || !region_id || !phone) {
    return res.status(400).json({ error: 'Name, region_id, and phone are required' });
  }
  const users = db.getTable('users');
  const newUserId = 'u-stk-' + generateId();
  const newUser = {
    id: newUserId,
    tenant_id: 't1',
    region_id,
    phone: phone.trim(),
    name: name.trim(),
    role: 'STOCKIST',
    kyc_status: 'APPROVED',
    no_show_count: 0,
    is_active: true,
    created_at: new Date().toISOString()
  };
  users.push(newUser);
  db.saveTable('users', users);
  
  const stockists = db.getTable('stockists');
  const newStockistId = 's-' + generateId();
  const newStockist = {
    id: newStockistId,
    tenant_id: 't1',
    region_id,
    user_id: newUserId,
    name: name.trim(),
    vendor_id: vendor_id || 'v1',
    delivery_radius_km: parseFloat(delivery_radius_km) || 3.0,
    min_order_value: 0,
    is_active: true,
    opening_time: opening_time || '08:00',
    closing_time: closing_time || '20:00',
    prep_eta_minutes: parseInt(prep_eta_minutes) || 15,
    created_at: new Date().toISOString()
  };
  stockists.push(newStockist);
  db.saveTable('stockists', stockists);
  
  const rateVal = parseFloat(commission_rate) || 10.0;
  const rates = db.getTable('stockist_commission_rates');
  rates.push({ id: 'scr-' + generateId(), stockist_id: newStockistId, rate_percent: rateVal, created_at: new Date().toISOString() });
  db.saveTable('stockist_commission_rates', rates);
  
  if (vendor_id) {
    const sv = db.getTable('stockist_vendors');
    sv.push({ stockist_id: newStockistId, vendor_id, approved_at: new Date().toISOString() });
    db.saveTable('stockist_vendors', sv);
  }
  
  appendAudit(req, 'CREATE_STOCKIST', 'stockist', newStockistId, null, newStockist);
  return res.json({ success: true, stockist: newStockist, user: newUser });
});

app.post('/api/admin/stockists/:id', (req, res) => {
  const { id } = req.params;
  const { name, address, opening_time, closing_time, prep_eta_minutes, delivery_radius_km } = req.body;
  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === id);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
  const before = { name: stockist.name, opening_time: stockist.opening_time, closing_time: stockist.closing_time, prep_eta_minutes: stockist.prep_eta_minutes, delivery_radius_km: stockist.delivery_radius_km };
  if (name) stockist.name = name.trim();
  if (opening_time) stockist.opening_time = opening_time;
  if (closing_time) stockist.closing_time = closing_time;
  if (prep_eta_minutes !== undefined) stockist.prep_eta_minutes = parseInt(prep_eta_minutes);
  if (delivery_radius_km !== undefined) stockist.delivery_radius_km = parseFloat(delivery_radius_km);
  db.saveTable('stockists', stockists);
  
  if (address) {
    const users = db.getTable('users');
    const user = users.find(u => u.id === stockist.user_id);
    if (user) { user.address = address.trim(); db.saveTable('users', users); }
  }
  
  appendAudit(req, 'EDIT_STOCKIST', 'stockist', id, before, stockist);
  return res.json({ success: true, stockist });
});

app.post('/api/admin/stockists/:id/commission-rate', (req, res) => {
  const { id } = req.params;
  const { rate_percent, confirmationText } = req.body;
  const numRate = parseFloat(rate_percent);
  if (isNaN(numRate) || numRate < 0 || numRate > 100) {
    return res.status(400).json({ error: 'Valid commission rate percent required (0-100)' });
  }
  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === id);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
  
  const rates = db.getTable('stockist_commission_rates');
  const stkRates = rates.filter(r => r.stockist_id === id);
  const currentRate = stkRates.length > 0 ? stkRates[stkRates.length - 1].rate_percent : 10.0;
  
  const orders = db.getTable('orders');
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const delivered30d = orders.filter(o => o.stockist_id === id && o.status === 'DELIVERED' && new Date(o.created_at).getTime() >= thirtyDaysAgo);
  
  const currentEarnings = delivered30d.reduce((sum, o) => sum + ((parseFloat(o.subtotal) || 0) * (currentRate / 100)), 0);
  const newEarnings = delivered30d.reduce((sum, o) => sum + ((parseFloat(o.subtotal) || 0) * (numRate / 100)), 0);
  
  if (confirmationText !== 'CONFIRM') {
    return res.json({
      preview: true,
      current_rate: currentRate,
      new_rate: numRate,
      current_earnings_30d: currentEarnings,
      new_earnings_30d: newEarnings
    });
  }
  
  rates.push({ id: 'scr-' + generateId(), stockist_id: id, rate_percent: numRate, created_at: new Date().toISOString() });
  db.saveTable('stockist_commission_rates', rates);
  
  appendAudit(req, 'CHANGE_COMMISSION_RATE', 'stockist', id, { rate_percent: currentRate }, { rate_percent: numRate });
  return res.json({
    success: true,
    current_rate: currentRate,
    new_rate: numRate,
    current_earnings_30d: currentEarnings,
    new_earnings_30d: newEarnings
  });
});

app.post('/api/admin/stockists/:id/region', (req, res) => {
  const { id } = req.params;
  const { region_id } = req.body;
  if (!region_id) return res.status(400).json({ error: 'region_id is required' });
  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === id);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
  
  const orders = db.getTable('orders').filter(o => o.stockist_id === id);
  const activeBindingsCount = new Set(orders.map(o => o.customer_id)).size;
  
  const oldRegion = stockist.region_id;
  stockist.region_id = region_id;
  db.saveTable('stockists', stockists);
  
  const users = db.getTable('users');
  const user = users.find(u => u.id === stockist.user_id);
  if (user) { user.region_id = region_id; db.saveTable('users', users); }
  
  appendAudit(req, 'CHANGE_STOCKIST_REGION', 'stockist', id, { region_id: oldRegion }, { region_id }, `Bound active customers count: ${activeBindingsCount}`);
  return res.json({ success: true, active_customer_bindings_count: activeBindingsCount, stockist });
});

app.post('/api/admin/stockists/:id/deactivate', (req, res) => {
  const { id } = req.params;
  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === id);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
  stockist.is_active = false;
  db.saveTable('stockists', stockists);
  appendAudit(req, 'DEACTIVATE_STOCKIST', 'stockist', id, { is_active: true }, { is_active: false });
  return res.json({ success: true, stockist });
});

app.post('/api/admin/stockists/:id/reactivate', (req, res) => {
  const { id } = req.params;
  const stockists = db.getTable('stockists');
  const stockist = stockists.find(s => s.id === id);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });
  stockist.is_active = true;
  db.saveTable('stockists', stockists);
  appendAudit(req, 'REACTIVATE_STOCKIST', 'stockist', id, { is_active: false }, { is_active: true });
  return res.json({ success: true, stockist });
});

app.delete('/api/admin/stockists/:id', (req, res) => {
  const { id } = req.params;
  const orders = db.getTable('orders');
  const hasOrders = orders.some(o => o.stockist_id === id);
  if (hasOrders) {
    return res.status(400).json({ error: 'Cannot delete: stockist has order history. Deactivate instead.' });
  }
  const stockists = db.getTable('stockists');
  const idx = stockists.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Stockist not found' });
  const oldStockist = stockists[idx];
  stockists.splice(idx, 1);
  db.saveTable('stockists', stockists);
  
  if (oldStockist.user_id) {
    const users = db.getTable('users');
    const uIdx = users.findIndex(u => u.id === oldStockist.user_id);
    if (uIdx !== -1) { users.splice(uIdx, 1); db.saveTable('users', users); }
  }
  
  appendAudit(req, 'DELETE_STOCKIST', 'stockist', id, oldStockist, null);
  return res.json({ success: true, message: 'Stockist deleted successfully' });
});

// Customer Fraud Reports (R4)
app.post('/api/customer/fraud-reports', (req, res) => {
  const { customerId, subject, description, linkedEntityType, linkedEntityId } = req.body;
  if (!customerId || !subject) {
    return res.status(400).json({ error: 'customerId and subject are required' });
  }
  if (!description || description.trim().length < 20) {
    return res.status(400).json({ error: 'description must be at least 20 characters' });
  }
  const reports = db.getTable('fraud_reports');
  const newReport = {
    id: 'fr-' + generateId(),
    reporter_customer_id: customerId,
    subject: subject.trim(),
    description: description.trim(),
    linked_entity_type: linkedEntityType || null,
    linked_entity_id: linkedEntityId || null,
    status: 'NEW',
    admin_notes: '',
    created_at: new Date().toISOString(),
    resolved_at: null
  };
  reports.push(newReport);
  db.saveTable('fraud_reports', reports);
  return res.json({ success: true, report: newReport });
});

app.get('/api/admin/fraud-reports', (req, res) => {
  const reports = db.getTable('fraud_reports');
  return res.json(reports);
});

app.post('/api/admin/fraud-reports/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const allowedStatuses = ['NEW', 'TRIAGING', 'RESOLVED', 'DISMISSED'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status required (NEW, TRIAGING, RESOLVED, DISMISSED)' });
  }
  if (['RESOLVED', 'DISMISSED'].includes(status)) {
    if (!adminNotes || adminNotes.trim().length < 10) {
      return res.status(400).json({ error: 'adminNotes (at least 10 chars) are required for RESOLVED or DISMISSED status' });
    }
  }
  const reports = db.getTable('fraud_reports');
  const report = reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  
  const before = { status: report.status, admin_notes: report.admin_notes };
  report.status = status;
  if (adminNotes) report.admin_notes = adminNotes.trim();
  if (['RESOLVED', 'DISMISSED'].includes(status)) {
    report.resolved_at = new Date().toISOString();
  }
  db.saveTable('fraud_reports', reports);
  appendAudit(req, 'UPDATE_FRAUD_REPORT_STATUS', 'fraud_report', id, before, { status: report.status, admin_notes: report.admin_notes }, adminNotes);
  return res.json({ success: true, report });
});

// Partner Leads Admin Operations (R7)
app.post('/api/admin/partner-leads/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['NEW', 'CONTACTED', 'NEGOTIATING', 'ONBOARDED', 'REJECTED'];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: 'Valid status required' });
  }
  const leads = db.getTable('partner_leads');
  const lead = leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const before = { status: lead.status };
  lead.status = status;
  db.saveTable('partner_leads', leads);
  appendAudit(req, 'UPDATE_PARTNER_LEAD_STATUS', 'partner_lead', id, before, { status });
  return res.json({ success: true, lead });
});

app.post('/api/admin/partner-leads/:id/notes', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });
  const leads = db.getTable('partner_leads');
  const lead = leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.notes) lead.notes = [];
  const noteObj = { text: text.trim(), admin_user_id: req.headers['x-admin-id'] || 'u-admin', timestamp: new Date().toISOString() };
  lead.notes.push(noteObj);
  db.saveTable('partner_leads', leads);
  appendAudit(req, 'ADD_PARTNER_LEAD_NOTE', 'partner_lead', id, null, noteObj);
  return res.json({ success: true, lead });
});

app.delete('/api/admin/partner-leads/:id', (req, res) => {
  const { id } = req.params;
  const leads = db.getTable('partner_leads');
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  const oldLead = leads[idx];
  leads.splice(idx, 1);
  db.saveTable('partner_leads', leads);
  appendAudit(req, 'DELETE_PARTNER_LEAD', 'partner_lead', id, oldLead, null);
  return res.json({ success: true, message: 'Lead deleted' });
});

// Admin Audit Log (Part 3)
app.get('/api/admin/audit-log', (req, res) => {
  const logs = db.getTable('admin_audit_log');
  return res.json(logs);
});

// Test helper endpoints for Mock Email Outbox
app.get('/api/test/mock-outbox', (req, res) => {
  return res.json(emailHelper.getMockOutbox());
});

app.post('/api/test/clear-mock-outbox', (req, res) => {
  emailHelper.clearMockOutbox();
  return res.json({ success: true });
});

// ==========================================
// ROUND P1 — PARTNER MODEL & AUTH ENDPOINTS
// ==========================================

const ALLOWED_SERVICE_TYPES = ['CABLE', 'BROADBAND', 'DTH', 'OTT_BUNDLE'];

function getPartnerSession(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const { userId, role } = sessionHelper.verifySession(token);
    if (role !== 'PARTNER_ADMIN') return null;
    const users = db.getTable('users');
    const user = users.find(u => u.id === userId && u.is_active !== false);
    if (!user) return null;
    const partnerUsers = db.getTable('partner_users');
    const pu = partnerUsers.find(p => p.user_id === userId);
    if (!pu) return null;
    const partners = db.getTable('partners');
    const partner = partners.find(p => p.id === pu.partner_id);
    if (!partner) return null;
    return { user, partner, userId: user.id, partnerId: partner.id };
  } catch (err) {
    return null;
  }
}

// 3.1 POST /api/partner/auth/set-password
app.post('/api/partner/auth/set-password', (req, res) => {
  const { user_id, current_password, new_password } = req.body;
  if (!new_password || typeof new_password !== 'string' || new_password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  let targetUserId = user_id;
  let authSuccess = false;

  const session = getPartnerSession(req);
  if (session) {
    targetUserId = session.userId;
    authSuccess = true;
  } else if (current_password && targetUserId) {
    const users = db.getTable('users');
    const user = users.find(u => u.id === targetUserId);
    if (user && user.password_hash && bcrypt.compareSync(current_password, user.password_hash)) {
      authSuccess = true;
    }
  }

  if (!authSuccess || !targetUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const users = db.getTable('users');
  const user = users.find(u => u.id === targetUserId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password_hash = bcrypt.hashSync(new_password, 10);
  db.saveTable('users', users);

  appendAudit(req, 'PARTNER_SET_PASSWORD', 'users', user.id, null, { password_updated: true });
  return res.json({ success: true, message: 'Password set successfully.' });
});

// 3.2 POST /api/partner/auth/login-password
app.post('/api/partner/auth/login-password', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  let attempts = loginPasswordFailedAttempts.get(normalizedEmail) || [];
  attempts = attempts.filter(ts => now - ts < 15 * 60 * 1000);
  loginPasswordFailedAttempts.set(normalizedEmail, attempts);

  if (attempts.length >= 5) {
    return res.status(429).json({ error: 'Too many failed attempts. Try again later.' });
  }

  const users = db.getTable('users');
  const user = users.find(u => u.role === 'PARTNER_ADMIN' && u.email && u.email.trim().toLowerCase() === normalizedEmail && u.is_active !== false);

  if (user && user.password_hash && bcrypt.compareSync(password, user.password_hash)) {
    loginPasswordFailedAttempts.delete(normalizedEmail);

    const partnerUsers = db.getTable('partner_users');
    const pu = partnerUsers.find(p => p.user_id === user.id);
    const partners = db.getTable('partners');
    const partner = pu ? partners.find(p => p.id === pu.partner_id) : null;

    const token = sessionHelper.signSession(user.id, user.role);
    return res.json({
      session_token: token,
      user: sanitizeUser(user),
      partner: partner || null
    });
  }

  attempts.push(now);
  loginPasswordFailedAttempts.set(normalizedEmail, attempts);
  return res.status(401).json({ error: 'Invalid credentials' });
});

// 3.3 POST /api/partner/auth/login-otp-request
app.post('/api/partner/auth/login-otp-request', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const now = Date.now();
  let attempts = otpRequestAttempts.get(phone) || [];
  attempts = attempts.filter(ts => now - ts < 5 * 60 * 1000);
  otpRequestAttempts.set(phone, attempts);

  if (attempts.length >= 3) {
    return res.status(429).json({ error: 'Too many OTP requests. Try again later.' });
  }
  attempts.push(now);
  otpRequestAttempts.set(phone, attempts);

  const users = db.getTable('users');
  const user = users.find(u => u.role === 'PARTNER_ADMIN' && u.phone === phone && u.is_active !== false);

  if (user) {
    otpStore.set(phone, { otp: '123456', expiresAt: Date.now() + 10 * 60 * 1000 });
  }

  return res.json({ success: true, message: 'OTP sent successfully if phone is registered.' });
});

// 3.4 POST /api/partner/auth/login-otp-verify
app.post('/api/partner/auth/login-otp-verify', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  const users = db.getTable('users');
  const user = users.find(u => u.role === 'PARTNER_ADMIN' && u.phone === phone && u.is_active !== false);

  if (!user || otp !== '123456') {
    return res.status(401).json({ error: 'Invalid credentials or OTP' });
  }

  const partnerUsers = db.getTable('partner_users');
  const pu = partnerUsers.find(p => p.user_id === user.id);
  const partners = db.getTable('partners');
  const partner = pu ? partners.find(p => p.id === pu.partner_id) : null;

  const token = sessionHelper.signSession(user.id, user.role);
  return res.json({
    session_token: token,
    user: sanitizeUser(user),
    partner: partner || null
  });
});

// 3.5 POST /api/partner/auth/forgot-password
app.post('/api/partner/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  if (!emailHelper.isEmailConfigured()) {
    return res.status(503).json({ error: 'Email service unavailable' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = db.getTable('users');
  const user = users.find(u => u.role === 'PARTNER_ADMIN' && u.email && u.email.trim().toLowerCase() === normalizedEmail && u.is_active !== false);

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    resetTokens.set(token, { userId: user.id, expiresAt: Date.now() + 30 * 60 * 1000 });

    const baseUrl = process.env.APP_BASE_URL || 'localhost:3000';
    const resetUrl = `https://${baseUrl}/partner/reset-password?token=${token}`;

    emailHelper.sendEmail(
      user.email,
      'Partner Account Password Reset',
      `<p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
      `Reset your password: ${resetUrl}`
    ).catch(err => console.error('Failed to send reset email:', err));
  }

  return res.json({ success: true, message: 'If email exists, a password reset link has been sent.' });
});

// 3.6 POST /api/partner/auth/reset-password
app.post('/api/partner/auth/reset-password', (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password || typeof new_password !== 'string' || new_password.length < 8) {
    return res.status(400).json({ error: 'Invalid token or password too short (min 8 characters).' });
  }

  const tokenRecord = resetTokens.get(token);
  if (!tokenRecord || Date.now() > tokenRecord.expiresAt) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const users = db.getTable('users');
  const user = users.find(u => u.id === tokenRecord.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password_hash = bcrypt.hashSync(new_password, 10);
  db.saveTable('users', users);
  resetTokens.delete(token);

  appendAudit(req, 'PARTNER_RESET_PASSWORD', 'users', user.id, null, { password_reset: true });
  return res.json({ success: true, message: 'Password reset successfully.' });
});

// 3.7 GET /api/partner/auth/session
app.get('/api/partner/auth/session', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized or invalid session' });
  }
  return res.json({
    user: sanitizeUser(session.user),
    partner: session.partner
  });
});

// 4.1 POST /api/admin/partners
app.post('/api/admin/partners', (req, res) => {
  const { legal_name, display_name, contact_phone, contact_email, address, service_types, admin_id, gst_number } = req.body;
  if (!legal_name || !display_name || !contact_phone || !service_types || !Array.isArray(service_types) || service_types.length === 0) {
    return res.status(400).json({ error: 'Missing required partner fields' });
  }
  if (!service_types.every(st => ALLOWED_SERVICE_TYPES.includes(st))) {
    return res.status(400).json({ error: 'Invalid service_types enum' });
  }

  const users = db.getTable('users');
  if (users.some(u => u.phone === contact_phone)) {
    return res.status(409).json({ error: 'Phone number already registered' });
  }
  if (contact_email && users.some(u => u.email && u.email.trim().toLowerCase() === contact_email.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const now = new Date().toISOString();
  const userId = 'u-' + generateId();
  const partnerId = 'ptr-' + generateId();
  const partnerUserId = 'pu-' + generateId();

  const newUser = {
    id: userId,
    tenant_id: 't1',
    region_id: null,
    phone: contact_phone,
    email: contact_email || null,
    password_hash: null,
    name: display_name,
    role: 'PARTNER_ADMIN',
    kyc_status: 'PENDING',
    no_show_count: 0,
    address: address || '',
    created_at: now
  };
  users.push(newUser);
  db.saveTable('users', users);

  const partners = db.getTable('partners');
  const newPartner = {
    id: partnerId,
    tenant_id: 't1',
    legal_name,
    display_name,
    contact_phone,
    contact_email: contact_email || null,
    address: address || '',
    gst_number: gst_number || null,
    service_types,
    is_active: true,
    onboarded_at: now,
    onboarded_by_admin_id: admin_id || 'u-admin',
    promoted_from_lead_id: null,
    created_at: now,
    updated_at: now
  };
  partners.push(newPartner);
  db.saveTable('partners', partners);

  const partnerUsers = db.getTable('partner_users');
  const newPU = {
    id: partnerUserId,
    partner_id: partnerId,
    user_id: userId,
    role: 'OWNER',
    created_at: now
  };
  partnerUsers.push(newPU);
  db.saveTable('partner_users', partnerUsers);

  appendAudit(req, 'PARTNER_CREATE', 'partner', partnerId, null, newPartner);
  return res.json({ partner: newPartner, user: sanitizeUser(newUser) });
});

// 4.2 POST /api/admin/partner-leads/:id/promote
app.post('/api/admin/partner-leads/:id/promote', (req, res) => {
  const { id } = req.params;
  const { admin_id, legal_name, display_name, service_types } = req.body;

  const leads = db.getTable('partner_leads');
  const lead = leads.find(l => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (lead.promoted_partner_id || lead.status === 'ONBOARDED') {
    return res.status(409).json({ error: 'Lead has already been promoted' });
  }

  if (!service_types || !Array.isArray(service_types) || service_types.length === 0 || !service_types.every(st => ALLOWED_SERVICE_TYPES.includes(st))) {
    return res.status(400).json({ error: 'Valid service_types array is required' });
  }

  const contact_phone = lead.phone;
  const contact_email = lead.email || null;
  const address = lead.address || '';
  const finalLegalName = legal_name || lead.business_name || lead.name;
  const finalDisplayName = display_name || lead.business_name || lead.name;

  const users = db.getTable('users');
  if (contact_phone && users.some(u => u.phone === contact_phone)) {
    return res.status(409).json({ error: 'Phone number already registered' });
  }
  if (contact_email && users.some(u => u.email && u.email.trim().toLowerCase() === contact_email.trim().toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const now = new Date().toISOString();
  const userId = 'u-' + generateId();
  const partnerId = 'ptr-' + generateId();
  const partnerUserId = 'pu-' + generateId();

  const newUser = {
    id: userId,
    tenant_id: 't1',
    region_id: null,
    phone: contact_phone,
    email: contact_email,
    password_hash: null,
    name: finalDisplayName,
    role: 'PARTNER_ADMIN',
    kyc_status: 'PENDING',
    no_show_count: 0,
    address: address,
    created_at: now
  };
  users.push(newUser);
  db.saveTable('users', users);

  const partners = db.getTable('partners');
  const newPartner = {
    id: partnerId,
    tenant_id: 't1',
    legal_name: finalLegalName,
    display_name: finalDisplayName,
    contact_phone,
    contact_email,
    address,
    gst_number: null,
    service_types,
    is_active: true,
    onboarded_at: now,
    onboarded_by_admin_id: admin_id || 'u-admin',
    promoted_from_lead_id: lead.id,
    created_at: now,
    updated_at: now
  };
  partners.push(newPartner);
  db.saveTable('partners', partners);

  const partnerUsers = db.getTable('partner_users');
  const newPU = {
    id: partnerUserId,
    partner_id: partnerId,
    user_id: userId,
    role: 'OWNER',
    created_at: now
  };
  partnerUsers.push(newPU);
  db.saveTable('partner_users', partnerUsers);

  const beforeLead = { status: lead.status, promoted_partner_id: lead.promoted_partner_id };
  lead.status = 'ONBOARDED';
  lead.promoted_partner_id = partnerId;
  lead.promoted_by_admin_id = admin_id || 'u-admin';
  lead.promoted_at = now;
  db.saveTable('partner_leads', leads);

  appendAudit(req, 'LEAD_PROMOTED', 'partner_lead', lead.id, beforeLead, lead);
  appendAudit(req, 'PARTNER_CREATE', 'partner', partnerId, null, newPartner);

  return res.json({ partner: newPartner, user: sanitizeUser(newUser), lead });
});

// 4.3 GET /api/admin/partners
app.get('/api/admin/partners', (req, res) => {
  const { is_active, region_id, service_type } = req.query;
  let partners = db.getTable('partners');
  const partnerRegions = db.getTable('partner_regions');
  const partnerPackages = db.getTable('partner_packages');
  const customerBindings = db.getTable('customer_partner_bindings');

  if (is_active !== undefined) {
    const activeBool = is_active === 'true';
    partners = partners.filter(p => p.is_active === activeBool);
  }

  if (region_id) {
    partners = partners.filter(p => partnerRegions.some(pr => pr.partner_id === p.id && pr.region_id === region_id && pr.is_active !== false));
  }

  if (service_type) {
    partners = partners.filter(p => Array.isArray(p.service_types) && p.service_types.includes(service_type));
  }

  const result = partners.map(p => {
    const regions = partnerRegions.filter(pr => pr.partner_id === p.id && pr.is_active !== false);
    const active_package_count = partnerPackages.filter(pp => pp.partner_id === p.id && pp.is_active !== false).length;
    const bound_customer_count = customerBindings.filter(cb => cb.cable_partner_id === p.id || cb.broadband_partner_id === p.id).length;
    return {
      ...p,
      regions,
      active_package_count,
      bound_customer_count
    };
  });

  return res.json(result);
});

// 4.4 GET /api/admin/partners/:id
app.get('/api/admin/partners/:id', (req, res) => {
  const { id } = req.params;
  const partners = db.getTable('partners');
  const partner = partners.find(p => p.id === id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  const partnerRegions = db.getTable('partner_regions').filter(pr => pr.partner_id === id);
  const partnerPackages = db.getTable('partner_packages').filter(pp => pp.partner_id === id);
  const partnerUsers = db.getTable('partner_users').filter(pu => pu.partner_id === id);
  const users = db.getTable('users');

  const joinedUsers = partnerUsers.map(pu => {
    const u = users.find(usr => usr.id === pu.user_id);
    return {
      ...pu,
      user: sanitizeUser(u)
    };
  });

  const customerBindings = db.getTable('customer_partner_bindings');
  const bound_customer_count = customerBindings.filter(cb => cb.cable_partner_id === id || cb.broadband_partner_id === id).length;

  return res.json({
    partner,
    regions: partnerRegions,
    packages: partnerPackages,
    users: joinedUsers,
    bound_customer_count
  });
});

// 4.5 PATCH /api/admin/partners/:id
app.patch('/api/admin/partners/:id', (req, res) => {
  const { id } = req.params;
  if (req.body.service_types !== undefined || req.body.promoted_from_lead_id !== undefined || req.body.id !== undefined) {
    return res.status(400).json({ error: 'Cannot update service_types or system fields directly via this endpoint' });
  }

  const partners = db.getTable('partners');
  const partner = partners.find(p => p.id === id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  const mutableFields = ['legal_name', 'display_name', 'contact_phone', 'contact_email', 'address', 'gst_number'];
  const before = { ...partner };

  mutableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      partner[field] = req.body[field];
    }
  });
  partner.updated_at = new Date().toISOString();
  db.saveTable('partners', partners);

  const partnerUsers = db.getTable('partner_users').filter(pu => pu.partner_id === id);
  const users = db.getTable('users');
  partnerUsers.forEach(pu => {
    const u = users.find(usr => usr.id === pu.user_id);
    if (u) {
      if (req.body.contact_phone) u.phone = req.body.contact_phone;
      if (req.body.contact_email !== undefined) u.email = req.body.contact_email;
      if (req.body.display_name) u.name = req.body.display_name;
    }
  });
  db.saveTable('users', users);

  appendAudit(req, 'EDIT_PARTNER', 'partner', id, before, partner);
  return res.json(partner);
});

// 4.6 POST /api/admin/partners/:id/deactivate and /reactivate
app.post('/api/admin/partners/:id/deactivate', (req, res) => {
  const { id } = req.params;
  const partners = db.getTable('partners');
  const partner = partners.find(p => p.id === id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  const before = { is_active: partner.is_active };
  partner.is_active = false;
  partner.updated_at = new Date().toISOString();
  db.saveTable('partners', partners);

  const packages = db.getTable('partner_packages');
  packages.forEach(pkg => {
    if (pkg.partner_id === id) {
      pkg.is_active = false;
      pkg.updated_at = new Date().toISOString();
    }
  });
  db.saveTable('partner_packages', packages);

  appendAudit(req, 'DEACTIVATE_PARTNER', 'partner', id, before, { is_active: false });
  return res.json(partner);
});

app.post('/api/admin/partners/:id/reactivate', (req, res) => {
  const { id } = req.params;
  const partners = db.getTable('partners');
  const partner = partners.find(p => p.id === id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  const before = { is_active: partner.is_active };
  partner.is_active = true;
  partner.updated_at = new Date().toISOString();
  db.saveTable('partners', partners);

  appendAudit(req, 'REACTIVATE_PARTNER', 'partner', id, before, { is_active: true });
  return res.json(partner);
});

// 4.7 POST /api/admin/partners/:id/service-types
app.post('/api/admin/partners/:id/service-types', (req, res) => {
  const { id } = req.params;
  const { service_types, confirm } = req.body;

  if (!service_types || !Array.isArray(service_types) || !service_types.every(st => ALLOWED_SERVICE_TYPES.includes(st))) {
    return res.status(400).json({ error: 'Invalid service_types enum' });
  }

  const partners = db.getTable('partners');
  const partner = partners.find(p => p.id === id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  const currentTypes = partner.service_types || [];
  const removedTypes = currentTypes.filter(st => !service_types.includes(st));

  if (removedTypes.length > 0) {
    const regions = db.getTable('partner_regions').filter(pr => pr.partner_id === id && removedTypes.includes(pr.service_type));
    const packages = db.getTable('partner_packages').filter(pp => pp.partner_id === id && removedTypes.includes(pp.service_type));

    if ((regions.length > 0 || packages.length > 0) && confirm !== true) {
      return res.json({
        requires_confirmation: true,
        warning: 'Removing service types will affect existing regions or packages.',
        affected_regions: regions,
        affected_packages: packages
      });
    }
  }

  const before = { service_types: partner.service_types };
  partner.service_types = service_types;
  partner.updated_at = new Date().toISOString();
  db.saveTable('partners', partners);

  appendAudit(req, 'UPDATE_PARTNER_SERVICE_TYPES', 'partner', id, before, { service_types });
  return res.json(partner);
});

// 4.8 Partner-regions CRUD
app.post('/api/admin/partners/:id/regions', (req, res) => {
  const { id } = req.params;
  const { region_id, service_type } = req.body;

  const partners = db.getTable('partners');
  const partner = partners.find(p => p.id === id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  const regions = db.getTable('regions');
  if (!regions.some(r => r.id === region_id)) {
    return res.status(400).json({ error: 'Region does not exist' });
  }

  if (!partner.service_types || !partner.service_types.includes(service_type)) {
    return res.status(400).json({ error: 'Partner does not support this service_type' });
  }

  const partnerRegions = db.getTable('partner_regions');
  if (partnerRegions.some(pr => pr.partner_id === id && pr.region_id === region_id && pr.service_type === service_type)) {
    return res.status(409).json({ error: 'Duplicate region mapping for this partner and service_type' });
  }

  const newPR = {
    id: 'prg-' + generateId(),
    partner_id: id,
    region_id,
    service_type,
    is_active: true,
    created_at: new Date().toISOString()
  };
  partnerRegions.push(newPR);
  db.saveTable('partner_regions', partnerRegions);

  appendAudit(req, 'ADD_PARTNER_REGION', 'partner_region', newPR.id, null, newPR);
  return res.json(newPR);
});

app.post('/api/admin/partners/:id/regions/:regionRowId/deactivate', (req, res) => {
  const { id, regionRowId } = req.params;
  const partnerRegions = db.getTable('partner_regions');
  const pr = partnerRegions.find(p => p.id === regionRowId && p.partner_id === id);
  if (!pr) return res.status(404).json({ error: 'Partner region mapping not found' });

  const before = { is_active: pr.is_active };
  pr.is_active = false;
  db.saveTable('partner_regions', partnerRegions);

  appendAudit(req, 'DEACTIVATE_PARTNER_REGION', 'partner_region', pr.id, before, { is_active: false });
  return res.json(pr);
});

app.post('/api/admin/partners/:id/regions/:regionRowId/reactivate', (req, res) => {
  const { id, regionRowId } = req.params;
  const partnerRegions = db.getTable('partner_regions');
  const pr = partnerRegions.find(p => p.id === regionRowId && p.partner_id === id);
  if (!pr) return res.status(404).json({ error: 'Partner region mapping not found' });

  const before = { is_active: pr.is_active };
  pr.is_active = true;
  db.saveTable('partner_regions', partnerRegions);

  appendAudit(req, 'REACTIVATE_PARTNER_REGION', 'partner_region', pr.id, before, { is_active: true });
  return res.json(pr);
});

app.delete('/api/admin/partners/:id/regions/:regionRowId', (req, res) => {
  const { id, regionRowId } = req.params;
  const partnerRegions = db.getTable('partner_regions');
  const idx = partnerRegions.findIndex(p => p.id === regionRowId && p.partner_id === id);
  if (idx === -1) return res.status(404).json({ error: 'Partner region mapping not found' });

  const targetPR = partnerRegions[idx];
  const packages = db.getTable('partner_packages').filter(pp => pp.partner_id === id && pp.service_type === targetPR.service_type);
  if (packages.some(pkg => pkg.active_regions && pkg.active_regions.includes(targetPR.region_id))) {
    return res.status(400).json({ error: 'Cannot delete region referenced by active packages' });
  }

  partnerRegions.splice(idx, 1);
  db.saveTable('partner_regions', partnerRegions);

  appendAudit(req, 'DELETE_PARTNER_REGION', 'partner_region', regionRowId, targetPR, null);
  return res.json({ success: true, message: 'Partner region mapping deleted.' });
});

// 4.9 Partner-packages CRUD (Admin set)
app.post('/api/admin/partners/:id/packages', (req, res) => {
  const { id } = req.params;
  const { service_type, name, description, face_value_rupees, cost_to_partner_rupees, point_cost, active_regions } = req.body;

  const partners = db.getTable('partners');
  const partner = partners.find(p => p.id === id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  if (!service_type || !partner.service_types || !partner.service_types.includes(service_type)) {
    return res.status(400).json({ error: 'Service type must match one of partner service_types' });
  }

  if (!name || face_value_rupees === undefined || !active_regions || !Array.isArray(active_regions)) {
    return res.status(400).json({ error: 'Missing required package fields' });
  }

  const partnerRegions = db.getTable('partner_regions').filter(pr => pr.partner_id === id && pr.service_type === service_type && pr.is_active !== false);
  const partnerRegionIds = partnerRegions.map(pr => pr.region_id);

  if (!active_regions.every(rId => partnerRegionIds.includes(rId))) {
    return res.status(400).json({ error: 'Every active_region must be an active region served by partner for this service_type' });
  }

  const now = new Date().toISOString();
  const packages = db.getTable('partner_packages');
  const newPkg = {
    id: 'ppk-' + generateId(),
    partner_id: id,
    service_type,
    name,
    description: description || '',
    face_value_rupees: Number(face_value_rupees),
    cost_to_partner_rupees: Number(cost_to_partner_rupees !== undefined ? cost_to_partner_rupees : face_value_rupees),
    point_cost: Number(point_cost !== undefined ? point_cost : face_value_rupees),
    active_regions,
    is_active: true,
    created_at: now,
    updated_at: now
  };
  packages.push(newPkg);
  db.saveTable('partner_packages', packages);

  appendAudit(req, 'CREATE_PARTNER_PACKAGE', 'partner_package', newPkg.id, null, newPkg);
  return res.json(newPkg);
});

app.patch('/api/admin/partners/:id/packages/:packageId', (req, res) => {
  const { id, packageId } = req.params;
  const packages = db.getTable('partner_packages');
  const pkg = packages.find(p => p.id === packageId && p.partner_id === id);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });

  const before = { ...pkg };
  const mutableFields = ['name', 'description', 'face_value_rupees', 'cost_to_partner_rupees', 'point_cost', 'active_regions'];
  mutableFields.forEach(f => {
    if (req.body[f] !== undefined) {
      if (f === 'face_value_rupees' || f === 'cost_to_partner_rupees' || f === 'point_cost') {
        pkg[f] = Number(req.body[f]);
      } else {
        pkg[f] = req.body[f];
      }
    }
  });
  pkg.updated_at = new Date().toISOString();
  db.saveTable('partner_packages', packages);

  appendAudit(req, 'EDIT_PARTNER_PACKAGE', 'partner_package', packageId, before, pkg);
  return res.json(pkg);
});

app.post('/api/admin/partners/:id/packages/:packageId/deactivate', (req, res) => {
  const { id, packageId } = req.params;
  const packages = db.getTable('partner_packages');
  const pkg = packages.find(p => p.id === packageId && p.partner_id === id);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });

  const before = { is_active: pkg.is_active };
  pkg.is_active = false;
  pkg.updated_at = new Date().toISOString();
  db.saveTable('partner_packages', packages);

  appendAudit(req, 'DEACTIVATE_PARTNER_PACKAGE', 'partner_package', packageId, before, { is_active: false });
  return res.json(pkg);
});

app.post('/api/admin/partners/:id/packages/:packageId/reactivate', (req, res) => {
  const { id, packageId } = req.params;
  const packages = db.getTable('partner_packages');
  const pkg = packages.find(p => p.id === packageId && p.partner_id === id);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });

  const before = { is_active: pkg.is_active };
  pkg.is_active = true;
  pkg.updated_at = new Date().toISOString();
  db.saveTable('partner_packages', packages);

  appendAudit(req, 'REACTIVATE_PARTNER_PACKAGE', 'partner_package', packageId, before, { is_active: true });
  return res.json(pkg);
});

// Partner-self Package Endpoints (/api/partner/packages)
app.post('/api/partner/packages', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  if (req.body.partner_id && req.body.partner_id !== session.partnerId) {
    return res.status(403).json({ error: 'Cannot create package for a different partner' });
  }

  const { service_type, name, description, face_value_rupees, cost_to_partner_rupees, point_cost, active_regions } = req.body;
  const partner = session.partner;
  const partnerId = partner.id;

  if (!service_type || !partner.service_types || !partner.service_types.includes(service_type)) {
    return res.status(400).json({ error: 'Service type must match one of partner service_types' });
  }

  if (!name || face_value_rupees === undefined || !active_regions || !Array.isArray(active_regions)) {
    return res.status(400).json({ error: 'Missing required package fields' });
  }

  const partnerRegions = db.getTable('partner_regions').filter(pr => pr.partner_id === partnerId && pr.service_type === service_type && pr.is_active !== false);
  const partnerRegionIds = partnerRegions.map(pr => pr.region_id);

  if (!active_regions.every(rId => partnerRegionIds.includes(rId))) {
    return res.status(400).json({ error: 'Every active_region must be an active region served by partner for this service_type' });
  }

  const now = new Date().toISOString();
  const packages = db.getTable('partner_packages');
  const newPkg = {
    id: 'ppk-' + generateId(),
    partner_id: partnerId,
    service_type,
    name,
    description: description || '',
    face_value_rupees: Number(face_value_rupees),
    cost_to_partner_rupees: Number(cost_to_partner_rupees !== undefined ? cost_to_partner_rupees : face_value_rupees),
    point_cost: Number(point_cost !== undefined ? point_cost : face_value_rupees),
    active_regions,
    is_active: true,
    created_at: now,
    updated_at: now
  };
  packages.push(newPkg);
  db.saveTable('partner_packages', packages);

  return res.json(newPkg);
});

app.patch('/api/partner/packages/:packageId', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { packageId } = req.params;
  const packages = db.getTable('partner_packages');
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  if (pkg.partner_id !== session.partnerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const mutableFields = ['name', 'description', 'face_value_rupees', 'cost_to_partner_rupees', 'point_cost', 'active_regions'];
  mutableFields.forEach(f => {
    if (req.body[f] !== undefined) {
      if (f === 'face_value_rupees' || f === 'cost_to_partner_rupees' || f === 'point_cost') {
        pkg[f] = Number(req.body[f]);
      } else {
        pkg[f] = req.body[f];
      }
    }
  });
  pkg.updated_at = new Date().toISOString();
  db.saveTable('partner_packages', packages);

  return res.json(pkg);
});

app.post('/api/partner/packages/:packageId/deactivate', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { packageId } = req.params;
  const packages = db.getTable('partner_packages');
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  if (pkg.partner_id !== session.partnerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  pkg.is_active = false;
  pkg.updated_at = new Date().toISOString();
  db.saveTable('partner_packages', packages);

  return res.json(pkg);
});

app.post('/api/partner/packages/:packageId/reactivate', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { packageId } = req.params;
  const packages = db.getTable('partner_packages');
  const pkg = packages.find(p => p.id === packageId);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  if (pkg.partner_id !== session.partnerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  pkg.is_active = true;
  pkg.updated_at = new Date().toISOString();
  db.saveTable('partner_packages', packages);

  return res.json(pkg);
});

// Part 5 — Customer Partner Bindings
app.post('/api/customer/partner-bindings', (req, res) => {
  const { customer_user_id, cable_partner_id, broadband_partner_id } = req.body;
  if (!customer_user_id) return res.status(400).json({ error: 'customer_user_id is required' });

  const users = db.getTable('users');
  const customer = users.find(u => u.id === customer_user_id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const partners = db.getTable('partners');
  const partnerRegions = db.getTable('partner_regions');

  if (cable_partner_id) {
    const cp = partners.find(p => p.id === cable_partner_id && p.is_active !== false);
    if (!cp || !cp.service_types || !cp.service_types.includes('CABLE')) {
      return res.status(400).json({ error: 'invalid_partner_binding', message: 'Invalid cable partner' });
    }
    const servesRegion = partnerRegions.some(pr => pr.partner_id === cable_partner_id && pr.region_id === customer.region_id && pr.service_type === 'CABLE' && pr.is_active !== false);
    if (!servesRegion) {
      return res.status(400).json({ error: 'invalid_partner_binding', message: 'Cable partner does not serve customer region' });
    }
  }

  if (broadband_partner_id) {
    const bp = partners.find(p => p.id === broadband_partner_id && p.is_active !== false);
    if (!bp || !bp.service_types || !bp.service_types.includes('BROADBAND')) {
      return res.status(400).json({ error: 'invalid_partner_binding', message: 'Invalid broadband partner' });
    }
    const servesRegion = partnerRegions.some(pr => pr.partner_id === broadband_partner_id && pr.region_id === customer.region_id && pr.service_type === 'BROADBAND' && pr.is_active !== false);
    if (!servesRegion) {
      return res.status(400).json({ error: 'invalid_partner_binding', message: 'Broadband partner does not serve customer region' });
    }
  }

  const bindings = db.getTable('customer_partner_bindings');
  let binding = bindings.find(b => b.customer_user_id === customer_user_id);
  const now = new Date().toISOString();

  if (binding) {
    const before = { cable_partner_id: binding.cable_partner_id, broadband_partner_id: binding.broadband_partner_id };
    binding.cable_partner_id = cable_partner_id !== undefined ? cable_partner_id : binding.cable_partner_id;
    binding.broadband_partner_id = broadband_partner_id !== undefined ? broadband_partner_id : binding.broadband_partner_id;
    binding.updated_at = now;
    db.saveTable('customer_partner_bindings', bindings);
    appendAudit(req, 'UPDATE_PARTNER_BINDING', 'customer_partner_binding', customer_user_id, before, binding);
  } else {
    binding = {
      customer_user_id,
      cable_partner_id: cable_partner_id || null,
      broadband_partner_id: broadband_partner_id || null,
      updated_at: now
    };
    bindings.push(binding);
    db.saveTable('customer_partner_bindings', bindings);
  }

  return res.json(binding);
});

app.get('/api/customer/partner-bindings/:customer_user_id', (req, res) => {
  const { customer_user_id } = req.params;
  const bindings = db.getTable('customer_partner_bindings');
  const binding = bindings.find(b => b.customer_user_id === customer_user_id);
  return res.json(binding || null);
});

function getAvailablePartnersForRegion(regionId) {
  if (!regionId) return { cable: [], broadband: [] };

  const partners = db.getTable('partners');
  const partnerRegions = db.getTable('partner_regions');

  const activePartnersMap = new Map(
    partners.filter(p => p.is_active !== false).map(p => [p.id, p])
  );

  const cableSet = new Map();
  const broadbandSet = new Map();

  const matchingRegions = partnerRegions.filter(
    pr => pr.region_id === regionId && pr.is_active !== false && activePartnersMap.has(pr.partner_id)
  );

  for (const pr of matchingRegions) {
    const ptr = activePartnersMap.get(pr.partner_id);
    if (!ptr) continue;
    const sanitized = {
      id: ptr.id,
      display_name: ptr.display_name,
      service_types: ptr.service_types || []
    };

    if (pr.service_type === 'CABLE' && !cableSet.has(ptr.id)) {
      cableSet.set(ptr.id, sanitized);
    } else if (pr.service_type === 'BROADBAND' && !broadbandSet.has(ptr.id)) {
      broadbandSet.set(ptr.id, sanitized);
    }
  }

  return {
    cable: Array.from(cableSet.values()),
    broadband: Array.from(broadbandSet.values())
  };
}

app.get('/api/customer/available-partners', (req, res) => {
  const { region_id } = req.query;
  if (!region_id) {
    return res.status(400).json({ error: 'region_id is required' });
  }
  return res.json(getAvailablePartnersForRegion(region_id));
});

app.get('/api/customer/:id/profile', (req, res) => {
  const { id } = req.params;
  const users = db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });

  const bindings = db.getTable('customer_partner_bindings');
  const binding = bindings.find(b => b.customer_user_id === id) || null;

  const available_partners = getAvailablePartnersForRegion(user.region_id);

  return res.json({
    user: sanitizeUser(user),
    bindings: binding,
    available_partners
  });
});

app.post('/api/customer/:id/profile', (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;
  const users = db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });

  const before = { name: user.name, address: user.address || '' };
  if (name && name.trim()) user.name = name.trim();
  if (address !== undefined) user.address = address.trim();

  db.saveTable('users', users);
  appendAudit(req, 'EDIT_CUSTOMER_PROFILE', 'customer', id, before, { name: user.name, address: user.address });

  return res.json({ success: true, user: sanitizeUser(user) });
});

app.get('/api/customer/partner-bindings/:customer_user_id/available', (req, res) => {
  const { customer_user_id } = req.params;
  const users = db.getTable('users');
  const customer = users.find(u => u.id === customer_user_id);
  if (!customer || !customer.region_id) {
    return res.json({ cable: [], broadband: [] });
  }

  const partners = db.getTable('partners');
  const partnerRegions = db.getTable('partner_regions');

  const cablePartnerIds = partnerRegions
    .filter(pr => pr.region_id === customer.region_id && pr.service_type === 'CABLE' && pr.is_active !== false)
    .map(pr => pr.partner_id);

  const broadbandPartnerIds = partnerRegions
    .filter(pr => pr.region_id === customer.region_id && pr.service_type === 'BROADBAND' && pr.is_active !== false)
    .map(pr => pr.partner_id);

  const cablePartners = partners.filter(p => p.is_active !== false && cablePartnerIds.includes(p.id));
  const broadbandPartners = partners.filter(p => p.is_active !== false && broadbandPartnerIds.includes(p.id));

  return res.json({
    cable: cablePartners,
    broadband: broadbandPartners
  });
});


// ==========================================
// ROUND P2 — REDEMPTION APPROVAL & HEALTH ENDPOINTS
// ==========================================

// 1.3 Admin Redemption Approvals Endpoints
app.get('/api/admin/redemption-approvals', (req, res) => {
  const { status, partner_id, customer_user_id, date_from, date_to } = req.query;
  let approvals = db.getTable('redemption_approvals');

  if (status) approvals = approvals.filter(a => a.status === status);
  if (partner_id) approvals = approvals.filter(a => a.partner_id === partner_id);
  if (customer_user_id) approvals = approvals.filter(a => a.customer_user_id === customer_user_id);
  if (date_from) approvals = approvals.filter(a => new Date(a.created_at) >= new Date(date_from));
  if (date_to) approvals = approvals.filter(a => new Date(a.created_at) <= new Date(date_to));

  const users = db.getTable('users');
  const partners = db.getTable('partners');
  const packages = db.getTable('partner_packages');

  const result = approvals.map(a => {
    const cust = users.find(u => u.id === a.customer_user_id);
    const ptr = partners.find(p => p.id === a.partner_id);
    const pkg = packages.find(p => p.id === a.partner_package_id);
    return {
      ...a,
      customer_name: cust ? cust.name : 'Unknown Customer',
      customer_phone: cust ? cust.phone : '',
      partner_name: ptr ? ptr.display_name : 'Unknown Partner',
      package_name: pkg ? pkg.name : 'Unknown Package'
    };
  });

  return res.json(result);
});

app.get('/api/admin/redemption-approvals/:id', (req, res) => {
  const { id } = req.params;
  const approvals = db.getTable('redemption_approvals');
  const approval = approvals.find(a => a.id === id);
  if (!approval) return res.status(404).json({ error: 'Redemption approval not found' });

  const users = db.getTable('users');
  const partners = db.getTable('partners');
  const packages = db.getTable('partner_packages');
  const ledger = db.getTable('points_ledger');

  const customer = users.find(u => u.id === approval.customer_user_id) || null;
  const partner = partners.find(p => p.id === approval.partner_id) || null;
  const pkg = packages.find(p => p.id === approval.partner_package_id) || null;
  const ledgerRow = ledger.find(l => l.id === approval.ledger_id) || null;

  return res.json({
    ...approval,
    customer_name: customer ? customer.name : 'Unknown Customer',
    customer_phone: customer ? customer.phone : '',
    partner_name: partner ? partner.display_name : 'Unknown Partner',
    package_name: pkg ? pkg.name : 'Unknown Package',
    customer,
    partner,
    package: pkg,
    ledger_row: ledgerRow
  });
});

app.post('/api/admin/redemption-approvals/:id/approve', (req, res) => {
  const { id } = req.params;
  const { admin_id, notes } = req.body;

  const approvals = db.getTable('redemption_approvals');
  const approval = approvals.find(a => a.id === id);
  if (!approval) return res.status(404).json({ error: 'Redemption approval not found' });

  if (approval.status !== 'PENDING_ADMIN_APPROVAL') {
    return res.status(400).json({ error: 'invalid_transition' });
  }

  approval.status = 'APPROVED_AWAITING_PARTNER';
  approval.admin_id = admin_id || 'u-admin';
  if (notes) approval.admin_notes = notes;
  approval.approved_at = new Date().toISOString();
  approval.updated_at = new Date().toISOString();

  db.saveTable('redemption_approvals', approvals);
  appendAudit(req, 'APPROVE_REDEMPTION', 'redemption_approval', id, { status: 'PENDING_ADMIN_APPROVAL' }, { status: approval.status }, notes);

  return res.json(approval);
});

app.post('/api/admin/redemption-approvals/:id/reject', (req, res) => {
  const { id } = req.params;
  const { admin_id, reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({ error: 'Reason must be at least 10 characters long' });
  }

  const approvals = db.getTable('redemption_approvals');
  const approval = approvals.find(a => a.id === id);
  if (!approval) return res.status(404).json({ error: 'Redemption approval not found' });

  if (approval.status !== 'PENDING_ADMIN_APPROVAL' && approval.status !== 'DISPUTED') {
    return res.status(400).json({ error: 'invalid_transition' });
  }

  const oldStatus = approval.status;
  approval.status = 'REJECTED';
  approval.admin_id = admin_id || 'u-admin';
  approval.rejected_reason = reason.trim();
  approval.rejected_at = new Date().toISOString();
  approval.updated_at = new Date().toISOString();

  // Append NEW points_ledger credit row
  const ledger = db.getTable('points_ledger');
  const users = db.getTable('users');
  const cust = users.find(u => u.id === approval.customer_user_id);
  const refundLedgerId = 'l-' + generateId();
  ledger.push({
    id: refundLedgerId,
    tenant_id: cust ? cust.tenant_id : 't1',
    region_id: cust ? cust.region_id : 'r1',
    customer_id: approval.customer_user_id,
    amount: Math.abs(parseFloat(approval.points_deducted)),
    type: 'REDEEM_REFUND',
    order_id: null,
    description: `Refund for rejected redemption approval ${approval.id}`,
    created_at: new Date().toISOString()
  });
  db.saveTable('points_ledger', ledger);

  approval.refund_ledger_id = refundLedgerId;
  db.saveTable('redemption_approvals', approvals);

  appendAudit(req, 'REJECT_REDEMPTION', 'redemption_approval', id, { status: oldStatus }, { status: approval.status, refund_ledger_id: refundLedgerId }, reason);

  return res.json(approval);
});

app.post('/api/admin/redemption-approvals/:id/resolve-dispute', (req, res) => {
  const { id } = req.params;
  const { admin_id, outcome, notes } = req.body;

  if (!outcome || !['fulfill', 'reject'].includes(outcome)) {
    return res.status(400).json({ error: 'outcome must be fulfill or reject' });
  }

  const approvals = db.getTable('redemption_approvals');
  const approval = approvals.find(a => a.id === id);
  if (!approval) return res.status(404).json({ error: 'Redemption approval not found' });

  if (approval.status !== 'DISPUTED') {
    return res.status(400).json({ error: 'invalid_transition' });
  }

  approval.admin_id = admin_id || 'u-admin';
  if (notes) approval.admin_notes = notes;
  approval.updated_at = new Date().toISOString();

  if (outcome === 'fulfill') {
    approval.status = 'FULFILLED';
    approval.fulfilled_at = new Date().toISOString();
    db.saveTable('redemption_approvals', approvals);
    appendAudit(req, 'RESOLVE_DISPUTE_FULFILL', 'redemption_approval', id, { status: 'DISPUTED' }, { status: 'FULFILLED' }, notes);
    return res.json(approval);
  } else {
    approval.status = 'REJECTED';
    approval.rejected_at = new Date().toISOString();

    // Append NEW points_ledger credit row
    const ledger = db.getTable('points_ledger');
    const users = db.getTable('users');
    const cust = users.find(u => u.id === approval.customer_user_id);
    const refundLedgerId = 'l-' + generateId();
    ledger.push({
      id: refundLedgerId,
      tenant_id: cust ? cust.tenant_id : 't1',
      region_id: cust ? cust.region_id : 'r1',
      customer_id: approval.customer_user_id,
      amount: Math.abs(parseFloat(approval.points_deducted)),
      type: 'REDEEM_REFUND',
      order_id: null,
      description: `Refund for rejected redemption approval ${approval.id}`,
      created_at: new Date().toISOString()
    });
    db.saveTable('points_ledger', ledger);

    approval.refund_ledger_id = refundLedgerId;
    db.saveTable('redemption_approvals', approvals);
    appendAudit(req, 'RESOLVE_DISPUTE_REJECT', 'redemption_approval', id, { status: 'DISPUTED' }, { status: 'REJECTED', refund_ledger_id: refundLedgerId }, notes);
    return res.json(approval);
  }
});

// 1.4 Partner Endpoints (Session-authed)
app.get('/api/partner/redemption-queue', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const approvals = db.getTable('redemption_approvals');
  const partnerApprovals = approvals.filter(a =>
    a.partner_id === session.partnerId &&
    ['APPROVED_AWAITING_PARTNER', 'DISPUTED'].includes(a.status)
  );

  const users = db.getTable('users');
  const packages = db.getTable('partner_packages');

  const result = partnerApprovals.map(a => {
    const cust = users.find(u => u.id === a.customer_user_id);
    const pkg = packages.find(p => p.id === a.partner_package_id);
    return {
      ...a,
      customer_name: cust ? cust.name : 'Unknown Customer',
      customer_phone: cust ? cust.phone : '',
      package_name: pkg ? pkg.name : 'Unknown Package'
    };
  });

  return res.json(result);
});

app.get('/api/partner/redemption-history', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { status, date_from, date_to } = req.query;
  let approvals = db.getTable('redemption_approvals').filter(a => a.partner_id === session.partnerId);

  if (status) approvals = approvals.filter(a => a.status === status);
  if (date_from) approvals = approvals.filter(a => new Date(a.created_at) >= new Date(date_from));
  if (date_to) approvals = approvals.filter(a => new Date(a.created_at) <= new Date(date_to));

  const users = db.getTable('users');
  const packages = db.getTable('partner_packages');

  const result = approvals.map(a => {
    const cust = users.find(u => u.id === a.customer_user_id);
    const pkg = packages.find(p => p.id === a.partner_package_id);
    return {
      ...a,
      customer_name: cust ? cust.name : 'Unknown Customer',
      customer_phone: cust ? cust.phone : '',
      package_name: pkg ? pkg.name : 'Unknown Package'
    };
  });

  return res.json(result);
});

app.post('/api/partner/redemption-approvals/:id/fulfill', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { partner_notes } = req.body;

  const approvals = db.getTable('redemption_approvals');
  const approval = approvals.find(a => a.id === id);
  if (!approval) return res.status(404).json({ error: 'Redemption approval not found' });

  if (approval.partner_id !== session.partnerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (approval.status !== 'APPROVED_AWAITING_PARTNER' && approval.status !== 'DISPUTED') {
    return res.status(400).json({ error: 'invalid_transition' });
  }

  const oldStatus = approval.status;
  approval.status = 'FULFILLED';
  if (partner_notes) approval.partner_notes = partner_notes;
  approval.fulfilled_at = new Date().toISOString();
  approval.updated_at = new Date().toISOString();

  db.saveTable('redemption_approvals', approvals);

  const auditLogs = db.getTable('admin_audit_log');
  auditLogs.push({
    id: 'aud-' + generateId(),
    action: 'PARTNER_FULFILLED',
    entity_type: 'redemption_approval',
    entity_id: id,
    user_id: session.userId,
    before: { status: oldStatus },
    after: { status: 'FULFILLED' },
    notes: partner_notes || 'Partner fulfilled redemption',
    created_at: new Date().toISOString()
  });
  db.saveTable('admin_audit_log', auditLogs);

  return res.json(approval);
});

app.post('/api/partner/redemption-approvals/:id/dispute', (req, res) => {
  const session = getPartnerSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    return res.status(400).json({ error: 'Reason must be at least 10 characters long' });
  }

  const approvals = db.getTable('redemption_approvals');
  const approval = approvals.find(a => a.id === id);
  if (!approval) return res.status(404).json({ error: 'Redemption approval not found' });

  if (approval.partner_id !== session.partnerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (approval.status !== 'APPROVED_AWAITING_PARTNER') {
    return res.status(400).json({ error: 'invalid_transition' });
  }

  approval.status = 'DISPUTED';
  approval.disputed_reason = reason.trim();
  approval.disputed_at = new Date().toISOString();
  approval.updated_at = new Date().toISOString();

  db.saveTable('redemption_approvals', approvals);

  const auditLogs = db.getTable('admin_audit_log');
  auditLogs.push({
    id: 'aud-' + generateId(),
    action: 'PARTNER_DISPUTED',
    entity_type: 'redemption_approval',
    entity_id: id,
    user_id: session.userId,
    before: { status: 'APPROVED_AWAITING_PARTNER' },
    after: { status: 'DISPUTED', disputed_reason: reason.trim() },
    notes: reason.trim(),
    created_at: new Date().toISOString()
  });
  db.saveTable('admin_audit_log', auditLogs);

  return res.json(approval);
});

// 1.5 Customer Status Endpoint
app.get('/api/customer/redemption-status/:approval_id', (req, res) => {
  const { approval_id } = req.params;
  const { customer_user_id } = req.query;

  const approvals = db.getTable('redemption_approvals');
  const approval = approvals.find(a => a.id === approval_id);
  if (!approval) return res.status(404).json({ error: 'Redemption approval not found' });

  if (customer_user_id && approval.customer_user_id !== customer_user_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return res.json({
    status: approval.status,
    approval,
    timeline: {
      created_at: approval.created_at,
      approved_at: approval.approved_at,
      fulfilled_at: approval.fulfilled_at,
      rejected_at: approval.rejected_at,
      disputed_at: approval.disputed_at
    }
  });
});

// Part 4 — Admin Health Dashboard API
app.get('/api/admin/health', (req, res) => {
  const now = Date.now();
  const approvals = db.getTable('redemption_approvals');
  const stockists = db.getTable('stockists');
  const partners = db.getTable('partners');
  const orders = db.getTable('orders');
  const fraudReports = db.getTable('fraud_reports');
  const users = db.getTable('users');
  const ledger = db.getTable('points_ledger');

  // 4.1 Redemption pipeline health
  const pending_over_24h_count = approvals.filter(a =>
    a.status === 'PENDING_ADMIN_APPROVAL' &&
    (now - new Date(a.created_at).getTime()) > 24 * 3600 * 1000
  ).length;

  const approved_over_48h_count = approvals.filter(a =>
    a.status === 'APPROVED_AWAITING_PARTNER' &&
    a.approved_at &&
    (now - new Date(a.approved_at).getTime()) > 48 * 3600 * 1000
  ).length;

  // 4.2 Partner fulfillment speed (last 30 days, slowest-first top 10)
  const thirtyDaysAgo = now - 30 * 24 * 3600 * 1000;
  const fulfilledLast30 = approvals.filter(a =>
    a.status === 'FULFILLED' &&
    a.approved_at &&
    a.fulfilled_at &&
    new Date(a.fulfilled_at).getTime() >= thirtyDaysAgo
  );

  const partnerTimes = {};
  fulfilledLast30.forEach(a => {
    const hours = (new Date(a.fulfilled_at).getTime() - new Date(a.approved_at).getTime()) / (3600 * 1000);
    if (!partnerTimes[a.partner_id]) partnerTimes[a.partner_id] = [];
    partnerTimes[a.partner_id].push(hours);
  });

  const partner_fulfillment_speed = Object.keys(partnerTimes).map(partner_id => {
    const times = partnerTimes[partner_id].sort((x, y) => x - y);
    const mid = Math.floor(times.length / 2);
    const median_hours = times.length % 2 !== 0 ? times[mid] : (times[mid - 1] + times[mid]) / 2;
    const partnerObj = partners.find(p => p.id === partner_id);
    return {
      partner_id,
      partner_name: partnerObj ? partnerObj.display_name : partner_id,
      median_hours: Math.round(median_hours * 10) / 10
    };
  }).sort((a, b) => b.median_hours - a.median_hours).slice(0, 10);

  // 4.3 Stockist volume leaderboard (30d GMV descending)
  const ordersLast30 = orders.filter(o => o.status !== 'CANCELLED' && new Date(o.createdAt || o.created_at || now).getTime() >= thirtyDaysAgo);
  const stockistGmvMap = {};
  ordersLast30.forEach(o => {
    if (o.stockistId) {
      stockistGmvMap[o.stockistId] = (stockistGmvMap[o.stockistId] || 0) + (o.subtotal || 0);
    }
  });

  const stockist_volume_leaderboard = stockists.map(s => {
    return {
      stockist_id: s.id,
      stockist_name: s.name,
      region_id: s.region_id,
      gmv_30d: stockistGmvMap[s.id] || 0
    };
  }).sort((a, b) => b.gmv_30d - a.gmv_30d).slice(0, 10);

  // 4.4 New arrivals (last 30 days)
  const new_stockists_30d = stockists.filter(s => new Date(s.created_at || now).getTime() >= thirtyDaysAgo).length;
  const new_partners_30d = partners.filter(p => new Date(p.onboarded_at || p.created_at || now).getTime() >= thirtyDaysAgo).length;

  // 4.5 Fraud signals (NEW or TRIAGING fraud reports by entity)
  const activeFrauds = fraudReports.filter(f => ['NEW', 'TRIAGING'].includes(f.status));
  const entityMap = {};
  activeFrauds.forEach(f => {
    const key = (f.linked_entity_type || 'general') + ':' + (f.linked_entity_id || 'unknown');
    if (!entityMap[key]) {
      entityMap[key] = {
        entity_id: f.linked_entity_id || key,
        entity_type: f.linked_entity_type || 'general',
        entity_name: f.subject || f.linked_entity_id || 'Unknown',
        active_reports_count: 0
      };
    }
    entityMap[key].active_reports_count += 1;
  });
  const fraud_signals = Object.values(entityMap);

  // 4.6 System stats
  const system_stats = {
    total_customers: users.filter(u => u.role === 'CUSTOMER').length,
    total_stockists: stockists.length,
    total_onboarded_partners: partners.filter(p => p.is_active !== false).length,
    total_redemption_approvals: approvals.length,
    total_ledger_entries: ledger.length
  };

  return res.json({
    redemption_pipeline: {
      pending_over_24h_count,
      approved_over_48h_count
    },
    partner_fulfillment_speed,
    stockist_volume_leaderboard,
    new_arrivals: {
      new_stockists_30d,
      new_partners_30d
    },
    fraud_signals,
    system_stats
  });
});


// Reset DB
app.post('/api/admin/reset-db', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const DB_PATH = path.join(__dirname, 'db.json');
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  emailHelper.clearMockOutbox();
  loginPasswordFailedAttempts.clear();
  otpRequestAttempts.clear();
  resetTokens.clear();
  const fresh = db.read();
  return res.json({ success: true, message: 'Database reset successfully.', state: fresh });
});

// Start Server
const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Backend Server] ISP-Commerce Loyalty API listening on port ${PORT}`);
  });
}

module.exports = { app, calculateSettlement, calculatePartnerPayout, getCommissionConfig };
