// Explicit test mode: the regression suite and `npm run dev:seed`. Only this
// unlocks the dev-only admin routes and the fixed demo OTP. Merely running on
// the in-memory database (as `npm run dev` does) is NOT test mode.
const isTestEnv = () => process.env.NODE_ENV === 'test' || process.env.SEED_MODE === 'test';

// Local development conveniences (rate-limit bypass, CAPTCHA bypass) that are
// harmless outside production but must never weaken authentication.
const isLocalDev = () => isTestEnv() || (
  process.env.NODE_ENV !== 'production' && (
    process.env.SKIP_RATE_LIMIT === 'true' ||
    process.env.POSTGRES_MODE === 'mem' ||
    process.env.DEV_LAUNCHER === 'true'
  )
);

// Fixed demo OTP 123456: always in test mode, and in other non-production runs
// only when DEMO_OTP=true is set explicitly (the dev:fresh launcher does this).
// It only affects OTP codes; the test-only admin routes stay closed.
const isDemoOtpMode = () => isTestEnv() || (process.env.DEMO_OTP === 'true' && process.env.NODE_ENV !== 'production');

module.exports = { isTestEnv, isLocalDev, isDemoOtpMode };
