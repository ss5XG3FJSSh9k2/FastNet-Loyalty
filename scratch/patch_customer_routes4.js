const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8').replace(/\r\n/g, '\n');

function authRoute(method, path, argLineRegex, insertAssertStr) {
  const def = `app.${method}('${path}', `;
  const idx = code.indexOf(def);
  if (idx === -1) {
    // maybe it has an array of paths?
    const defArr = `app.${method}(['${path}'`;
    if (code.indexOf(defArr) === -1 && code.indexOf(path) === -1) {
      console.log('NOT FOUND route:', def);
      return;
    }
  }

  // Insert requireAuth if missing
  const routeIdx = code.indexOf(path) - 2; // Before the quote
  const fullDefLineStart = code.lastIndexOf('\n', routeIdx);
  const fullDefLineEnd = code.indexOf('\n', routeIdx);
  let line = code.substring(fullDefLineStart + 1, fullDefLineEnd);
  
  if (!line.includes('requireAuth')) {
    line = line.replace(/async\s*\(req,\s*res\)/, 'requireAuth, async (req, res)');
    code = code.substring(0, fullDefLineStart + 1) + line + code.substring(fullDefLineEnd);
  }

  if (!insertAssertStr) return;

  // Insert assert
  const re = new RegExp(`app\\.${method}\\([^\\)]*?${path}[^\\{]+\\{\\n([^\\n]*\\n)?([^\\n]*?${argLineRegex}[^\\n]*)`);
  const match = code.match(re);
  if (match) {
    const fullMatch = match[0];
    if (fullMatch.includes('assertSelfOrAdmin')) return; // already injected
    code = code.replace(fullMatch, fullMatch + '\n  ' + insertAssertStr);
    console.log('INJECTED:', path);
  } else {
    // try slightly different format
    const re2 = new RegExp(`app\\.${method}\\([^\\)]*?${path.replace(/\//g, '\\/')}[\\s\\S]{1,100}?${argLineRegex}.*`);
    const match2 = code.match(re2);
    if(match2) {
      const split = code.split(match2[0]);
      code = split[0] + match2[0] + '\n  ' + insertAssertStr + split[1];
      console.log('INJECTED:', path);
    } else {
      console.log('NOT FOUND regex match for:', path);
    }
  }
}

// 1. Customer-scoped routes
authRoute('get', '/api/ledger/balance/:customerId', 'customerId', 'if (!assertSelfOrAdmin(req, res, customerId)) return;');
authRoute('get', '/api/ledger/history/:customerId', 'customerId', 'if (!assertSelfOrAdmin(req, res, customerId)) return;');
authRoute('post', '/api/ledger/redeem', 'customerId', 'if (!assertSelfOrAdmin(req, res, customerId)) return;');
authRoute('get', '/api/customer/rewards/available/:customerUserId', 'customerUserId', 'if (!assertSelfOrAdmin(req, res, customerUserId)) return;');
authRoute('get', '/api/customer/available-rewards', 'customer', ''); // handled by the array route above
authRoute('get', '/api/customer/:id/profile', 'id', 'if (!assertSelfOrAdmin(req, res, id)) return;');
authRoute('post', '/api/customer/:id/profile', 'id', 'if (!assertSelfOrAdmin(req, res, id)) return;');
authRoute('get', '/api/customer/partner-bindings/:customer_user_id', 'customer_user_id', 'if (customer_user_id && !assertSelfOrAdmin(req, res, customer_user_id)) return;');
authRoute('get', '/api/customer/partner-bindings/:customer_user_id/available', 'customer_user_id', 'if (!assertSelfOrAdmin(req, res, customer_user_id)) return;');
authRoute('post', '/api/customer/partner-bindings', 'customer_user_id', 'if (!assertSelfOrAdmin(req, res, customer_user_id)) return;');
authRoute('get', '/api/customer/redemptions/:customerUserId', 'customerUserId', 'if (!assertSelfOrAdmin(req, res, customerUserId)) return;');
authRoute('post', '/api/customer/phone-change/request', 'user_id', 'if (!assertSelfOrAdmin(req, res, user_id)) return;');
authRoute('post', '/api/customer/phone-change/verify', 'user_id', 'if (!assertSelfOrAdmin(req, res, user_id)) return;');
authRoute('post', '/api/customer/region-change', 'user_id', 'if (!assertSelfOrAdmin(req, res, user_id)) return;');
authRoute('post', '/api/customer/fraud-reports', 'customerId', 'if (!assertSelfOrAdmin(req, res, customerId)) return;');

// feedback route doesn't exist? Wait, /api/feedback
const feedbackIdx = code.indexOf("app.post('/api/feedback'");
if (feedbackIdx !== -1) {
  authRoute('post', '/api/feedback', 'reporterId', 'if (!assertSelfOrAdmin(req, res, reporterId)) return;');
}

fs.writeFileSync('backend/server.js', code);
