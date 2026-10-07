ALTER TABLE partners ADD COLUMN IF NOT EXISTS payout_upi_id TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS payout_bank_account TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS payout_bank_ifsc TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS payout_account_name TEXT;
