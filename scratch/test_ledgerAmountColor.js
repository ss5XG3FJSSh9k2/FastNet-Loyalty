const ledgerAmountColor = (entry) => {
  if (entry.type === 'EARN') return 'var(--accent)';
  if (entry.type === 'EARN_HELD') return 'var(--warning)';
  if (entry.type === 'MANUAL_CREDIT') return 'var(--warning)';
  if (entry.amount > 0) return 'var(--accent)';
  if (entry.amount < 0) return 'var(--danger)';
  return 'var(--text-main)';
};

let fails = 0;
const assertColor = (entry, expected) => {
  const actual = ledgerAmountColor(entry);
  if (actual !== expected) {
    console.error(`FAIL: expected ${expected} but got ${actual} for`, entry);
    fails++;
  } else {
    console.log(`PASS: ${entry.type || 'unknown'} (${entry.amount}) -> ${actual}`);
  }
};

assertColor({ type: 'EARN', amount: 100 }, 'var(--accent)');
assertColor({ type: 'EARN_HELD', amount: 50 }, 'var(--warning)');
assertColor({ type: 'MANUAL_CREDIT', amount: 10 }, 'var(--warning)');
assertColor({ type: 'REFERRAL_BONUS', amount: 500 }, 'var(--accent)');
assertColor({ type: 'REDEEM_REFUND', amount: 20 }, 'var(--accent)');
assertColor({ type: 'REDEEM', amount: -200 }, 'var(--danger)');
assertColor({ type: 'EARN_VOID', amount: -50 }, 'var(--danger)');
assertColor({ type: 'COUPON', amount: -100 }, 'var(--danger)');
assertColor({ type: 'MYSTERY_TYPE', amount: 5 }, 'var(--accent)');
assertColor({ type: 'MYSTERY_TYPE', amount: -5 }, 'var(--danger)');

if (fails > 0) {
  console.error(`\nFAILED ${fails} tests`);
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED');
}
