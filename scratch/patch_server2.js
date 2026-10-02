const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

code = code.replace(
  /const isAdmin = req\.user && req\.user\.role === 'ADMIN';\s*if \(!isAdmin && order\.user_id !== req\.user\.userId && order\.stockist_id !== req\.user\.userId\) \{\s*return res\.status\(403\)\.json\(\{ error: 'Not authorized for this order' \}\);\s*\}/,
  `const isAdmin = req.user && req.user.role === 'ADMIN';\n  const callerStockist = await getCallerStockist(req);\n  if (!isAdmin && (!callerStockist || order.stockist_id !== callerStockist.id)) {\n    return res.status(403).json({ error: 'Not authorized for this order' });\n  }`
);

code = code.replace(
  /if \(!pin\) \{\s*return res\.status\(400\)\.json\(\{\s*error: 'Direct transition blocked\. PIN verification required for handoff completion\.',\s*code: 'PIN_REQUIRED'\s*\}\);\s*\}\s*\}\s*\}/,
  `if (!pin) {\n        return res.status(400).json({\n          error: 'Direct transition blocked. PIN verification required for handoff completion.',\n          code: 'PIN_REQUIRED'\n        });\n      }\n    }\n  } else if ((status === 'DELIVERED' || status === 'PICKED_UP') && isAdmin) {\n    if (order.fulfillment_type === 'PICKUP' || order.fulfillment_type === 'DELIVERY') {\n      await appendAudit(req, 'ADMIN_MANUAL_DELIVERY_OVERRIDE', 'orders', id, null, { note: \`Admin overridden PIN for \${status}\` });\n    }\n  }`
);

fs.writeFileSync('backend/server.js', code);
console.log('Done');
