ALTER TABLE split_payouts ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE split_payouts ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE split_payouts ADD COLUMN IF NOT EXISTS paid_by_admin_id TEXT;
ALTER TABLE split_payouts ADD COLUMN IF NOT EXISTS payment_reference TEXT;

ALTER TABLE cod_commission_ledger ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
ALTER TABLE cod_commission_ledger ADD COLUMN IF NOT EXISTS settled_by_admin_id TEXT;
ALTER TABLE cod_commission_ledger ADD COLUMN IF NOT EXISTS payment_reference TEXT;

ALTER TABLE stockist_cod_commissions ADD COLUMN IF NOT EXISTS payment_reference TEXT;
