const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Reset database
  console.log('Resetting database...');
  await page.goto('http://localhost:5173');
  await page.evaluate(() => {
    return fetch('http://localhost:3001/api/admin/debug/reset', { method: 'POST' });
  });
  await page.waitForTimeout(1000);

  console.log('Seeding localStorage...');
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

  // If it's on setup screen, create an admin account.
  const text = await page.textContent('body');
  if (text.includes('Create the administrator account')) {
    console.log('Creating admin account first...');
    await page.fill('input[placeholder="Admin Name"]', 'Test Admin');
    await page.fill('input[placeholder="10-digit mobile number"]', '9999999999');
    await page.fill('input[placeholder="Email address"]', 'admin@example.com');
    await page.click('button:has-text("Create Administrator Account")');
    await page.waitForTimeout(2000);
    // It should log them in as admin. We need to clear session to go back to marketing.
    console.log('Logging out of admin...');
    const hasLogout = await page.isVisible('button:has-text("Logout")');
    if (hasLogout) await page.click('button:has-text("Logout")');
    else await page.evaluate(() => { localStorage.clear(); window.location.reload(); });
    await page.waitForTimeout(1000);
    // But wait! If we clear localStorage here, we lose our seeded customer state!
  }

  // The prompt says "load the app on an empty database, and confirm it shows the login screen with no crash"
  // Wait, if it's an empty database, how can it show the login screen? It shows the setup screen!
  // Maybe I should seed the database with just the admin so we don't get the setup screen?
  
  await browser.close();
})();
