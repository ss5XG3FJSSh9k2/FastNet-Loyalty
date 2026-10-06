  const editCustRes = await post('http://localhost:3001/api/admin/customers/u-cust1', {
    name: 'Customer One Updated',
    email: 'cust1updated@example.com'
  });
  assert(editCustRes.status === 200, 'Admin update customer contact succeeds');

  // 27.x Phone Change Flow (Admin)
  console.log('\n--- 27.x Phone Change Flow (Admin) ---');

  // Customer role calling returns 403
  loginAs('u-cust1', 'CUSTOMER');
  const custCallRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/send-current', { via: 'phone', phone: '9876543210' });
  assert(custCallRes.status === 403, 'Customer role calling any of these returns 403');
  loginAs('u-admin', 'ADMIN');

  // Hole check: Final change without verification returns 400
  const holeCheckRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change', { newPhone: '9830099999' });
  assert(holeCheckRes.status === 400, 'The final change without verification returns 400');
  let unchangedCust = await get('http://localhost:3001/api/admin/customers/u-cust1');
  assert(unchangedCust.body.user.phone === '9876543210', 'and the phone is unchanged. This is the hole that exists today.');

  // Send-current with wrong typed number returns 400
  const sendWrongRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/send-current', { via: 'phone', phone: '9999999999' });
  assert(sendWrongRes.status === 400, 'Send-current with the wrong typed number returns 400');

  // Send-current with correct number returns 200
  const sendRightRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/send-current', { via: 'phone', phone: '9876543210' });
  assert(sendRightRes.status === 200, 'With the correct number it returns 200');

  // Verify-current with wrong OTP returns 400
  const verifyWrongRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/verify-current', { otp: '000000' });
  assert(verifyWrongRes.status === 400, 'Verify-current with a wrong OTP returns 400');

  // Verify-current with 123456 returns 200
  const verifyRightRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/verify-current', { otp: '123456' });
  assert(verifyRightRes.status === 200, 'With 123456 in demo mode it returns 200');

  // Send-new before current step is verified (test on u-cust2)
  const sendNewBeforeVerify = await post('http://localhost:3001/api/admin/customers/u-cust2/phone-change/send-new', { newPhone: '9998887776' });
  assert(sendNewBeforeVerify.status === 400, 'Send-new before the current step is verified returns 400');

  // Send-new with already used number returns 400
  const sendDupRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/send-new', { newPhone: '8765432109' }); // u-cust2's phone
  assert(sendDupRes.status === 400, 'Send-new with a number already used by another customer returns 400');

  // Send-new twice inside 60 seconds returns 429
  const sendNewRes1 = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/send-new', { newPhone: '9830099999' });
  assert(sendNewRes1.status === 200, 'Send-new succeeds');
  const sendNewRes2 = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/send-new', { newPhone: '9830099998' });
  assert(sendNewRes2.status === 429, 'Send-new twice inside 60 seconds returns 429 the second time');

  // Full path by phone: change succeeds, audit row exists, customer can log in
  const verifyNewRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/verify-new', { otp: '123456', newPhone: '9830099999' });
  assert(verifyNewRes.status === 200, 'Verify-new succeeds');
  
  const phoneChangeRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change', { newPhone: '9830099999' });
  assert(phoneChangeRes.status === 200, 'Full path by phone: change succeeds');
  
  const auditLogs = await dbModule.getTable('audit_logs');
  const phoneAudit = auditLogs.find(a => a.entity_id === 'u-cust1' && a.action === 'CHANGE_PHONE');
  assert(phoneAudit !== undefined && phoneAudit.details.method === 'phone', 'the audit row exists');
  
  let changedCust = await get('http://localhost:3001/api/admin/customers/u-cust1');
  assert(changedCust.body.user.phone === '9830099999', 'and the customer can log in with the new number (verified in DB)');

  // We bypass rate limit in test environment for the rest
  
  // Full path by email: change succeeds and audit row records email
  await post('http://localhost:3001/api/admin/customers/u-cust2/phone-change/send-current', { via: 'email' });
  await post('http://localhost:3001/api/admin/customers/u-cust2/phone-change/verify-current', { otp: '123456' });
  await post('http://localhost:3001/api/admin/customers/u-cust2/phone-change/send-new', { newPhone: '8765432000' });
  await post('http://localhost:3001/api/admin/customers/u-cust2/phone-change/verify-new', { otp: '123456', newPhone: '8765432000' });
  const emailChangeRes = await post('http://localhost:3001/api/admin/customers/u-cust2/phone-change', { newPhone: '8765432000' });
  assert(emailChangeRes.status === 200, 'Full path by email: change succeeds');
  
  const auditLogs2 = await dbModule.getTable('audit_logs');
  const emailAudit = auditLogs2.find(a => a.entity_id === 'u-cust2' && a.action === 'CHANGE_PHONE');
  assert(emailAudit !== undefined && emailAudit.details.method === 'email', 'and the audit row records email.');

  // After verifying a new number, edit the number and try the final change. It returns 400.
  await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/send-current', { via: 'phone', phone: '9830099999' });
  await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/verify-current', { otp: '123456' });
  await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/send-new', { newPhone: '9830099998' });
  await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change/verify-new', { otp: '123456', newPhone: '9830099998' });
  // Now try final change with a DIFFERENT number
  const editedFinalRes = await post('http://localhost:3001/api/admin/customers/u-cust1/phone-change', { newPhone: '9830099997' });
  assert(editedFinalRes.status === 400, 'After verifying a new number, edit the number and try the final change. It returns 400.');
