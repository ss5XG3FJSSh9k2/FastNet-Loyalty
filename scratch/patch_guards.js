const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../frontend/src/App.jsx');
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// 1. loadCustomerData
const loadCustomerDataOld = `      // 1. Load stockists in customer region
      const sRes = await fetch(\`\${API_BASE}/stockists?regionId=\${currentUser.region_id}\`);
      const sData = await sRes.json().catch(() => ({}));
      setCustomerStockists(sData);

      // 2. Load points balance
      const bRes = await fetch(\`\${API_BASE}/ledger/balance/\${currentUser.id}\`);
      const bData = await bRes.json().catch(() => ({}));
      setCustomerBalance(bData.balance);
      setCustomerHeldBalance(bData.held_balance || 0);

      // 3. Load ledger history
      const lRes = await fetch(\`\${API_BASE}/ledger/history/\${currentUser.id}\`);
      const lData = await lRes.json().catch(() => ({}));
      setCustomerLedger(lData);

      // 4. Load order history
      const oRes = await fetch(\`\${API_BASE}/orders?customerId=\${currentUser.id}\`);
      const oData = await oRes.json().catch(() => ({}));
      setCustomerOrders(oData);`;

const loadCustomerDataNew = `      // 1. Load stockists in customer region
      const sRes = await fetch(\`\${API_BASE}/stockists?regionId=\${currentUser.region_id}\`);
      const sData = await sRes.json().catch(() => ({}));
      if (sRes.ok && Array.isArray(sData)) setCustomerStockists(sData);

      // 2. Load points balance
      const bRes = await fetch(\`\${API_BASE}/ledger/balance/\${currentUser.id}\`);
      const bData = await bRes.json().catch(() => ({}));
      if (bRes.ok) {
        setCustomerBalance(bData.balance || 0);
        setCustomerHeldBalance(bData.held_balance || 0);
      }

      // 3. Load ledger history
      const lRes = await fetch(\`\${API_BASE}/ledger/history/\${currentUser.id}\`);
      const lData = await lRes.json().catch(() => ({}));
      if (lRes.ok && Array.isArray(lData)) setCustomerLedger(lData);

      // 4. Load order history
      const oRes = await fetch(\`\${API_BASE}/orders?customerId=\${currentUser.id}\`);
      const oData = await oRes.json().catch(() => ({}));
      if (oRes.ok && Array.isArray(oData)) setCustomerOrders(oData);`;

if (content.includes(loadCustomerDataOld)) {
  content = content.replace(loadCustomerDataOld, loadCustomerDataNew);
  console.log("Replaced loadCustomerData");
} else {
  console.log("Could not find loadCustomerDataOld");
}

// 2. loadStockistData
const loadStockistDataOld = `      // 2. Load stockist orders
      const oRes = await fetch(\`\${API_BASE}/orders?stockistId=\${pData.id}\`);
      const oData = await oRes.json().catch(() => ({}));
      setStockistOrders(oData);

      // 3. Load stockist inventory products
      const prRes = await fetch(\`\${API_BASE}/products?stockistId=\${pData.id}\`);
      const prData = await prRes.json().catch(() => ({}));
      setStockistProducts(prData);`;

const loadStockistDataNew = `      // 2. Load stockist orders
      const oRes = await fetch(\`\${API_BASE}/orders?stockistId=\${pData.id}\`);
      const oData = await oRes.json().catch(() => ({}));
      if (oRes.ok && Array.isArray(oData)) setStockistOrders(oData);

      // 3. Load stockist inventory products
      const prRes = await fetch(\`\${API_BASE}/products?stockistId=\${pData.id}\`);
      const prData = await prRes.json().catch(() => ({}));
      if (prRes.ok && Array.isArray(prData)) setStockistProducts(prData);`;

if (content.includes(loadStockistDataOld)) {
  content = content.replace(loadStockistDataOld, loadStockistDataNew);
  console.log("Replaced loadStockistData");
} else {
  console.log("Could not find loadStockistDataOld");
}

// 3. poll interval stockist orders
const pollStockistOrdersOld = `        const oRes = await fetch(\`\${API_BASE}/orders?stockistId=\${stockistProfile.id}\`, {
          headers: { 'X-User-Id': currentUser.id }
        });
        const oData = await oRes.json();
        setStockistOrders(oData);

        // Only orders that are actionable count as "new" for the bell.
        // An order is newly-actionable when it is PENDING and we haven't already alerted on it.
        const actionable = oData.filter(o => o.status === 'PENDING');`;

const pollStockistOrdersNew = `        const oRes = await fetch(\`\${API_BASE}/orders?stockistId=\${stockistProfile.id}\`, {
          headers: { 'X-User-Id': currentUser.id }
        });
        const oData = await oRes.json();
        if (oRes.ok && Array.isArray(oData)) {
          setStockistOrders(oData);
        } else {
          return; // Skip polling logic if fetch failed
        }

        // Only orders that are actionable count as "new" for the bell.
        // An order is newly-actionable when it is PENDING and we haven't already alerted on it.
        const actionable = oData.filter(o => o.status === 'PENDING');`;

if (content.includes(pollStockistOrdersOld)) {
  content = content.replace(pollStockistOrdersOld, pollStockistOrdersNew);
  console.log("Replaced pollStockistOrders");
} else {
  console.log("Could not find pollStockistOrdersOld");
}

fs.writeFileSync(file, content, 'utf8');
