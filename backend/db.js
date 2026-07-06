const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

const DEFAULT_DB = {
  tenants: [
    { id: 't1', name: 'FastNet Cable & Broadband', code: 'fastnet', created_at: new Date().toISOString() }
  ],
  regions: [
    { id: 'r1', tenant_id: 't1', name: 'Kolkata South (Garia)', code: 'kolkata-garia', created_at: new Date().toISOString() },
    { id: 'r2', tenant_id: 't1', name: 'Rural West Bengal (Bishnupur)', code: 'rural-bishnupur', created_at: new Date().toISOString() }
  ],
  users: [
    { id: 'u-admin', tenant_id: 't1', region_id: 'r1', phone: '9999999999', name: 'Super Admin', role: 'ADMIN', kyc_status: 'APPROVED', created_at: new Date().toISOString() },
    { id: 'u-cust1', tenant_id: 't1', region_id: 'r1', phone: '9876543210', name: 'Amit Sen', role: 'CUSTOMER', kyc_status: 'APPROVED', created_at: new Date().toISOString() },
    { id: 'u-cust2', tenant_id: 't1', region_id: 'r2', phone: '8765432109', name: 'Radha Roy', role: 'CUSTOMER', kyc_status: 'APPROVED', created_at: new Date().toISOString() },
    { id: 'u-stk1', tenant_id: 't1', region_id: 'r1', phone: '7654321098', name: 'Madan Shaw', role: 'STOCKIST', kyc_status: 'APPROVED', created_at: new Date().toISOString() },
    { id: 'u-stk2', tenant_id: 't1', region_id: 'r2', phone: '6543210987', name: 'Prabhat Sarkar', role: 'STOCKIST', kyc_status: 'APPROVED', created_at: new Date().toISOString() },
    { id: 'u-stk3', tenant_id: 't1', region_id: 'r2', phone: '5432109876', name: 'Gopal Joy', role: 'STOCKIST', kyc_status: 'PENDING', kyc_details: { id_type: 'Aadhaar', id_number: '1234-5678-9012', shop_address: 'Bishnupur Market Road' }, created_at: new Date().toISOString() }
  ],
  vendors: [
    { id: 'v1', tenant_id: 't1', region_id: 'r1', name: 'Kolkata Wholesale Mart', created_at: new Date().toISOString() },
    { id: 'v2', tenant_id: 't1', region_id: 'r2', name: 'Bishnupur Agro Suppliers', created_at: new Date().toISOString() }
  ],
  stockists: [
    { id: 's1', tenant_id: 't1', region_id: 'r1', user_id: 'u-stk1', name: 'Madan Grocers', vendor_id: 'v1', delivery_radius_km: 3.0, min_order_value: 200, is_active: true, created_at: new Date().toISOString() },
    { id: 's2', tenant_id: 't1', region_id: 'r2', user_id: 'u-stk2', name: 'Sarkar Daily Store', vendor_id: 'v2', delivery_radius_km: 6.0, min_order_value: 100, is_active: true, created_at: new Date().toISOString() }
  ],
  products: [
    { id: 'p1', tenant_id: 't1', region_id: 'r1', name: 'Fresh Potatoes (Alu, 1kg)', category: 'groceries', price: 30.0, cost_price: 22.0, description: 'Staple local potatoes', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p2', tenant_id: 't1', region_id: 'r1', name: 'Fresh Onions (Piaj, 1kg)', category: 'groceries', price: 45.0, cost_price: 35.0, description: 'Red onions for daily cooking', image_url: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p3', tenant_id: 't1', region_id: 'r1', name: 'Masoor Dal (500g)', category: 'groceries', price: 60.0, cost_price: 48.0, description: 'Red split lentils', image_url: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p4', tenant_id: 't1', region_id: 'r1', name: 'Refined Sugar (1kg)', category: 'groceries', price: 45.0, cost_price: 38.0, description: 'Pure white sugar', image_url: 'https://images.unsplash.com/photo-1622484211148-716598e04141?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p5', tenant_id: 't1', region_id: 'r1', name: 'Aashirvaad Atta (1kg)', category: 'groceries', price: 55.0, cost_price: 45.0, description: 'Whole wheat flour', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p6', tenant_id: 't1', region_id: 'r1', name: 'Amul Butter (100g)', category: 'groceries', price: 58.0, cost_price: 50.0, description: 'Pasteurized salted butter', image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p7', tenant_id: 't1', region_id: 'r1', name: 'Kachi Ghani Mustard Oil (500ml)', category: 'groceries', price: 90.0, cost_price: 75.0, description: 'Pure cold-pressed mustard oil', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p8', tenant_id: 't1', region_id: 'r1', name: 'Tata Salt (1kg)', category: 'groceries', price: 28.0, cost_price: 22.0, description: 'Iodized salt', image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p9', tenant_id: 't1', region_id: 'r1', name: 'Marie Gold Biscuits (250g)', category: 'groceries', price: 30.0, cost_price: 25.0, description: 'Crunchy tea-time biscuits', image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
    { id: 'p10', tenant_id: 't1', region_id: 'r1', name: 'Darjeeling Tea (100g)', category: 'groceries', price: 75.0, cost_price: 60.0, description: 'Fragrant Darjeeling tea leaves', image_url: 'https://images.unsplash.com/photo-1594631252845-29fc4589dbd8?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() }
  ],
  stockist_inventory: [
    { stockist_id: 's1', product_id: 'p1', stock_qty: 50, is_available: true },
    { stockist_id: 's1', product_id: 'p2', stock_qty: 60, is_available: true },
    { stockist_id: 's1', product_id: 'p3', stock_qty: 40, is_available: true },
    { stockist_id: 's1', product_id: 'p4', stock_qty: 100, is_available: true },
    { stockist_id: 's1', product_id: 'p5', stock_qty: 80, is_available: true },
    { stockist_id: 's1', product_id: 'p6', stock_qty: 30, is_available: true },
    { stockist_id: 's1', product_id: 'p7', stock_qty: 45, is_available: true },
    { stockist_id: 's1', product_id: 'p8', stock_qty: 90, is_available: true },
    { stockist_id: 's1', product_id: 'p9', stock_qty: 110, is_available: true },
    { stockist_id: 's1', product_id: 'p10', stock_qty: 35, is_available: true },
    
    { stockist_id: 's2', product_id: 'p1-r2', stock_qty: 25, is_available: true },
    { stockist_id: 's2', product_id: 'p2-r2', stock_qty: 30, is_available: true },
    { stockist_id: 's2', product_id: 'p3-r2', stock_qty: 20, is_available: true },
    { stockist_id: 's2', product_id: 'p4-r2', stock_qty: 50, is_available: true },
    { stockist_id: 's2', product_id: 'p5-r2', stock_qty: 40, is_available: true },
    { stockist_id: 's2', product_id: 'p6-r2', stock_qty: 15, is_available: true },
    { stockist_id: 's2', product_id: 'p7-r2', stock_qty: 20, is_available: true },
    { stockist_id: 's2', product_id: 'p8-r2', stock_qty: 45, is_available: true },
    { stockist_id: 's2', product_id: 'p9-r2', stock_qty: 60, is_available: true },
    { stockist_id: 's2', product_id: 'p10-r2', stock_qty: 18, is_available: true }
  ],
  orders: [],
  order_items: [],
  split_payouts: [],
  points_ledger: [
    { id: 'l-init1', tenant_id: 't1', region_id: 'r1', customer_id: 'u-cust1', amount: 50.0, type: 'EARN', order_id: null, description: 'Welcome signup bonus points', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'l-init2', tenant_id: 't1', region_id: 'r2', customer_id: 'u-cust2', amount: 30.0, type: 'EARN', order_id: null, description: 'Welcome signup bonus points', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  commission_rates: [
    { id: 'c1', tenant_id: 't1', region_id: 'r1', category: 'groceries', rate_percent: 10.0, created_at: new Date().toISOString() },
    { id: 'c2', tenant_id: 't1', region_id: 'r2', category: 'groceries', rate_percent: 8.0, created_at: new Date().toISOString() }
  ],
  anomaly_logs: []
};

// Ensure regional products are mapped to both regions (duplicate them for region r2 if missing)
DEFAULT_DB.regions.forEach(region => {
  if (region.id === 'r2') {
    DEFAULT_DB.products.push(
      { id: 'p1-r2', tenant_id: 't1', region_id: 'r2', name: 'Fresh Potatoes (Alu, 1kg)', category: 'groceries', price: 30.0, cost_price: 22.0, description: 'Staple local potatoes', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p2-r2', tenant_id: 't1', region_id: 'r2', name: 'Fresh Onions (Piaj, 1kg)', category: 'groceries', price: 45.0, cost_price: 35.0, description: 'Red onions for daily cooking', image_url: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p3-r2', tenant_id: 't1', region_id: 'r2', name: 'Masoor Dal (500g)', category: 'groceries', price: 60.0, cost_price: 48.0, description: 'Red split lentils', image_url: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p4-r2', tenant_id: 't1', region_id: 'r2', name: 'Refined Sugar (1kg)', category: 'groceries', price: 45.0, cost_price: 38.0, description: 'Pure white sugar', image_url: 'https://images.unsplash.com/photo-1622484211148-716598e04141?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p5-r2', tenant_id: 't1', region_id: 'r2', name: 'Aashirvaad Atta (1kg)', category: 'groceries', price: 55.0, cost_price: 45.0, description: 'Whole wheat flour', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p6-r2', tenant_id: 't1', region_id: 'r2', name: 'Amul Butter (100g)', category: 'groceries', price: 58.0, cost_price: 50.0, description: 'Pasteurized salted butter', image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p7-r2', tenant_id: 't1', region_id: 'r2', name: 'Kachi Ghani Mustard Oil (500ml)', category: 'groceries', price: 90.0, cost_price: 75.0, description: 'Pure cold-pressed mustard oil', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p8-r2', tenant_id: 't1', region_id: 'r2', name: 'Tata Salt (1kg)', category: 'groceries', price: 28.0, cost_price: 22.0, description: 'Iodized salt', image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p9-r2', tenant_id: 't1', region_id: 'r2', name: 'Marie Gold Biscuits (250g)', category: 'groceries', price: 30.0, cost_price: 25.0, description: 'Crunchy tea-time biscuits', image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
      { id: 'p10-r2', tenant_id: 't1', region_id: 'r2', name: 'Darjeeling Tea (100g)', category: 'groceries', price: 75.0, cost_price: 60.0, description: 'Fragrant Darjeeling tea leaves', image_url: 'https://images.unsplash.com/photo-1594631252845-29fc4589dbd8?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() }
    );
  }
});

function read() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      write(DEFAULT_DB);
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read database file, returning default memory db:', err);
    return DEFAULT_DB;
  }
}

function write(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

function getTable(tableName) {
  const db = read();
  return db[tableName] || [];
}

function saveTable(tableName, rows) {
  const db = read();
  db[tableName] = rows;
  write(db);
}

module.exports = {
  read,
  write,
  getTable,
  saveTable
};
