const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(/const clearSession = \(\) => \{[\s\S]*?setCurrentUser\(null\);\r?\n  \};/, `const clearSession = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('adminTabLastSeen');
      localStorage.removeItem('fastnet_carts');
      localStorage.removeItem('fastnet_partner_session');
    } catch {}
    setCurrentUser(null);
  };`);
fs.writeFileSync('frontend/src/App.jsx', code);
