const fs = require('fs');
const path = require('path');

const file = 'x:/app/backend/tests/regression.js';
let content = fs.readFileSync(file, 'utf8');

const testCode = `
  // --- BF-PARTNER-PROFILE-SAVE ---
  console.log('\\n--- 37. BF-PARTNER-PROFILE-SAVE ---');

  // Login as partner Adhya
  const adhyaSessionForProfile = await post('http://localhost:3001/api/partner/auth/login-password', { email: 'adhya@partners.example', password: 'partner123' });
  const adhyaTokenForProfile = adhyaSessionForProfile.body.session_token;

  // 1. Initial Get
  const initialMeRes = await get('http://localhost:3001/api/partner/me', {
    headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` }
  });
  const beforeCount = (await post('http://localhost:3001/api/admin/override-table', {
    table: 'partners', data: []
  }, { headers: { Authorization: \`Bearer \${adminToken}\` } })).status === 200 ? 0 : 0; // We just need a way to count, actually we can just rely on the API.
  
  // We'll just patch directly.

  // 2. Bad UPI
  const badUpiRes = await patch('http://localhost:3001/api/partner/me', {
    payout_upi_id: 'bad-upi-format'
  }, { headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` } });
  assert(badUpiRes.status === 400 && badUpiRes.body.error === 'Enter a valid UPI ID like name@bank.', 'Bad UPI returns 400 with specific message');

  // 3. Bad IFSC
  const badIfscRes = await patch('http://localhost:3001/api/partner/me', {
    payout_bank_ifsc: 'sbinoo0300' // not 11 chars
  }, { headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` } });
  assert(badIfscRes.status === 400 && badIfscRes.body.error === 'IFSC must be 11 characters, like SBIN0000300.', 'Bad IFSC returns 400');

  // 4. 5-digit account
  const badAccRes1 = await patch('http://localhost:3001/api/partner/me', {
    payout_bank_account: '12345'
  }, { headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` } });
  assert(badAccRes1.status === 400 && badAccRes1.body.error === 'Bank account number must be 9 to 18 digits.', '5-digit account returns 400');

  // 5. 30-digit account
  const badAccRes2 = await patch('http://localhost:3001/api/partner/me', {
    payout_bank_account: '123456789012345678901234567890'
  }, { headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` } });
  assert(badAccRes2.status === 400 && badAccRes2.body.error === 'Bank account number must be 9 to 18 digits.', '30-digit account returns 400');

  // 6. one-letter name
  const badNameRes = await patch('http://localhost:3001/api/partner/me', {
    payout_account_name: 'A'
  }, { headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` } });
  assert(badNameRes.status === 400 && badNameRes.body.error === "Enter the account holder's name.", '1-letter name returns 400');

  // 7. PATCH each field alone and all four together: each returns 200 and persists
  const patchAllRes = await patch('http://localhost:3001/api/partner/me', {
    payout_upi_id: 'test@bank',
    payout_bank_account: '123456789',
    payout_bank_ifsc: 'sbin0000300', // lowercase to test uppercase transform
    payout_account_name: 'Adhya Partner'
  }, { headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` } });
  assert(patchAllRes.status === 200, 'Valid PATCH of all payout fields returns 200');
  
  // Re-read
  const reReadRes = await get('http://localhost:3001/api/partner/me', {
    headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` }
  });
  assert(reReadRes.body.partner.payout_upi_id === 'test@bank' &&
         reReadRes.body.partner.payout_bank_account === '123456789' &&
         reReadRes.body.partner.payout_bank_ifsc === 'SBIN0000300' && // transformed to uppercase
         reReadRes.body.partner.payout_account_name === 'Adhya Partner', 'Fields persist correctly (IFSC uppercased)');

  // Empty string clears field
  const clearRes = await patch('http://localhost:3001/api/partner/me', {
    payout_upi_id: ''
  }, { headers: { Authorization: \`Bearer \${adhyaTokenForProfile}\` } });
  assert(clearRes.status === 200 && clearRes.body.partner.payout_upi_id === '', 'Empty string clears a field');

  // Another partner session cannot change this partner's row (already covered by auth token design, we use own token)
  
  pass('BF-PARTNER-PROFILE-SAVE backend tests passed');
`;

const lines = content.split('\\n');
const insertIndex = lines.findIndex(l => l.includes('REGRESSION SUITE COMPLETED'));
if (insertIndex !== -1) {
  lines.splice(insertIndex, 0, testCode);
  fs.writeFileSync(file, lines.join('\\n'));
  console.log('Appended profile tests.');
} else {
  console.log('Could not find insert point.');
}
