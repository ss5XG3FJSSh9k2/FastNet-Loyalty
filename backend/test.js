const db = require('./db');
const { evaluateRegistrationFlags } = require('./lib/kyc-flags');

async function run() {
  await db.init();
  const users = await db.getTable('users') || [];
  const stockists = await db.getTable('stockists') || [];
  const orders = await db.getTable('orders') || [];

  console.log('=== TEST 1: Hard Delete ===');
  // Register stockist
  const id1 = 'u-test1';
  users.push({
    id: id1,
    role: 'STOCKIST',
    phone: '1111111111',
    kyc_status: 'REJECTED',
    kyc_details: { id_number: '123412341234' }
  });
  await db.saveTable('users', users);

  // simulate delete endpoint logic
  let matches = 0;
  for (const t of ['orders', 'points_ledger']) {
    const records = await db.getTable(t);
    for (const r of records) {
      if (Object.values(r).includes(id1)) matches++;
    }
  }

  if (matches === 0) {
    console.log('Zero references, simulating DELETE.');
    const idx = users.findIndex(u => u.id === id1);
    users.splice(idx, 1);
    await db.saveTable('users', users);
  }

  // Register again
  const existing = users.find(u => u.phone === '1111111111' && u.kyc_status !== 'RELEASED');
  console.log('Existing user after delete? (should be undefined):', existing?.id);

  console.log('\n=== TEST 2: Release ===');
  const id2 = 'u-test2';
  users.push({
    id: id2,
    role: 'STOCKIST',
    phone: '2222222222',
    name: 'Test 2',
    kyc_status: 'REJECTED',
    kyc_rejection_reason: 'bad address',
    kyc_rejected_at: new Date('2026-09-12').toISOString(),
    kyc_details: { id_number: '987698769876' }
  });
  await db.saveTable('users', users);

  orders.push({ id: 'o-test2', customer_id: id2 });
  await db.saveTable('orders', orders);

  // simulate delete endpoint logic
  let matches2 = 0;
  for (const t of ['orders', 'points_ledger']) {
    const records = await db.getTable(t);
    for (const r of records) {
      if (Object.values(r).includes(id2)) matches2++;
    }
  }

  if (matches2 > 0) {
    console.log(\Has \ references, simulating RELEASE.\);
    const u = users.find(u => u.id === id2);
    u.kyc_status = 'RELEASED';
    u.released_at = new Date().toISOString();
    await db.saveTable('users', users);
  }

  // Register again
  const existing2 = users.find(u => u.phone === '2222222222' && u.kyc_status !== 'RELEASED');
  console.log('Existing user after release? (should be undefined):', existing2?.id);

  console.log('\n=== TEST 3: Duplicate ID Check ===');
  const newUser = {
    id: 'u-test3',
    phone: '3333333333',
    role: 'STOCKIST',
    kyc_status: 'PENDING',
    kyc_details: { id_number: '987698769876' } // matches id2
  };
  const flags = await evaluateRegistrationFlags(newUser, '127.0.0.1');
  const dupFlag = flags.find(f => f.flag_type === 'DUPLICATE_ID');
  console.log('Duplicate flag detail:');
  console.log(dupFlag?.detail);

}
run().catch(console.error);
