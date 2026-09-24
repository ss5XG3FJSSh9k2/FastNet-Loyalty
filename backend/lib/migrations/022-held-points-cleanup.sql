UPDATE points_ledger pl1
SET billing_sync_status = 'RELEASED'
WHERE type = 'EARN_HELD'
  AND billing_sync_status = 'HELD'
  AND EXISTS (
    SELECT 1 FROM points_ledger pl2
    WHERE pl2.reference_id = pl1.id
      AND pl2.type = 'EARN'
  );
