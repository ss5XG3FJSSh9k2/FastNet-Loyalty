const fs = require('fs');
const file = 'x:/app/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

const oldPartnerValidation = `
  if (payout_upi_id) {
    if (!/^[\\w.-]+@[\\w.-]+$/.test(payout_upi_id)) {
      return res.status(400).json({ error: "Enter a valid UPI ID like name@bank." });
    }
  }
  if (payout_bank_ifsc) {
    payout_bank_ifsc = payout_bank_ifsc.toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(payout_bank_ifsc)) {
      return res.status(400).json({ error: "IFSC must be 11 characters, like SBIN0000300." });
    }
  }
  if (payout_bank_account) {
    if (!/^\\d{9,18}$/.test(payout_bank_account)) {
      return res.status(400).json({ error: "Bank account number must be 9 to 18 digits." });
    }
  }
  if (payout_account_name) {
    if (!/^[A-Za-z\\s.-]{2,80}$/.test(payout_account_name)) {
      return res.status(400).json({ error: "Enter the account holder's name." });
    }
  }
`;

const newPartnerValidation = `
  const payoutVal = validatePayoutFields({ payout_upi_id, payout_bank_account, payout_bank_ifsc, payout_account_name });
  if (!payoutVal.ok) {
    return res.status(400).json({ error: payoutVal.error });
  }
  if (payoutVal.values.payout_upi_id !== undefined) payout_upi_id = payoutVal.values.payout_upi_id;
  if (payoutVal.values.payout_bank_account !== undefined) payout_bank_account = payoutVal.values.payout_bank_account;
  if (payoutVal.values.payout_bank_ifsc !== undefined) payout_bank_ifsc = payoutVal.values.payout_bank_ifsc;
  if (payoutVal.values.payout_account_name !== undefined) payout_account_name = payoutVal.values.payout_account_name;
`;

content = content.replace(oldPartnerValidation, newPartnerValidation);

const oldPartnerAudit = `  await appendAudit(req, 'EDIT_PARTNER_PROFILE', 'partner', session.partnerId, beforePartner, finalPartner, session.userId);`;
const newPartnerAudit = `  await appendAudit(req, 'EDIT_PARTNER_PROFILE', 'partner', session.partnerId, beforePartner, finalPartner, session.userId);
  await capturePayoutEvent(req, 'partner', session.partnerId, beforePartner, finalPartner, session.userId);`;

content = content.replace(oldPartnerAudit, newPartnerAudit);

fs.writeFileSync(file, content);
console.log('Patched partner route.');
