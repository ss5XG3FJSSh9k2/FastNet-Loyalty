const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const oldInit = `  const [customerCarts, setCustomerCarts] = useState(() => {
    try {
      const stored = localStorage.getItem('fastnet_carts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('fastnet_carts', JSON.stringify(customerCarts));
  }, [customerCarts]);`;

const newInit = `  const [customerCarts, setCustomerCarts] = useState(() => {
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

if (code.includes(oldInit)) {
  code = code.replace(oldInit, newInit);
  fs.writeFileSync('frontend/src/App.jsx', code);
  console.log('Patched');
} else {
  // Line endings might differ
  const regex = /const \[customerCarts, setCustomerCarts\] = useState\(\(\) => \{[\s\S]*?\}, \[customerCarts\]\);/;
  if (regex.test(code)) {
    code = code.replace(regex, newInit);
    fs.writeFileSync('frontend/src/App.jsx', code);
    console.log('Patched via regex');
  } else {
    console.error('Not found');
  }
}
