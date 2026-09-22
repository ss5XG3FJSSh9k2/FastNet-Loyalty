ALTER TABLE split_payouts ADD COLUMN IF NOT EXISTS is_cod BOOLEAN DEFAULT false;

UPDATE split_payouts
SET is_cod = true
WHERE order_id IN (SELECT id FROM orders WHERE payment_method = 'COD');
