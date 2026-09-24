UPDATE points_ledger
SET billing_sync_status = 'RELEASED'
WHERE type = 'EARN_HELD'
  AND billing_sync_status = 'HELD'
  AND id IN (
    SELECT reference_id FROM points_ledger
    WHERE type = 'EARN'
  );
