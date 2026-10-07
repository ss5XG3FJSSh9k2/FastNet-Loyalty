const fs = require('fs');
const file = 'x:/app/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

const oldValidation = `
    // Validate payout fields
    if (payload.payout_upi_id !== undefined) {
      if (payload.payout_upi_id && !/^[\\w.-]+@[\\w.-]+$/.test(payload.payout_upi_id)) {
        return res.status(400).json({ error: 'Malformed UPI ID' });
      }
      stockist.payout_upi_id = payload.payout_upi_id;
    }
    if (payload.payout_ifsc !== undefined) {
      if (payload.payout_ifsc && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(payload.payout_ifsc)) {
        return res.status(400).json({ error: 'Malformed IFSC code' });
      }
      stockist.payout_ifsc = payload.payout_ifsc;
    }
    if (payload.payout_bank_account !== undefined) stockist.payout_bank_account = payload.payout_bank_account;
    if (payload.payout_account_name !== undefined) stockist.payout_account_name = payload.payout_account_name;
    if (payload.contact_phone !== undefined) stockist.contact_phone = payload.contact_phone;
`;

const newValidation = `
    // Validate payout fields
    const payoutVal = validatePayoutFields(payload);
    if (!payoutVal.ok) {
      return res.status(400).json({ error: payoutVal.error });
    }
    const oldStockist = { ...stockist };
    if (payoutVal.values.payout_upi_id !== undefined) stockist.payout_upi_id = payoutVal.values.payout_upi_id;
    if (payoutVal.values.payout_ifsc !== undefined) stockist.payout_ifsc = payoutVal.values.payout_ifsc;
    if (payoutVal.values.payout_bank_account !== undefined) stockist.payout_bank_account = payoutVal.values.payout_bank_account;
    if (payoutVal.values.payout_account_name !== undefined) stockist.payout_account_name = payoutVal.values.payout_account_name;
    
    if (payload.contact_phone !== undefined) stockist.contact_phone = payload.contact_phone;
`;
content = content.replace(oldValidation, newValidation);

const oldSave = `    await db.saveTable('stockists', stockists);
    res.json(stockist);
  } catch (err) {`;
const newSave = `    await db.saveTable('stockists', stockists);
    await capturePayoutEvent(req, 'stockist', stockist.id, oldStockist, stockist, req.user.userId);
    res.json(stockist);
  } catch (err) {`;
content = content.replace(oldSave, newSave);

fs.writeFileSync(file, content);
console.log('Patched stockist route.');
