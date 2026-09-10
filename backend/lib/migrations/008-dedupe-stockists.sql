-- 008-dedupe-stockists.sql
-- Normalise any invalid 24:00 closing times to 23:59
UPDATE stockists SET closing_time = '23:59' WHERE closing_time = '24:00';
