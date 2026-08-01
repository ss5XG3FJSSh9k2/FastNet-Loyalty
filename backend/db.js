const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

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
    { id: 'u-admin', tenant_id: 't1', region_id: 'r1', phone: '9999999999', name: 'Super Admin', role: 'ADMIN', kyc_status: 'APPROVED', no_show_count: 0, address: '', created_at: new Date().toISOString() },
    { id: 'u-cust1', tenant_id: 't1', region_id: 'r1', phone: '9876543210', name: 'Amit Sen', role: 'CUSTOMER', kyc_status: 'APPROVED', no_show_count: 0, address: '12 Park Street, Garia', created_at: new Date().toISOString() },
    { id: 'u-cust2', tenant_id: 't1', region_id: 'r2', phone: '8765432109', name: 'Radha Roy', role: 'CUSTOMER', kyc_status: 'APPROVED', no_show_count: 0, address: '5 Bishnupur Lane', created_at: new Date().toISOString() },
    { id: 'u-stk1', tenant_id: 't1', region_id: 'r1', phone: '7654321098', name: 'Madan Shaw', role: 'STOCKIST', kyc_status: 'APPROVED', no_show_count: 0, address: 'Garia Market', created_at: new Date().toISOString() },
    { id: 'u-stk2', tenant_id: 't1', region_id: 'r2', phone: '6543210987', name: 'Prabhat Sarkar', role: 'STOCKIST', kyc_status: 'APPROVED', no_show_count: 0, address: 'Bishnupur Bazar', created_at: new Date().toISOString() },
    { id: 'u-stk3', tenant_id: 't1', region_id: 'r2', phone: '5432109876', name: 'Gopal Joy', role: 'STOCKIST', kyc_status: 'PENDING', no_show_count: 0, kyc_details: { id_type: 'Aadhaar', id_number: '1234-5678-9012', shop_name: 'Joy Kirana', shop_address: 'Bishnupur Market Road' }, address: 'Bishnupur Market Road', created_at: new Date().toISOString() },
    { id: 'u-stk4', tenant_id: 't1', region_id: 'r1', phone: '4321098765', name: 'Soumik Banerjee', role: 'STOCKIST', kyc_status: 'APPROVED', no_show_count: 0, address: 'Garia Corner', created_at: new Date().toISOString() },
    { id: 'u-ptr-adhya', tenant_id: 't1', region_id: 'r1', phone: '9876500000', email: 'adhya@partners.example', password_hash: bcrypt.hashSync('partner123', 10), name: 'Adhya Admin', role: 'PARTNER_ADMIN', kyc_status: 'APPROVED', no_show_count: 0, address: '15 Garia Main Road', created_at: '2026-08-01T00:00:00.000Z' },
    { id: 'u-ptr-jio', tenant_id: 't1', region_id: 'r1', phone: '9876500001', email: 'jio@partners.example', password_hash: bcrypt.hashSync('partner123', 10), name: 'Jio Admin', role: 'PARTNER_ADMIN', kyc_status: 'APPROVED', no_show_count: 0, address: '8 Park Street', created_at: '2026-08-01T00:00:00.000Z' }
  ],
  partners: [
    {
      id: 'ptr-adhya',
      tenant_id: 't1',
      legal_name: 'Adhya Cable Services Pvt Ltd',
      display_name: 'Adhya Cable',
      contact_phone: '9876500000',
      contact_email: 'adhya@partners.example',
      address: '15 Garia Main Road, Kolkata',
      gst_number: '19AAAAA0000A1Z5',
      service_types: ['CABLE'],
      is_active: true,
      onboarded_at: '2026-08-01T00:00:00.000Z',
      onboarded_by_admin_id: 'u-admin',
      promoted_from_lead_id: null,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'ptr-jio',
      tenant_id: 't1',
      legal_name: 'JioFiber Local Services',
      display_name: 'JioFiber Local',
      contact_phone: '9876500001',
      contact_email: 'jio@partners.example',
      address: '8 Park Street, Kolkata',
      gst_number: '19BBBBB0000B1Z5',
      service_types: ['BROADBAND'],
      is_active: true,
      onboarded_at: '2026-08-01T00:00:00.000Z',
      onboarded_by_admin_id: 'u-admin',
      promoted_from_lead_id: null,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z'
    }
  ],
  partner_regions: [
    { id: 'prg-adhya-r1', partner_id: 'ptr-adhya', region_id: 'r1', service_type: 'CABLE', is_active: true, created_at: '2026-08-01T00:00:00.000Z' },
    { id: 'prg-adhya-r2', partner_id: 'ptr-adhya', region_id: 'r2', service_type: 'CABLE', is_active: true, created_at: '2026-08-01T00:00:00.000Z' },
    { id: 'prg-jio-r1', partner_id: 'ptr-jio', region_id: 'r1', service_type: 'BROADBAND', is_active: true, created_at: '2026-08-01T00:00:00.000Z' }
  ],
  partner_packages: [
    {
      id: 'ppk-adhya-basic',
      partner_id: 'ptr-adhya',
      service_type: 'CABLE',
      name: '₹250 Cable Basic Monthly',
      description: 'Basic tier cable connection for one month',
      face_value_rupees: 250,
      cost_to_partner_rupees: 250,
      point_cost: 250,
      active_regions: ['r1', 'r2'],
      is_active: true,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'ppk-adhya-premium',
      partner_id: 'ptr-adhya',
      service_type: 'CABLE',
      name: '₹500 Cable Premium Monthly',
      description: 'Premium tier cable connection with HD channels',
      face_value_rupees: 500,
      cost_to_partner_rupees: 500,
      point_cost: 500,
      active_regions: ['r1'],
      is_active: true,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'ppk-jio-basic',
      partner_id: 'ptr-jio',
      service_type: 'BROADBAND',
      name: '₹500 Broadband Basic Monthly',
      description: '100 Mbps unlimited broadband connection',
      face_value_rupees: 500,
      cost_to_partner_rupees: 500,
      point_cost: 500,
      active_regions: ['r1'],
      is_active: true,
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z'
    }
  ],
  partner_users: [
    { id: 'pu-adhya', partner_id: 'ptr-adhya', user_id: 'u-ptr-adhya', role: 'OWNER', created_at: '2026-08-01T00:00:00.000Z' },
    { id: 'pu-jio', partner_id: 'ptr-jio', user_id: 'u-ptr-jio', role: 'OWNER', created_at: '2026-08-01T00:00:00.000Z' }
  ],
  customer_partner_bindings: [
    {
      customer_user_id: 'u-cust1',
      cable_partner_id: 'ptr-adhya',
      broadband_partner_id: 'ptr-jio',
      updated_at: '2026-08-01T00:00:00.000Z'
    }
  ],
  vendors: [
    { id: 'v1', tenant_id: 't1', region_id: 'r1', name: 'Kolkata Wholesale Mart', created_at: new Date().toISOString() },
    { id: 'v2', tenant_id: 't1', region_id: 'r2', name: 'Bishnupur Agro Suppliers', created_at: new Date().toISOString() }
  ],
  stockists: [
    { id: 's1', tenant_id: 't1', region_id: 'r1', user_id: 'u-stk1', name: 'Madan Grocers', vendor_id: 'v1', delivery_radius_km: 3.0, min_order_value: 0, is_active: true, opening_time: '08:00', closing_time: '20:00', prep_eta_minutes: 10, created_at: new Date().toISOString() },
    { id: 's2', tenant_id: 't1', region_id: 'r2', user_id: 'u-stk2', name: 'Sarkar Daily Store', vendor_id: 'v2', delivery_radius_km: 6.0, min_order_value: 0, is_active: true, opening_time: '08:00', closing_time: '20:00', prep_eta_minutes: 15, created_at: new Date().toISOString() },
    { id: 's3', tenant_id: 't1', region_id: 'r1', user_id: 'u-stk4', name: 'Banerjee Corner Store', vendor_id: 'v1', delivery_radius_km: 2.5, min_order_value: 0, is_active: true, opening_time: '09:00', closing_time: '21:00', prep_eta_minutes: 10, created_at: new Date().toISOString() }
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
    { stockist_id: 's2', product_id: 'p10-r2', stock_qty: 18, is_available: true },

    // s3 = Banerjee Corner Store (r1) — stocked for alternatives search
    { stockist_id: 's3', product_id: 'p1', stock_qty: 30, is_available: true },
    { stockist_id: 's3', product_id: 'p2', stock_qty: 25, is_available: true },
    { stockist_id: 's3', product_id: 'p3', stock_qty: 15, is_available: true },
    { stockist_id: 's3', product_id: 'p4', stock_qty: 80, is_available: true },
    { stockist_id: 's3', product_id: 'p5', stock_qty: 40, is_available: true },
    { stockist_id: 's3', product_id: 'p8', stock_qty: 60, is_available: true },
    { stockist_id: 's3', product_id: 'p9', stock_qty: 50, is_available: true }
  ],
  orders: [],
  order_items: [],
  split_payouts: [],
  // Append-only ledger for every payment state transition
  payment_ledger: [],
  // COD commission outstanding per stockist
  cod_commission_ledger: [],
  points_ledger: [
    { id: 'l-init1', tenant_id: 't1', region_id: 'r1', customer_id: 'u-cust1', amount: 50.0, type: 'EARN', order_id: null, description: 'Welcome signup bonus points', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'l-init2', tenant_id: 't1', region_id: 'r2', customer_id: 'u-cust2', amount: 30.0, type: 'EARN', order_id: null, description: 'Welcome signup bonus points', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
  ],
  // Deprecated: legacy per-order commission rates retained for gross_v1 historical order compatibility. Superceded by commission_config (profit_v2).
  commission_rates: [
    { id: 'c1', tenant_id: 't1', region_id: 'r1', category: 'groceries', rate_percent: 10.0, created_at: new Date().toISOString() },
    { id: 'c2', tenant_id: 't1', region_id: 'r2', category: 'groceries', rate_percent: 8.0, created_at: new Date().toISOString() }
  ],
  // Deprecated: legacy stockist commission rates retained for gross_v1 historical order compatibility. Superceded by commission_config (profit_v2).
  stockist_commission_rates: [
    { id: 'scr1', stockist_id: 's1', rate_percent: 10.0, created_at: new Date().toISOString() },
    { id: 'scr2', stockist_id: 's2', rate_percent: 8.0, created_at: new Date().toISOString() },
    { id: 'scr3', stockist_id: 's3', rate_percent: 10.0, created_at: new Date().toISOString() }
  ],
  // Deprecated: legacy points earn config retained for gross_v1 historical order compatibility. Superceded by commission_config (profit_v2).
  points_earn_config: [
    { id: 'pec1', region_id: 'r1', stockist_id: null, earn_rate_percent: 45.0, created_at: new Date().toISOString() },
    { id: 'pec2', region_id: 'r2', stockist_id: null, earn_rate_percent: 45.0, created_at: new Date().toISOString() }
  ],
  commission_config: [
    {
      id: 'cc-default',
      scope: 'GLOBAL',
      stockist_id: null,
      stockist_reinvest_pct: 50,
      points_from_pot_pct: 40,
      partner_redemption_cut_pct: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  feedback_reports: [],
  stockist_vendors: [
    { stockist_id: 's1', vendor_id: 'v1', approved_at: new Date().toISOString() },
    { stockist_id: 's2', vendor_id: 'v2', approved_at: new Date().toISOString() },
    { stockist_id: 's3', vendor_id: 'v1', approved_at: new Date().toISOString() }
  ],
  anomaly_logs: [],
  partner_leads: [],
  fraud_reports: [],
  admin_audit_log: [],
  redemption_approvals: []
};

// Seed r2 products
DEFAULT_DB.products.push(
  { id: 'p1-r2', tenant_id: 't1', region_id: 'r2', name: 'Fresh Potatoes (Alu, 1kg)', category: 'groceries', price: 30.0, cost_price: 22.0, description: 'Staple local potatoes', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
  { id: 'p2-r2', tenant_id: 't1', region_id: 'r2', name: 'Fresh Onions (Piaj, 1kg)', category: 'groceries', price: 45.0, cost_price: 35.0, description: 'Red onions for daily cooking', image_url: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
  { id: 'p3-r2', tenant_id: 't1', region_id: 'r2', name: 'Masoor Dal (500g)', category: 'groceries', price: 60.0, cost_price: 48.0, description: 'Red split lentils', image_url: 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
  { id: 'p4-r2', tenant_id: 't1', region_id: 'r2', name: 'Refined Sugar (1kg)', category: 'groceries', price: 45.0, cost_price: 38.0, description: 'Pure white sugar', image_url: 'https://images.unsplash.com/photo-1622484211148-716598e04141?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
  { id: 'p5-r2', tenant_id: 't1', region_id: 'r2', name: 'Aashirvaad Atta (1kg)', category: 'groceries', price: 55.0, cost_price: 45.0, description: 'Whole wheat flour', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
  { id: 'p6-r2', tenant_id: 't1', region_id: 'r2', name: 'Amul Butter (100g)', category: 'groceries', price: 58.0, cost_price: 50.0, description: 'Pasteurized salted butter', image_url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
  { id: 'p7-r2', tenant_id: 't1', region_id: 'r2', name: 'Kachi Ghani Mustard Oil (500ml)', category: 'groceries', price: 90.0, cost_price: 75.0, description: 'Pure cold-pressed mustard oil', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
  { id: 'p8-r2', tenant_id: 't1', region_id: 'r2', name: 'Tata Salt (1kg)', category: 'groceries', price: 28.0, cost_price: 22.0, description: 'Iodized salt', image_url: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() },
  { id: 'p9-r2', tenant_id: 't1', region_id: 'r2', name: 'Marie Gold Biscuits (250g)', category: 'groceries', price: 30.0, cost_price: 25.0, description: 'Crunchy tea-time biscuits', image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=300', created_at: new Date().toISOString() }
);

DEFAULT_DB.product_bill_photos = [];

function read() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      write(DEFAULT_DB);
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.payment_ledger) parsed.payment_ledger = [];
    if (!parsed.cod_commission_ledger) parsed.cod_commission_ledger = [];
    if (!parsed.partner_leads) parsed.partner_leads = [];
    if (!parsed.fraud_reports) parsed.fraud_reports = [];
    if (!parsed.admin_audit_log) parsed.admin_audit_log = [];
    if (!parsed.product_bill_photos) parsed.product_bill_photos = [];
    if (!parsed.redemption_approvals) parsed.redemption_approvals = [];
    if (!parsed.partners) parsed.partners = JSON.parse(JSON.stringify(DEFAULT_DB.partners));
    if (!parsed.partner_regions) parsed.partner_regions = JSON.parse(JSON.stringify(DEFAULT_DB.partner_regions));
    if (!parsed.partner_packages) parsed.partner_packages = JSON.parse(JSON.stringify(DEFAULT_DB.partner_packages));
    if (!parsed.partner_users) parsed.partner_users = JSON.parse(JSON.stringify(DEFAULT_DB.partner_users));
    if (!parsed.customer_partner_bindings) parsed.customer_partner_bindings = JSON.parse(JSON.stringify(DEFAULT_DB.customer_partner_bindings));
    if (!parsed.commission_config || !Array.isArray(parsed.commission_config) || parsed.commission_config.length === 0) {
      parsed.commission_config = [
        {
          id: 'cc-default',
          scope: 'GLOBAL',
          stockist_id: null,
          stockist_reinvest_pct: 50,
          points_from_pot_pct: 40,
          partner_redemption_cut_pct: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }

    // Safe backfills on read
    if (parsed.users && Array.isArray(parsed.users)) {
      parsed.users.forEach(u => {
        if (u.is_active === undefined) u.is_active = true;
        if (u.password_hash === undefined) u.password_hash = null;
        if (u.email === undefined) u.email = null;
      });
    }
    if (parsed.stockists && Array.isArray(parsed.stockists)) {
      parsed.stockists.forEach(s => {
        if (s.is_active === undefined) s.is_active = true;
      });
    }
    if (parsed.partner_leads && Array.isArray(parsed.partner_leads)) {
      parsed.partner_leads.forEach(l => {
        if (!l.notes) l.notes = [];
        if (!l.status) l.status = 'NEW';
        if (l.promoted_partner_id === undefined) l.promoted_partner_id = null;
        if (l.promoted_by_admin_id === undefined) l.promoted_by_admin_id = null;
        if (l.promoted_at === undefined) l.promoted_at = null;
      });
    }
    if (parsed.orders && Array.isArray(parsed.orders)) {
      parsed.orders.forEach(o => {
        if (!o.commission_model) {
          o.commission_model = 'gross_v1';
        }
      });
    }
    if (parsed.products && Array.isArray(parsed.products)) {
      parsed.products.forEach(p => {
        if (p.latest_bill_photo_id === undefined) p.latest_bill_photo_id = null;
        if (p.has_flagged_bill === undefined) p.has_flagged_bill = false;
      });
    }
    return parsed;
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
