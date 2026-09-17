ALTER TABLE product_bill_photos ADD COLUMN IF NOT EXISTS bill_status TEXT DEFAULT 'PENDING';
ALTER TABLE commission_rates ADD COLUMN IF NOT EXISTS margin_threshold_percent NUMERIC(5,2) DEFAULT 50.00;
ALTER TABLE stockists ADD COLUMN IF NOT EXISTS verified_bill_streak INT DEFAULT 0;
ALTER TABLE points_ledger ADD COLUMN IF NOT EXISTS reference_id UUID;
