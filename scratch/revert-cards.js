const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(
  "onClick={() => goToAdminTab('redemptions', fetchRedemptionApprovals)}",
  "onClick={() => { setAdminTab('redemptions'); fetchRedemptionApprovals(); }}"
);

code = code.replaceAll(
  "onClick={() => goToAdminTab('analytics', fetchAnalytics)}",
  "onClick={() => { setAdminTab('analytics'); fetchAnalytics(); }}"
);

// Wait, the 4th summary card might have been 'transactions'. Let me restore it too just in case.
// Actually the prompt says "Top 3 Admin Summary Cards", but there are 4 now.
code = code.replace(
  `onClick={() => goToAdminTab('transactions')}
                  style={{ 
                    background: UNPAID > 0 ? 'rgba(245,158,11,0.08)'`,
  `onClick={() => setAdminTab('transactions')}
                  style={{ 
                    background: UNPAID > 0 ? 'rgba(245,158,11,0.08)'`
);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Reverted summary cards');
