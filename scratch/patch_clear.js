const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const oldClearSession = `  const clearSession = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('adminTabLastSeen');
    } catch {}
    setCurrentUser(null);
  };`;

const newClearSession = `  const clearSession = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('adminTabLastSeen');
      localStorage.removeItem('fastnet_carts');
      localStorage.removeItem('fastnet_partner_session');
    } catch {}
    setCurrentUser(null);
  };`;

if (!code.includes(oldClearSession)) {
    console.error("oldClearSession not found");
} else {
    code = code.replace(oldClearSession, newClearSession);
    fs.writeFileSync('frontend/src/App.jsx', code);
    console.log("Patched clearSession");
}
