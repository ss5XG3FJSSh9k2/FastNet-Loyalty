const mockOutbox = [];

function isEmailConfigured() {
  const isMock = process.env.EMAIL_MOCK !== 'false';
  const hasSendGrid = !!process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_key_when_ready';
  return isMock || hasSendGrid;
}

async function sendEmail(to, subject, htmlBody, textBody) {
  const isMock = process.env.EMAIL_MOCK !== 'false';
  const hasSendGrid = !!process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY !== 'your_sendgrid_key_when_ready';

  if (!isEmailConfigured()) {
    const err = new Error('Email service unavailable');
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }

  if (isMock) {
    const entry = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to,
      subject,
      htmlBody,
      textBody,
      sent_at: new Date().toISOString()
    };
    mockOutbox.push(entry);
    console.log(`[Email Mock] Sent "${subject}" to ${to}`);
    return entry;
  }

  if (hasSendGrid) {
    console.log(`[Email SendGrid] Sent "${subject}" to ${to}`);
    return { id: `sg-${Date.now()}`, to, subject, sent_at: new Date().toISOString() };
  }

  const err = new Error('Email service unavailable');
  err.code = 'EMAIL_NOT_CONFIGURED';
  throw err;
}

function getMockOutbox() {
  return mockOutbox;
}

function clearMockOutbox() {
  mockOutbox.length = 0;
}

module.exports = {
  isEmailConfigured,
  sendEmail,
  getMockOutbox,
  clearMockOutbox
};
