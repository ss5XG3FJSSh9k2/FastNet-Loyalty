const fs = require('fs');

let appContent = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// 1. Add Layer 1 state and helpers
const stateRegex = /const \[stockistOrders, setStockistOrders\] = useState\(\[\]\);/s;
const layer1State = `const [stockistOrders, setStockistOrders] = useState([]);
  const [unacknowledgedOrders, setUnacknowledgedOrders] = useState([]);
  const knownOrderIds = useRef(new Set());
  const isFirstOrderLoad = useRef(true);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch(e) {}
  };

  useEffect(() => {
    if (unacknowledgedOrders.length > 0) {
      document.title = \`(\${unacknowledgedOrders.length}) FastNet — Stockist\`;
    } else {
      document.title = 'FastNet';
    }
    return () => { document.title = 'FastNet'; };
  }, [unacknowledgedOrders.length]);

  useEffect(() => {
    if (activeRole !== 'stockist' || !currentUser || currentUser.role !== 'STOCKIST') return;
    
    const poll = setInterval(async () => {
      if (offlineMode) return;
      if (!stockistProfile) return;
      try {
        const oRes = await fetch(\`\${API_BASE}/orders?stockistId=\${stockistProfile.id}\`);
        if (!oRes.ok) return;
        const oData = await oRes.json();
        
        if (isFirstOrderLoad.current) {
          oData.forEach(o => knownOrderIds.current.add(o.id));
          isFirstOrderLoad.current = false;
          // Ensure we don't overwrite if they are actively fetching
          return;
        }
        
        const incoming = oData.filter(o => !knownOrderIds.current.has(o.id));
        if (incoming.length > 0) {
          incoming.forEach(o => knownOrderIds.current.add(o.id));
          setStockistOrders(oData);
          setUnacknowledgedOrders(prev => [...prev, ...incoming]);
          playChime();
        }
      } catch(e) {}
    }, 15000);
    return () => clearInterval(poll);
  }, [activeRole, currentUser, stockistProfile, offlineMode]);

  const handleAcknowledgeOrders = async () => {
    for (const o of unacknowledgedOrders) {
      try {
        await fetch(\`\${API_BASE}/orders/\${o.id}/acknowledge\`, {
          method: 'PATCH',
          headers: { 'X-User-Id': currentUser.id }
        });
      } catch(e) {}
    }
    setUnacknowledgedOrders([]);
  };
`;
appContent = appContent.replace(stateRegex, layer1State);


// Fix loadStockistData to seed knownOrderIds if missing
const loadStockistDataRegex = /const oData = await oRes\.json\(\)\.catch\(\(\) => \(\{\}\)\);\n\s*setStockistOrders\(oData\);/s;
const newLoadStockistData = `const oData = await oRes.json().catch(() => ({}));
      if (isFirstOrderLoad.current && Array.isArray(oData)) {
        oData.forEach(o => knownOrderIds.current.add(o.id));
        isFirstOrderLoad.current = false;
      }
      setStockistOrders(oData);`;
appContent = appContent.replace(loadStockistDataRegex, newLoadStockistData);


// 2. Add Persistent Banner in Orders Tab
const ordersTabRegex = /\{stockistActiveTab === 'orders' && \(\n\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '1rem' \}\}>/s;
const ordersBanner = `{stockistActiveTab === 'orders' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '4rem' }}>
                      {unacknowledgedOrders.length > 0 && (
                        <div className="glass-card" style={{ background: 'rgba(255, 170, 0, 0.15)', border: '1px solid var(--warning-color)', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: 'var(--warning-color)' }}>{unacknowledgedOrders.length} new order{unacknowledgedOrders.length !== 1 ? 's' : ''}</strong>
                          <button className="btn btn-secondary btn-sm" onClick={handleAcknowledgeOrders}>Dismiss</button>
                        </div>
                      )}`;
appContent = appContent.replace(ordersTabRegex, ordersBanner);


// 3. Nav Badge for Orders
const navOrdersBtnRegex = /<button className=\{`phone-nav-btn \$\{stockistActiveTab === 'orders' \? 'active' : ''\}`\} onClick=\{\(\) => setStockistActiveTab\('orders'\)\}>\n\s*<ClipboardList size=\{18\} \/>\n\s*\{t\("Orders", "ऑर्डर", "অর্ডার"\)\}\n\s*<\/button>/s;
const navBadge = `<button className={\`phone-nav-btn \${stockistActiveTab === 'orders' ? 'active' : ''}\`} onClick={() => setStockistActiveTab('orders')} style={{ position: 'relative' }}>
                    {unacknowledgedOrders.length > 0 && (
                      <span className="badge badge-danger" style={{ position: 'absolute', top: '2px', right: '10px', fontSize: '0.55rem', padding: '0.1rem 0.3rem', borderRadius: '10px' }}>{unacknowledgedOrders.length}</span>
                    )}
                    <ClipboardList size={18} />
                    {t("Orders", "ऑर्डर", "অর্ডার")}
                  </button>`;
appContent = appContent.replace(navOrdersBtnRegex, navBadge);


// 4. Enable Push Alerts in Settings
const pushAlertsHelper = `
  const enablePushAlerts = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        showToast('Notification permission denied', 'error');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const vapidRes = await fetch(\`\${API_BASE}/config/vapid\`);
      const { publicKey } = await vapidRes.json();
      
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });
      
      const res = await fetch(\`\${API_BASE}/stockist/push-subscription\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
        body: JSON.stringify({ subscription })
      });
      if (res.ok) {
        showToast('Order alerts enabled on this device', 'success');
      } else {
        throw new Error('Failed to save subscription');
      }
    } catch (e) {
      showToast('Push alerts not supported or failed', 'error');
    }
  };
`;
const appBodyRegex = /const App = \(\) => \{/s;
appContent = appContent.replace(appBodyRegex, "const App = () => {\n" + pushAlertsHelper);


const appPrefsRegex = /<h4 style=\{\{ margin: 0, fontSize: '0\.9rem', color: 'white' \}\}>App Preferences<\/h4>/s;
const pushAlertsUI = `<h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>App Preferences</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order Alerts (Push)</span>
                          <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }} onClick={enablePushAlerts}>
                            Enable
                          </button>
                        </div>`;
appContent = appContent.replace(appPrefsRegex, pushAlertsUI);


fs.writeFileSync('frontend/src/App.jsx', appContent, 'utf8');
console.log('App.jsx patched successfully for TESTER-48');
