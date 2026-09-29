ALTER TABLE regions ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) NULL;

UPDATE regions SET delivery_fee = 40.00 WHERE code = 'r1';
UPDATE regions SET delivery_fee = 30.00 WHERE code = 'r2';
