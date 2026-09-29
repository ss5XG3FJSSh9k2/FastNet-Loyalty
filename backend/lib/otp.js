const crypto = require('crypto');
const cfg = require('../config.js');
const envMod = require('./env.js');

const otpStore = new Map();

function issueOtp(purposeKey) {
  let code = '123456';
  if (!envMod.isDemoOtpMode()) {
    // Generate secure 6-digit numeric OTP using crypto
    code = crypto.randomInt(100000, 999999).toString();
  }
  
  otpStore.set(purposeKey, {
    otp: code,
    expiresAt: Date.now() + cfg.OTP_TTL_MS,
    attempts: 0
  });
  
  return code;
}

function verifyOtp(purposeKey, codeProvided) {
  if (envMod.isDemoOtpMode() && codeProvided === '123456') {
    return { ok: true };
  }
  
  const record = otpStore.get(purposeKey);
  if (!record) {
    return { ok: false, reason: 'invalid' };
  }
  
  if (record.attempts >= cfg.OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: 'locked' };
  }
  
  if (Date.now() > record.expiresAt) {
    return { ok: false, reason: 'expired' };
  }
  
  if (record.otp !== codeProvided) {
    record.attempts += 1;
    if (record.attempts >= cfg.OTP_MAX_ATTEMPTS) {
      return { ok: false, reason: 'locked' };
    }
    return { ok: false, reason: 'invalid' };
  }
  
  // Success, single-use so delete
  otpStore.delete(purposeKey);
  return { ok: true };
}

module.exports = {
  issueOtp,
  verifyOtp,
  otpStore // exported for testing
};
