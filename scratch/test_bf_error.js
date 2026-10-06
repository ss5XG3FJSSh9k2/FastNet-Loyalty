const { chromium } = require('playwright');
const fs = require('fs');

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

  // Wait for loading to finish
  await page.waitForTimeout(2000);

  // Check if it's on marketing page (which means session was cleared because user doesn't exist)
  console.log('Checking current view...');
  const text = await page.textContent('body');
  if (text.includes('Shop Groceries Now')) {
    console.log('Successfully showed marketing page (login cleared).');
  } else {
    console.error('Marketing page not shown!');
  }

  const currentUser = await page.evaluate(() => localStorage.getItem('currentUser'));
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const carts = await page.evaluate(() => localStorage.getItem('fastnet_carts'));

  if (!currentUser && !token && !carts) {
    console.log('localStorage was successfully cleared.');
  } else {
    console.error('localStorage was NOT cleared!', { currentUser, token, carts });
  }

  // Click through customer sign up
  console.log('Clicking "Shop Groceries Now"...');
  await page.click('text=Shop Groceries Now');
  await page.waitForTimeout(500);

  console.log('Clicking "Customer"...');
  const hasCustomerBtn = await page.isVisible('button:has-text("Customer")');
  if(hasCustomerBtn) await page.click('button:has-text("Customer")');

  console.log('Checking for login modal...');
  const loginText = await page.textContent('body');
  if (loginText.includes('Customer Login') || loginText.includes('Login')) {
    console.log('Login modal successfully shown without crash.');
  } else {
    console.error('Login modal not found!');
  }

  await browser.close();
  process.exit(0);
})();
