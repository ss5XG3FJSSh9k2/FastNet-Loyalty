const mockOutbox = [];

function isSmsConfigured() {
  const isMock = process.env.SMS_MOCK === 'true' || process.env.SMS_MOCK !== 'false';
  const hasMsg91 = !!process.env.MSG91_AUTH_KEY && process.env.MSG91_AUTH_KEY !== 'your_msg91_key_when_ready';
  return isMock || hasMsg91;
}

async function sendSms(phone, body) {
  const isMock = process.env.SMS_MOCK === 'true' || process.env.SMS_MOCK !== 'false';
  const hasMsg91 = !!process.env.MSG91_AUTH_KEY && process.env.MSG91_AUTH_KEY !== 'your_msg91_key_when_ready';

  if (!isSmsConfigured()) {
    const err = new Error('SMS service unavailable');
    err.code = 'SMS_NOT_CONFIGURED';
    throw err;
  }

  if (isMock) {
    const entry = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      phone,
      body,
      sent_at: new Date().toISOString()
    };
    mockOutbox.push(entry);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS Mock] Sent to ${phone}`);
    }
    return entry;
  }

  if (hasMsg91) {
    return { id: `msg91-${Date.now()}`, phone, sent_at: new Date().toISOString() };
  }

  const err = new Error('SMS service unavailable');
  err.code = 'SMS_NOT_CONFIGURED';
  throw err;
}

function getMockOutbox() {
  return mockOutbox;
}

function clearMockOutbox() {
  mockOutbox.length = 0;
}

module.exports = {
  isSmsConfigured,
  sendSms,
  getMockOutbox,
  clearMockOutbox
};
