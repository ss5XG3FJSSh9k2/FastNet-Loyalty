ALTER TABLE partner_leads ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE partner_leads ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE partner_leads ADD COLUMN IF NOT EXISTS region_id TEXT;
