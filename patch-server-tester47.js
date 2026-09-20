const fs = require('fs');

let serverContent = fs.readFileSync('backend/server.js', 'utf8');

// 1. Update calculateIsShopOpen
const oldCalculateShopOpen = `function calculateIsShopOpen(stockist, currentTimeStr) {
  if (!stockist.opening_time || !stockist.closing_time) return true;
  let closing = stockist.closing_time;
  if (closing === '24:00') closing = '23:59';
  const opening = stockist.opening_time;

  let currentTime = currentTimeStr;
  if (!currentTime) {
    const now = new Date();
    currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                  now.getMinutes().toString().padStart(2, '0');
  }

  if (closing <= opening) {
    return currentTime >= opening || currentTime < closing;
  }
  return currentTime >= opening && currentTime < closing;
}`;

const newCalculateShopOpen = `function calculateIsShopOpen(stockist, currentTimeStr) {
  if (stockist.manual_closed) {
    if (!stockist.closed_until || new Date() < new Date(stockist.closed_until)) {
      return false; // Manually closed and either indefinitely or until a future time
    }
  }

  if (!stockist.opening_time || !stockist.closing_time) return true;
  let closing = stockist.closing_time;
  if (closing === '24:00') closing = '23:59';
  const opening = stockist.opening_time;

  let currentTime = currentTimeStr;
  if (!currentTime) {
    const now = new Date();
    currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                  now.getMinutes().toString().padStart(2, '0');
  }

  if (closing <= opening) {
    return currentTime >= opening || currentTime < closing;
  }
  return currentTime >= opening && currentTime < closing;
}`;

serverContent = serverContent.replace(oldCalculateShopOpen, newCalculateShopOpen);

// 2. Add PATCH /api/stockist/profile endpoint
const patchEndpoint = `
// PATCH /api/stockist/profile - Stockist self-editable settings (TESTER-47)
app.patch('/api/stockist/profile', async (req, res) => {
  const stockistId = req.headers['x-user-id'];
  if (!stockistId) return res.status(403).json({ error: 'Unauthorized' });
  // Check if they are trying to patch a specific ID that isn't theirs
  if (req.body.id && req.body.id !== stockistId) {
    return res.status(403).json({ error: 'Forbidden: Cannot edit another stockist profile' });
  }
  if (req.body.stockist_id && req.body.stockist_id !== stockistId) {
    return res.status(403).json({ error: 'Forbidden: Cannot edit another stockist profile' });
  }

  const stockists = await db.getTable('stockists');
  const stockist = stockists.find(s => s.id === stockistId || s.user_id === stockistId);
  if (!stockist) return res.status(404).json({ error: 'Stockist not found' });

  const payload = req.body;

  // Reject locked fields
  const lockedFields = ['region_id', 'vendor_id', 'commission_rate', 'min_order_value'];
  for (const field of lockedFields) {
    if (payload[field] !== undefined && payload[field] !== stockist[field]) {
      return res.status(400).json({ error: \`Cannot edit locked field: \${field}\` });
    }
  }

  // Validate delivery radius
  if (payload.delivery_radius_km !== undefined) {
    const maxRadius = stockist.max_delivery_radius_km !== undefined ? parseFloat(stockist.max_delivery_radius_km) : 5.0;
    if (parseFloat(payload.delivery_radius_km) > maxRadius) {
      return res.status(400).json({ error: \`Delivery radius cannot exceed \${maxRadius}km\` });
    }
    stockist.delivery_radius_km = parseFloat(payload.delivery_radius_km);
  }

  // Validate prep time
  if (payload.prep_eta_minutes !== undefined) {
    const prep = parseInt(payload.prep_eta_minutes, 10);
    if (prep < 5 || prep > 120) {
      return res.status(400).json({ error: 'Preparation time must be between 5 and 120 minutes' });
    }
    stockist.prep_eta_minutes = prep;
  }

  // Validate times
  if (payload.opening_time !== undefined) {
    if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(payload.opening_time)) {
      return res.status(400).json({ error: 'Invalid opening time' });
    }
    stockist.opening_time = payload.opening_time;
  }
  if (payload.closing_time !== undefined) {
    if (payload.closing_time === '24:00' || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(payload.closing_time)) {
      return res.status(400).json({ error: 'Invalid closing time (24:00 is not allowed)' });
    }
    stockist.closing_time = payload.closing_time;
  }

  // Validate payout fields
  if (payload.payout_upi_id !== undefined) {
    if (payload.payout_upi_id && !/^[\\w.-]+@[\\w.-]+$/.test(payload.payout_upi_id)) {
      return res.status(400).json({ error: 'Malformed UPI ID' });
    }
    stockist.payout_upi_id = payload.payout_upi_id;
  }
  if (payload.payout_ifsc !== undefined) {
    if (payload.payout_ifsc && !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(payload.payout_ifsc)) {
      return res.status(400).json({ error: 'Malformed IFSC code' });
    }
    stockist.payout_ifsc = payload.payout_ifsc;
  }
  if (payload.payout_bank_account !== undefined) stockist.payout_bank_account = payload.payout_bank_account;
  if (payload.payout_account_name !== undefined) stockist.payout_account_name = payload.payout_account_name;
  if (payload.contact_phone !== undefined) stockist.contact_phone = payload.contact_phone;

  // Handle Manual Closed
  if (payload.manual_closed !== undefined) {
    stockist.manual_closed = payload.manual_closed;
    stockist.closed_reason = payload.closed_reason || null;
    
    if (payload.manual_closed) {
      if (payload.closed_until) {
        stockist.closed_until = payload.closed_until;
      } else {
        // Compute next opening time if closed_until is empty
        const now = new Date();
        const opening = stockist.opening_time || '09:00';
        const [h, m] = opening.split(':').map(Number);
        
        const nextOpen = new Date(now);
        nextOpen.setHours(h, m, 0, 0);
        
        if (nextOpen <= now) {
          nextOpen.setDate(nextOpen.getDate() + 1);
        }
        stockist.closed_until = nextOpen.toISOString();
      }
    } else {
      stockist.closed_until = null;
    }
  }

  await db.saveTable('stockists', stockists);
  
  // Audit log
  const auditLogs = await db.getTable('audit_logs');
  auditLogs.push({
    id: 'aud-' + Math.random().toString(36).substring(2, 9),
    action: 'STOCKIST_PROFILE_UPDATE',
    actor_id: stockistId,
    target_id: stockist.id,
    target_type: 'STOCKIST',
    details: 'Stockist updated their profile settings',
    created_at: new Date().toISOString()
  });
  await db.saveTable('audit_logs', auditLogs);

  res.json({ success: true, stockist });
});
`;

serverContent = serverContent.replace("app.get('/api/stockists', async (req, res) => {", patchEndpoint + "\napp.get('/api/stockists', async (req, res) => {");

fs.writeFileSync('backend/server.js', serverContent, 'utf8');
console.log('server.js patched!');
