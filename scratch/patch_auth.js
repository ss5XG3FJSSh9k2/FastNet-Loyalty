const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const oldUseEffect = `  useEffect(() => {
    const raw = (() => { try { return localStorage.getItem('currentUser'); } catch { return null; } })();
    const token = (() => { try { return localStorage.getItem('token'); } catch { return null; } })();
    if (!raw || !token) return;

    try { 
      const parsed = JSON.parse(raw); 
      if (!parsed || !parsed.id || !parsed.role) throw new Error('invalid');
      setCurrentUser(parsed); 
    } catch { clearSession(); return; }

    fetch(\`\${API_BASE}/auth/me\`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        if (!d.user || !d.user.id || !d.user.role) throw new Error('invalid');
        persistSession(d.user, d.token);
      })
      .catch(() => clearSession());
  }, []);`;

const newUseEffect = `  const [isVerifyingSession, setIsVerifyingSession] = useState(() => {
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

// We also need to abort render if isVerifyingSession is true.
// Let's insert a check before `return (`
const returnStr = `  return (
    <div className="app-container">`;

const newReturnStr = `  if (isVerifyingSession) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div className="app-container">`;

if (code.includes(oldUseEffect)) {
    code = code.replace(oldUseEffect, newUseEffect);
    code = code.replace(returnStr, newReturnStr);
    fs.writeFileSync('frontend/src/App.jsx', code);
    console.log('Patched');
} else {
    const regex = /useEffect\(\(\) => \{[\s\S]*?fetch\(`\$\{API_BASE\}\/auth\/me`\)[\s\S]*?\.catch\(\(\) => clearSession\(\)\);\r?\n  \}, \[\]\);/;
    if (regex.test(code)) {
        code = code.replace(regex, newUseEffect);
        code = code.replace(returnStr, newReturnStr);
        fs.writeFileSync('frontend/src/App.jsx', code);
        console.log('Patched via regex');
    } else {
        console.error('Not found');
    }
}
