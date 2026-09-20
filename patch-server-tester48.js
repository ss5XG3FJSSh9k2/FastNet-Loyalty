const fs = require('fs');
let serverContent = fs.readFileSync('backend/server.js', 'utf8');

// 1. Setup web-push
const webPushRequire = `const webpush = require('web-push');

let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  const vapidKeys = webpush.generateVAPIDKeys();
  VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  VAPID_PRIVATE_KEY = vapidKeys.privateKey;
  console.log('Generated ephemeral VAPID keys for local testing');
}
webpush.setVapidDetails(
  'mailto:support@fastnet.example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);
`;
serverContent = serverContent.replace("const express = require('express');", "const express = require('express');\n" + webPushRequire);

// 2. Add endpoints: GET /api/config/vapid, POST /api/stockist/push-subscription, PATCH /api/orders/:id/acknowledge
const endpointsStr = `
// Web Push VAPID Key
app.get('/api/config/vapid', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// Save Push Subscription
app.post('/api/stockist/push-subscription', async (req, res) => {
  const stockistId = req.headers['x-user-id'];
  if (!stockistId) return res.status(403).json({ error: 'Unauthorized' });
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  
  const subscriptions = await db.getTable('stockist_push_subscriptions');
  const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
  
  const subRecord = {
    id: existingIndex >= 0 ? subscriptions[existingIndex].id : 'sub-' + generateId(),
    stockist_id: stockistId,
    endpoint: subscription.endpoint,
    keys_p256dh: subscription.keys.p256dh,
    keys_auth: subscription.keys.auth,
    created_at: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    subscriptions[existingIndex] = subRecord;
  } else {
    subscriptions.push(subRecord);
  }
  await db.saveTable('stockist_push_subscriptions', subscriptions);
  res.json({ success: true });
});

// Acknowledge Order
app.patch('/api/orders/:id/acknowledge', async (req, res) => {
  const stockistId = req.headers['x-user-id'];
  if (!stockistId) return res.status(403).json({ error: 'Unauthorized' });
  
  const orders = await db.getTable('orders');
  const order = orders.find(o => o.id === req.params.id);
  if (!order || order.stockist_id !== stockistId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (!order.acknowledged_at) {
    order.acknowledged_at = new Date().toISOString();
    await db.saveTable('orders', orders);
  }
  res.json({ success: true, order });
});
`;
serverContent = serverContent.replace("app.get('/api/orders', async (req, res) => {", endpointsStr + "\napp.get('/api/orders', async (req, res) => {");

// 3. Trigger web push in handleCreateOrderRoute
const triggerPushStr = `
  const savedOrder = { ...newOrder, items: req.body.items };

  // Trigger web push asynchronously
  setImmediate(async () => {
    try {
      const subscriptions = await db.getTable('stockist_push_subscriptions');
      const stockistSubs = subscriptions.filter(s => s.stockist_id === stockistId);
      
      const payload = JSON.stringify({
        title: 'New FastNet Order',
        body: \`Order \${orderId.substring(2).toUpperCase()} received! Amount: ₹\${parsedTotal}\`,
        url: '/stockist'
      });
      
      for (const sub of stockistSubs) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys_p256dh,
            auth: sub.keys_auth
          }
        };
        try {
          await webpush.sendNotification(pushSubscription, payload);
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription has expired or is no longer valid, prune it
            const currentSubs = await db.getTable('stockist_push_subscriptions');
            const filteredSubs = currentSubs.filter(s => s.id !== sub.id);
            await db.saveTable('stockist_push_subscriptions', filteredSubs);
          }
        }
      }
    } catch(err) {
      console.error('Error sending web push:', err);
    }
  });

  return res.json({ success: true, orderId, order: savedOrder });
`;
const oldOrderResponse = `return res.json({ success: true, orderId, order: { ...newOrder, items: req.body.items } });`;
serverContent = serverContent.replace(oldOrderResponse, triggerPushStr);


// 4. Layer 3 stub (SMS escalation loop)
const layer3Stub = `
// TESTER-48: Layer 3 SMS Escalation (Stub)
setInterval(async () => {
  try {
    const orders = await db.getTable('orders');
    const stockists = await db.getTable('stockists');
    const users = await db.getTable('users');
    const now = new Date();
    
    // 5 minutes timeout
    const TIMEOUT_MS = 5 * 60 * 1000;
    
    for (const order of orders) {
      if (!order.acknowledged_at && (order.status === 'CONFIRMING' || order.status === 'PREPARING')) {
        const createdMs = new Date(order.created_at).getTime();
        if (now.getTime() - createdMs > TIMEOUT_MS) {
          // Check if we already sent SMS (prevent spam)
          // We'll use a hidden property for pg-mem or just rely on a new field.
          // Since we can't alter schema here without migration, let's assume we log it and mark it escalated.
          if (!order.sms_escalated) {
            order.sms_escalated = true;
            await db.saveTable('orders', orders);
            
            const stockist = stockists.find(s => s.id === order.stockist_id);
            if (stockist) {
              const stockistUser = users.find(u => u.id === stockist.user_id);
              const phone = stockist.phone || stockist.contact_phone || (stockistUser ? stockistUser.phone : null);
              if (phone) {
                await smsHelper.sendSms(phone, \`FastNet: new order #\${order.id.substring(2).toUpperCase()} at your shop. Open the app to accept.\`);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    // silently fail in background
  }
}, 60000); // Check every minute
`;

serverContent = serverContent + '\n' + layer3Stub;

fs.writeFileSync('backend/server.js', serverContent, 'utf8');
console.log('server.js patched successfully for TESTER-48');
