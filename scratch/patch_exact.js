const fs = require('fs');

const file = 'frontend/src/App.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

function replaceBlock(startStr, endStr, replacementStr) {
  const startIdx = lines.findIndex(l => l.includes(startStr));
  if (startIdx === -1) {
    console.error('Could not find', startStr);
    return;
  }
  let endIdx = startIdx;
  while (endIdx < lines.length && !lines[endIdx].includes(endStr)) {
    endIdx++;
  }
  if (endIdx === lines.length) {
    console.error('Could not find', endStr);
    return;
  }
  lines.splice(startIdx, endIdx - startIdx + 1, ...replacementStr.split('\n'));
  console.log('Replaced block from', startStr);
}

replaceBlock('const clearSession = () => {', 'setCurrentUser(null);', `  const clearSession = () => {
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('adminTabLastSeen');
      localStorage.removeItem('fastnet_carts');
      localStorage.removeItem('fastnet_partner_session');
    } catch {}
    setCurrentUser(null);`);

replaceBlock('const [customerCarts, setCustomerCarts] = useState(() => {', 'localStorage.setItem(\'fastnet_carts\', JSON.stringify(customerCarts));', `  const [customerCarts, setCustomerCarts] = useState(() => {
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
    localStorage.setItem('fastnet_carts', JSON.stringify({ userId: currentUser?.id, carts: customerCarts }));`);

replaceBlock('const raw = (() => { try { return localStorage.getItem(\'currentUser\'); } catch { return null; } })();', '.catch(() => clearSession());', `    const raw = (() => { try { return localStorage.getItem('currentUser'); } catch { return null; } })();
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
      .finally(() => setIsVerifyingSession(false));`);

// Also add isVerifyingSession definition
const roleInitIdx = lines.findIndex(l => l.includes("const [activeRole, setActiveRole] = useState('marketing');"));
lines.splice(roleInitIdx, 0, `  const [isVerifyingSession, setIsVerifyingSession] = useState(() => {
    try { return !!localStorage.getItem('token') && !!localStorage.getItem('currentUser'); }
    catch { return false; }
  });`);

// And replace the main return
const returnIdx = lines.findIndex(l => l.includes('<div className="app-container">'));
if (returnIdx !== -1) {
    // Check if it's the right one (around line 14000-15000)
    if (returnIdx > 14000) {
        lines.splice(returnIdx - 1, 0, `  if (isVerifyingSession) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }`);
        console.log('Replaced main return');
    }
}

fs.writeFileSync(file, lines.join('\n'));
