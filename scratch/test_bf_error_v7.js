const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Seeding localStorage with fake customer...');
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    localStorage.setItem('currentUser', JSON.stringify({
      id: 'u-fakeuser123',
      role: 'CUSTOMER',
      name: 'Fake User',
      phone: '9999999990'
    }));
    localStorage.setItem('token', 'fake-token-1234');
    localStorage.setItem('fastnet_carts', JSON.stringify({
      userId: 'u-fakeuser123',
      carts: {
        'stk-123': {
          items: [
            { id: 'p-1', name: 'Fake Item', qty: 2, price: 10 }
          ]
        }
      }
    }));
  });

  console.log('Reloading page...');
  await page.reload();
  await page.waitForTimeout(2000);

  const viewText = await page.textContent('body');
  
  if (viewText.includes('FastNet App Crashed')) {
     console.error('FAIL: App crashed on stale state!');
     process.exit(1);
  } else {
     console.log('PASS: App did not crash. Showed view:', viewText.substring(0, 100).replace(/\n/g, ' '));
  }

  // Check carts
  const cartsVal = await page.evaluate(() => localStorage.getItem('fastnet_carts'));
  console.log('Final carts in localStorage:', cartsVal);
  if (cartsVal && cartsVal.includes('u-fakeuser123')) {
     console.error('FAIL: Stale cart data was not cleared!');
     process.exit(1);
  } else {
     console.log('PASS: Stale cart data was successfully cleared.');
  }

  await browser.close();
  console.log('All tests passed!');
})();
