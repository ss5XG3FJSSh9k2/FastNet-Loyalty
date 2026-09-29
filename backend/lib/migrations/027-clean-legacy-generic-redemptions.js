module.exports = {
  up: async (db) => {
    const generateId = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const approvals = await db.getTable('redemption_approvals');
    const users = await db.getTable('users');

    const targetStatuses = ['PENDING_ADMIN_APPROVAL', 'APPROVED', 'APPROVED_AWAITING_PARTNER', 'DISPUTED'];

    for (const row of approvals) {
      const isGeneric = (row.package_id && row.package_id.startsWith('gr-')) || 
                        (row.partner_package_id && row.partner_package_id.startsWith('gr-')) || 
                        (row.partner_id === 'GENERIC');

      if (isGeneric && targetStatuses.includes(row.status)) {
        if (row.refund_ledger_id) continue; // Idempotency check

        const oldStatus = row.status;
        row.status = 'REJECTED';
        row.rejected_reason = 'Generic rewards are now coupons applied at checkout';
        row.rejected_at = new Date().toISOString();

        const cust = users.find(u => u.id === row.customer_user_id);
        const refundLedgerId = 'l-' + generateId();
        
        await db.insertRow('points_ledger', {
          id: refundLedgerId,
          tenant_id: cust ? cust.tenant_id : 't1',
          region_id: cust ? cust.region_id : 'r1',
          customer_id: row.customer_user_id,
          amount: Math.abs(parseFloat(row.points_deducted || 0)),
          type: 'REDEEM_REFUND',
          order_id: null,
          description: 'Reward redemption refunded: coupon change',
          created_at: new Date().toISOString()
        });

        row.refund_ledger_id = refundLedgerId;
        
        await db.updateRow('redemption_approvals', row.id, row);

        await db.insertRow('admin_audit_log', {
          id: 'audit-' + generateId(),
          action: 'REJECT_REDEMPTION',
          entity_type: 'redemption_approval',
          entity_id: row.id,
          admin_user_id: 'SYSTEM_MIGRATION',
          before: { status: oldStatus },
          after: { status: row.status, refund_ledger_id: refundLedgerId },
          reason: 'Generic rewards are now coupons applied at checkout',
          created_at: new Date().toISOString()
        });
      }
    }
  }
};
