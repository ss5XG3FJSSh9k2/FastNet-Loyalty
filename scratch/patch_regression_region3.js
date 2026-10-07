const fs = require('fs');

const file = 'x:/app/backend/tests/regression.js';
let content = fs.readFileSync(file, 'utf8');

const testCode = `
  // --- BF-PARTNER-REGION-MULTI ---
  console.log('\\n--- 35. BF-PARTNER-REGION-MULTI (Multi-service Add Region) ---');

  // Create a partner with 4 services
  const pRegionLeadRes = await post('http://localhost:3001/api/partner-leads', {
    name: 'Multi Region Partner',
    contact_name: 'Multi Region Partner',
    phone: '9988771122', email: 'test_9988771122@fastnet.test',
    services: 'CABLE, BROADBAND, DTH, OTT_BUNDLE',
    pincode: '700001'
  });
  const pRegLeadId = pRegionLeadRes.body.lead.id;
  await post(\`http://localhost:3001/api/admin/partner-leads/\${pRegLeadId}/accept\`);
  const prList = await get('http://localhost:3001/api/admin/partners');
  const prPartner = prList.body.find(p => p.phone === '9988771122');

  // Setup login
  await post('http://localhost:3001/api/partner/auth/login-otp-request', { phone: '9988771122', email: 'test_9988771122@fastnet.test' });
  const pRegOtpLogin = await post('http://localhost:3001/api/partner/auth/login-otp-verify', { phone: '9988771122', email: 'test_9988771122@fastnet.test', otp: '123456' });
  const pRegSetupToken = pRegOtpLogin.body.setup_token;
  await post('http://localhost:3001/api/partner/auth/setup-complete', { email: 'multiregion@example.com', password: 'password123' }, { headers: { Authorization: \`Bearer \${pRegSetupToken}\` } });
  const pRegLoginRes = await post('http://localhost:3001/api/partner/auth/login-password', { email: 'multiregion@example.com', password: 'password123' });
  const pRegToken = pRegLoginRes.body.token || pRegLoginRes.body.session_token;

  // 1. service_types of all four for a new region: 200, four rows created, skipped empty.
  const r1Res = await post('http://localhost:3001/api/partner/regions', {
    region_id: 'r1',
    service_types: ['CABLE', 'BROADBAND', 'DTH', 'OTT_BUNDLE']
  }, { headers: { Authorization: \`Bearer \${pRegToken}\` } });
  assert(r1Res.status === 200, 'POST 4 services at once -> 200');
  assert(r1Res.body.created.length === 4, '4 rows created');
  assert(r1Res.body.skipped.length === 0, '0 skipped');
  pass('POST 4 services at once');

  // 2. The same call again: 409 (all duplicates).
  const r2Res = await post('http://localhost:3001/api/partner/regions', {
    region_id: 'r1',
    service_types: ['CABLE', 'BROADBAND', 'DTH', 'OTT_BUNDLE']
  }, { headers: { Authorization: \`Bearer \${pRegToken}\` } });
  assert(r2Res.status === 409, 'Same call again -> 409 (all duplicates)');
  pass('Same call again -> 409 (all duplicates)');

  // 3. Two services already exist and two are new: 200 with two created and two skipped.
  // First, we add only 2 services for r2
  await post('http://localhost:3001/api/partner/regions', {
    region_id: 'r2',
    service_types: ['CABLE', 'BROADBAND']
  }, { headers: { Authorization: \`Bearer \${pRegToken}\` } });
  // Now add all 4 to r2
  const r3Res = await post('http://localhost:3001/api/partner/regions', {
    region_id: 'r2',
    service_types: ['CABLE', 'BROADBAND', 'DTH', 'OTT_BUNDLE']
  }, { headers: { Authorization: \`Bearer \${pRegToken}\` } });
  assert(r3Res.status === 200, 'Mix of existing and new -> 200');
  assert(r3Res.body.created.length === 2, '2 rows created');
  assert(r3Res.body.skipped.length === 2, '2 skipped');
  pass('Mix of existing and new -> 200');

  // 4. One invalid service in the list: 400 and nothing created.
  const r4Res = await post('http://localhost:3001/api/partner/regions', {
    region_id: 'r3',
    service_types: ['CABLE', 'FAKE_SERVICE']
  }, { headers: { Authorization: \`Bearer \${pRegToken}\` } });
  assert(r4Res.status === 400, 'Invalid service in list -> 400');
  
  // Verify r3 was not created
  const r3CheckRes = await get('http://localhost:3001/api/partner/regions', { headers: { Authorization: \`Bearer \${pRegToken}\` } });
  assert(!r3CheckRes.body.some(r => r.region_id === 'r3'), 'Nothing created for r3');
  pass('Invalid service in list -> 400 and nothing created');

  // 5. A nonexistent region: 400.
  const r5Res = await post('http://localhost:3001/api/partner/regions', {
    region_id: 'r999999999',
    service_types: ['CABLE']
  }, { headers: { Authorization: \`Bearer \${pRegToken}\` } });
  assert(r5Res.status === 400, 'Nonexistent region -> 400');
  pass('Nonexistent region -> 400');

  // 6. The old single service_type call still works.
  const r6Res = await post('http://localhost:3001/api/partner/regions', {
    region_id: 'r4',
    service_type: 'CABLE'
  }, { headers: { Authorization: \`Bearer \${pRegToken}\` } });
  assert(r6Res.status === 200, 'Old single service_type call still works -> 200');
  pass('Old single service_type call still works -> 200');

  // Create another partner with only 1 service (Cable)
  const singleLeadRes = await post('http://localhost:3001/api/partner-leads', {
    name: 'Single Service Partner',
    contact_name: 'Single',
    phone: '9988771133', email: 'test_9988771133@fastnet.test',
    services: 'CABLE',
    pincode: '700001'
  });
  await post(\`http://localhost:3001/api/admin/partner-leads/\${singleLeadRes.body.lead.id}/accept\`);
  await post('http://localhost:3001/api/partner/auth/login-otp-request', { phone: '9988771133', email: 'test_9988771133@fastnet.test' });
  const singleOtpLogin = await post('http://localhost:3001/api/partner/auth/login-otp-verify', { phone: '9988771133', email: 'test_9988771133@fastnet.test', otp: '123456' });
  await post('http://localhost:3001/api/partner/auth/setup-complete', { email: 'single@example.com', password: 'password123' }, { headers: { Authorization: \`Bearer \${singleOtpLogin.body.setup_token}\` } });
  const singleLoginRes = await post('http://localhost:3001/api/partner/auth/login-password', { email: 'single@example.com', password: 'password123' });
  const singleToken = singleLoginRes.body.token || singleLoginRes.body.session_token;

  // 7. A partner who offers only Cable cannot add DTH.
  const r7Res = await post('http://localhost:3001/api/partner/regions', {
    region_id: 'r1',
    service_types: ['DTH']
  }, { headers: { Authorization: \`Bearer \${singleToken}\` } });
  assert(r7Res.status === 400, 'Partner who offers only Cable cannot add DTH -> 400');
  pass('Partner who offers only Cable cannot add DTH -> 400');
`;

const target = "console.log(`\\n=== REGRESSION SUITE COMPLETED: ${passedCount}/${testCount} tests passed ===`);";
content = content.replace(target, testCode + '\\n  ' + target);
fs.writeFileSync(file, content);
console.log('Appended perfectly.');
