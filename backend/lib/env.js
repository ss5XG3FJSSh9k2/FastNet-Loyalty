const isTestEnv = () => process.env.SKIP_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'test' || process.env.SEED_MODE === 'test' || process.env.POSTGRES_MODE === 'mem';

const isDemoOtpMode = () => isTestEnv() || process.env.SMS_MOCK === 'true';

module.exports = { isTestEnv, isDemoOtpMode };
