ALTER TABLE generic_rewards ADD COLUMN cooldown_type TEXT DEFAULT 'NONE';
ALTER TABLE generic_rewards ADD COLUMN cooldown_days INTEGER;
ALTER TABLE generic_rewards ADD COLUMN valid_until TEXT;
