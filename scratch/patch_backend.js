const phoneChangeMarkers = new Map();
const sendCurrentRateLimits = new Map();
const sendNewRateLimits = new Map();

function getPhoneChangeMarker(id) {
  let m = phoneChangeMarkers.get(id);
  if (!m) { m = {}; phoneChangeMarkers.set(id, m); }
  return m;
}

function checkSendRateLimit(map, id, res) {
  const lastSent = map.get(id);
  if (lastSent && Date.now() - lastSent < 60000) {
    const sec = Math.ceil((60000 - (Date.now() - lastSent)) / 1000);
    res.status(429).json({ error: `Too many requests, try again in ${sec}s` });
    return true;
  }
  map.set(id, Date.now());
  return false;
}

app.post('/api/admin/customers/:id/phone-change/send-current', async (req, res) => {
  const { id } = req.params;
  const { via, phone } = req.body;
  
  const users = await db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  
  if (via === 'phone') {
    if (!phone) return res.status(400).json({ error: 'Does not match the registered number' });
    const cleanPhone = normalizePhone(phone);
    if (cleanPhone !== user.phone) return res.status(400).json({ error: 'Does not match the registered number' });
  } else if (via === 'email') {
    if (!user.email) return res.status(400).json({ error: 'No email on file' });
  } else {
    return res.status(400).json({ error: 'Invalid via method' });
  }

  if (checkSendRateLimit(sendCurrentRateLimits, id, res)) return;
  
  const marker = getPhoneChangeMarker(id);
  marker.currentMethod = via;

  const purposeKey = 'admin-phone-change-current:' + id;
  const currentCode = issueOtp(purposeKey);
  
  if (via === 'phone') {
    const sms = require('./lib/sms');
    await sms.sendSms(user.phone, `Your FastNet admin change code is ${currentCode}.`);
  } else if (via === 'email') {
    const emailHelper = require('./lib/email');
    await emailHelper.sendEmail(user.email, 'FastNet Admin Change Code', `Your code is ${currentCode}.`, `Your code is ${currentCode}.`);
  }
  
  return res.json({ success: true });
});

app.post('/api/admin/customers/:id/phone-change/verify-current', async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body;
  const vC = verifyOtp('admin-phone-change-current:' + id, otp);
  if (!vC.ok) return res.status(400).json({ error: 'Invalid OTP' });
  
  const marker = getPhoneChangeMarker(id);
  marker.currentVerified = true;
  marker.currentExpires = Date.now() + 600000;
  
  return res.json({ success: true });
});

app.post('/api/admin/customers/:id/phone-change/send-new', async (req, res) => {
  const { id } = req.params;
  const { newPhone } = req.body;
  
  const marker = getPhoneChangeMarker(id);
  if (!marker.currentVerified || Date.now() > marker.currentExpires) {
    return res.status(400).json({ error: 'Current step not verified' });
  }
  
  if (!newPhone || !newPhone.trim()) return res.status(400).json({ error: 'New phone is required' });
  const validPhone = checkPhone(newPhone, res);
  if (!validPhone) return;
  const cleanPhone = validPhone;

  const users = await db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  
  if (cleanPhone === user.phone) return res.status(400).json({ error: 'Phone already registered' });
  const exists = users.find(u => u.phone === cleanPhone);
  if (exists) return res.status(400).json({ error: 'Phone already registered' });
  
  if (checkSendRateLimit(sendNewRateLimits, id, res)) return;

  const purposeKey = 'admin-phone-change-new:' + id;
  const newCode = issueOtp(purposeKey);
  
  const sms = require('./lib/sms');
  await sms.sendSms(cleanPhone, `Your FastNet admin change code is ${newCode}.`);
  
  return res.json({ success: true });
});

app.post('/api/admin/customers/:id/phone-change/verify-new', async (req, res) => {
  const { id } = req.params;
  const { otp, newPhone } = req.body;
  
  if (!newPhone || !newPhone.trim()) return res.status(400).json({ error: 'New phone is required' });
  const validPhone = checkPhone(newPhone, res);
  if (!validPhone) return;
  const cleanPhone = validPhone;

  const vN = verifyOtp('admin-phone-change-new:' + id, otp);
  if (!vN.ok) return res.status(400).json({ error: 'Invalid OTP' });
  
  const marker = getPhoneChangeMarker(id);
  marker.newVerified = true;
  marker.newPhone = cleanPhone;
  marker.newExpires = Date.now() + 600000;
  
  return res.json({ success: true });
});

app.post('/api/admin/customers/:id/phone-change', async (req, res) => {
  const { id } = req.params;
  const { newPhone } = req.body;
  
  const users = await db.getTable('users');
  const user = users.find(u => u.id === id && u.role === 'CUSTOMER');
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  
  if (!newPhone || !newPhone.trim()) return res.status(400).json({ error: 'New phone is required' });
  const validPhone = checkPhone(newPhone, res);
  if (!validPhone) return;
  const cleanPhone = validPhone;

  const marker = getPhoneChangeMarker(id);
  if (!marker.currentVerified || Date.now() > marker.currentExpires) {
    return res.status(400).json({ error: 'Current step not verified' });
  }
  if (!marker.newVerified || Date.now() > marker.newExpires || marker.newPhone !== cleanPhone) {
    return res.status(400).json({ error: 'New step not verified for this number' });
  }

  if (cleanPhone === user.phone) return res.status(400).json({ error: 'Phone already registered' });
  const exists = users.find(u => u.phone === cleanPhone);
  if (exists) return res.status(400).json({ error: 'Phone already registered' });
  
  const oldPhone = user.phone;
  user.phone = cleanPhone;
  await db.saveTable('users', users);
  
  const auditDetails = { phone: user.phone, method: marker.currentMethod || 'unknown' };
  await appendAudit(req, 'CHANGE_PHONE', 'customer', id, { phone: oldPhone }, auditDetails);
  
  phoneChangeMarkers.delete(id);
  sendCurrentRateLimits.delete(id);
  sendNewRateLimits.delete(id);
  
  return res.json({ success: true, user: sanitizeUser(user) });
});
