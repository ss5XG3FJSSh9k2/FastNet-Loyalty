-- Row Level Security & Compliance Fields

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self_policy ON users FOR SELECT USING (true);

ALTER TABLE stockist_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY stockist_inventory_policy ON stockist_inventory FOR SELECT USING (true);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_customer_policy ON orders FOR SELECT USING (true);

ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_marketing BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN DEFAULT FALSE;
