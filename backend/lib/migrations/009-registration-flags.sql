CREATE TABLE IF NOT EXISTS registration_flags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  detail TEXT,
  related_user_ids JSONB,
  created_at TIMESTAMPTZ,
  cleared_by TEXT,
  cleared_at TIMESTAMPTZ,
  cleared_note TEXT
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_ip TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
