-- 034-audit-log-reviewed.sql
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
