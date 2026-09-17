UPDATE product_bill_photos 
SET bill_status = 'REJECTED' 
WHERE flag_status = 'FLAGGED';

ALTER TABLE product_bill_photos DROP COLUMN IF EXISTS flag_status;
ALTER TABLE product_bill_photos DROP COLUMN IF EXISTS flag_reason;
ALTER TABLE product_bill_photos DROP COLUMN IF EXISTS flagged_by_admin_id;
ALTER TABLE product_bill_photos DROP COLUMN IF EXISTS flagged_at;
