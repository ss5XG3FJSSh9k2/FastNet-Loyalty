const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(
  "onClick={() => { setAdminTab('redemptions'); fetchRedemptionApprovals(); }}",
  "onClick={() => goToAdminTab('redemptions', fetchRedemptionApprovals)}"
);

code = code.replaceAll(
  "onClick={() => { setAdminTab('analytics'); fetchAnalytics(); }}",
  "onClick={() => goToAdminTab('analytics', fetchAnalytics)}"
);

// The 'transactions' in the summary cards was already handled if it matched exactly what I had before, 
// but my previous script only did `code.replace` which does it once. Let's do replaceAll.
code = code.replaceAll(
  "onClick={() => setAdminTab('transactions')}",
  "onClick={() => goToAdminTab('transactions')}"
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Summary cards updated');
