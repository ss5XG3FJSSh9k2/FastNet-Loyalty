const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

const target1 = `  const isAdmin = req.user && req.user.role === 'ADMIN';
  if (!isAdmin && order.user_id !== req.user.userId && order.stockist_id !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized for this order' });
  }`;
const repl1 = `  const isAdmin = req.user && req.user.role === 'ADMIN';
  const callerStockist = await getCallerStockist(req);
  if (!isAdmin && (!callerStockist || order.stockist_id !== callerStockist.id)) {
    return res.status(403).json({ error: 'Not authorized for this order' });
  }`;

const target2 = `        return res.status(400).json({
          error: 'Direct transition blocked. PIN verification required for handoff completion.',
          code: 'PIN_REQUIRED'
        });
      }
    }
  }`;
const repl2 = `        return res.status(400).json({
          error: 'Direct transition blocked. PIN verification required for handoff completion.',
          code: 'PIN_REQUIRED'
        });
      }
    }
  } else if ((status === 'DELIVERED' || status === 'PICKED_UP') && isAdmin) {
    if (order.fulfillment_type === 'PICKUP' || order.fulfillment_type === 'DELIVERY') {
      await appendAudit(req, 'ADMIN_MANUAL_DELIVERY_OVERRIDE', 'orders', id, null, { note: \`Admin overridden PIN for \${status}\` });
    }
  }`;

code = code.replace(target1, repl1);
code = code.replace(target2, repl2);

fs.writeFileSync('backend/server.js', code);
console.log('Done');
