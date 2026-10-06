const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Patch clearSession
const oldClearSession = /const clearSession = \(\) => \{[\s\S]*?setCurrentUser\(null\);\r?\n  \};/;
const newClearSession = `const clearSession = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('adminTabLastSeen');
      localStorage.removeItem('fastnet_carts');
      localStorage.removeItem('fastnet_partner_session');
    } catch {}
    setCurrentUser(null);
  };`;
code = code.replace(oldClearSession, newClearSession);

// 2. Patch customerCarts
const oldInit = /const \[customerCarts, setCustomerCarts\] = useState\(\(\) => \{[\s\S]*?\}, \[customerCarts\]\);/;
const newInit = `const [customerCarts, setCustomerCarts] = useState(() => {
    try {
      const stored = localStorage.getItem('fastnet_carts');
      if (!stored) return {};
      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return {};
      
      const rawUser = localStorage.getItem('currentUser');
      const userId = rawUser ? JSON.parse(rawUser)?.id : null;

      if ('userId' in parsed) {
         if (parsed.userId === userId && parsed.carts && typeof parsed.carts === 'object') {
           return parsed.carts;
         }
         return {};
      } else {
         return {};
      }
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('fastnet_carts', JSON.stringify({ userId: currentUser?.id, carts: customerCarts }));
  }, [customerCarts, currentUser?.id]);`;
code = code.replace(oldInit, newInit);

// 3. Patch auth/me useEffect
const oldUseEffect = /useEffect\(\(\) => \{[\s\S]*?fetch\(`\$\{API_BASE\}\/auth\/me`\)[\s\S]*?\.catch\(\(\) => clearSession\(\)\);\r?\n  \}, \[\]\);/;
const newUseEffect = `const [isVerifyingSession, setIsVerifyingSession] = useState(() => {
    try { return !!localStorage.getItem('token') && !!localStorage.getItem('currentUser'); }
    catch { return false; }
  });

  useEffect(() => {
    const raw = (() => { try { return localStorage.getItem('currentUser'); } catch { return null; } })();
    const token = (() => { try { return localStorage.getItem('token'); } catch { return null; } })();
    if (!raw || !token) {
      setIsVerifyingSession(false);
      return;
    }

    try { 
      const parsed = JSON.parse(raw); 
      if (!parsed || !parsed.id || !parsed.role) throw new Error('invalid');
      setCurrentUser(parsed); 
    } catch { 
      clearSession(); 
      setIsVerifyingSession(false);
      return; 
    }

    fetch(\`\${API_BASE}/auth/me\`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        if (!d.user || !d.user.id || !d.user.role) throw new Error('invalid');
        persistSession(d.user, d.token);
      })
      .catch(() => clearSession())
      .finally(() => setIsVerifyingSession(false));
  }, []);`;
code = code.replace(oldUseEffect, newUseEffect);

// 4. Patch main render return
// Find the `return (\n    <div className="app-container">` which is the main render of App
const oldReturn = `  return (
    <div className="app-container">`;
const newReturn = `  if (isVerifyingSession) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div className="app-container">`;

code = code.replace(oldReturn, newReturn);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Patched App.jsx properly');
