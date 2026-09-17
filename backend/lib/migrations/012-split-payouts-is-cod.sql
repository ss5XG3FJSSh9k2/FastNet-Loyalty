ALTER TABLE split_payouts ADD COLUMN IF NOT EXISTS is_cod BOOLEAN DEFAULT false;

UPDATE split_payouts sp
SET is_cod = (o.payment_method = 'COD')
FROM orders o
WHERE sp.order_id = o.id;
