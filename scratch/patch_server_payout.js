const fs = require('fs');

const file = 'x:/app/backend/server.js';
let content = fs.readFileSync(file, 'utf8');

// We need to replace the body of the `app.patch('/api/partner/me', requireAuth, async (req, res) => {`
// from `let { display_name... }` down to `});`

const startIndex = content.indexOf(`  let { display_name, contact_phone, contact_email, address, confirm_phone_change, payout_upi_id, payout_bank_account, payout_bank_ifsc, payout_account_name } = req.body;`);
const endIndex = content.indexOf(`// Part 4: Partner Feedback`);

if (startIndex === -1 || endIndex === -1) {
  console.log('Could not find start or end index');
  process.exit(1);
}

const newBody = `
  const trimField = (val) => typeof val === 'string' ? val.trim() : val;
  let { display_name, contact_phone, contact_email, address, confirm_phone_change, payout_upi_id, payout_bank_account, payout_bank_ifsc, payout_account_name } = req.body;
  
  display_name = trimField(display_name);
  contact_phone = trimField(contact_phone);
  contact_email = trimField(contact_email);
  address = trimField(address);
  payout_upi_id = trimField(payout_upi_id);
  payout_bank_account = trimField(payout_bank_account);
  payout_bank_ifsc = trimField(payout_bank_ifsc);
  payout_account_name = trimField(payout_account_name);

  if (display_name !== undefined && display_name.length > 100) {
    return res.status(400).json({ error: "Display name cannot exceed 100 characters." });
  }
  if (address !== undefined && address.length > 300) {
    return res.status(400).json({ error: "Address cannot exceed 300 characters." });
  }

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

  if (contact_phone !== undefined) {
    const validPhone = checkPhone(contact_phone, res);
    if (!validPhone) return;
    contact_phone = validPhone;
  }
  const partners = await db.getTable('partners');
  const users = await db.getTable('users');

  const partnerRow = partners.find(p => p.id === session.partnerId);
  const userRow = users.find(u => u.id === session.userId);
  if (!partnerRow || !userRow) return res.status(404).json({ error: 'Partner or user record not found' });

  if (contact_email && contact_email.toLowerCase() !== (partnerRow.contact_email || '').toLowerCase()) {
    const normalized = contact_email.toLowerCase();
    const emailConflictUser = users.some(u => u.id !== userRow.id && u.email && u.email.trim().toLowerCase() === normalized);
    const emailConflictPartner = partners.some(p => p.id !== partnerRow.id && p.contact_email && p.contact_email.trim().toLowerCase() === normalized);
    if (emailConflictUser || emailConflictPartner) {
      return res.status(409).json({ error: 'Email already registered' });
    }
  }

  if (contact_phone && contact_phone !== partnerRow.contact_phone) {
    const phoneConflictUser = users.some(u => u.id !== userRow.id && u.phone === contact_phone);
    const phoneConflictPartner = partners.some(p => p.id !== partnerRow.id && p.contact_phone === contact_phone);
    if (phoneConflictUser || phoneConflictPartner) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }
    if (!confirm_phone_change) {
      return res.status(400).json({
        warning: 'Changing phone number will change your login phone',
        requires_confirmation: true,
        confirm_field: 'confirm_phone_change'
      });
    }
  }

  const beforePartner = { ...partnerRow };

  const partnerPatch = {};
  const userPatch = {};
  if (display_name !== undefined) {
    partnerPatch.display_name = display_name;
    userPatch.name = display_name;
  }
  if (contact_phone !== undefined) {
    partnerPatch.contact_phone = contact_phone;
    userPatch.phone = contact_phone;
  }
  if (contact_email !== undefined) {
    partnerPatch.contact_email = contact_email;
    userPatch.email = contact_email;
  }
  if (address !== undefined) {
    partnerPatch.address = address;
    userPatch.address = address;
  }

  if (payout_upi_id !== undefined) partnerPatch.payout_upi_id = payout_upi_id;
  if (payout_bank_account !== undefined) partnerPatch.payout_bank_account = payout_bank_account;
  if (payout_bank_ifsc !== undefined) partnerPatch.payout_bank_ifsc = payout_bank_ifsc;
  if (payout_account_name !== undefined) partnerPatch.payout_account_name = payout_account_name;

  if (Object.keys(partnerPatch).length > 0) {
    partnerPatch.updated_at = new Date().toISOString();
  }

  let finalPartner, finalUser;
  try {
    const txRes = await db.transaction(async (tx) => {
      let p = partnerRow;
      let u = userRow;
      if (Object.keys(partnerPatch).length > 0) {
        p = await tx.updateRow('partners', session.partnerId, partnerPatch);
      }
      if (Object.keys(userPatch).length > 0) {
        u = await tx.updateRow('users', session.userId, userPatch);
      }
      return { p, u };
    });
    finalPartner = txRes.p;
    finalUser = txRes.u;
  } catch (err) {
    console.error('[PATCH /api/partner/me] Error saving profile:', err);
    return res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred. Please try again later.' });
  }

  await appendAudit(req, 'EDIT_PARTNER_PROFILE', 'partner', session.partnerId, beforePartner, finalPartner, session.userId);

  return res.json({
    partner: finalPartner,
    user: sanitizeUser(finalUser)
  });
});

`;

const replaced = content.substring(0, startIndex) + newBody + content.substring(endIndex);
fs.writeFileSync(file, replaced);
console.log('patched');
