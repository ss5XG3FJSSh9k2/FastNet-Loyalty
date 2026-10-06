const { chromium, devices } = require('playwright');
const assert = require('assert');

async function getBoundingClientRect(page, selector) {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.getBoundingClientRect() : null;
  }, selector);
}

async function runTest(viewport) {
  console.log(`\n--- Running test on viewport ${viewport.width}x${viewport.height} ---`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  
  try {
    console.log('Resetting DB...');
    await page.request.post('http://localhost:3001/api/admin/reset-db');
    
    console.log('Creating admin...');
    await page.request.post('http://localhost:3001/api/setup/create-admin', {
      data: { name: 'Admin', phone: '9999999999', email: 'admin@fastnet.test' }
    });
    
    console.log('Logging in via API...');
    await page.request.post('http://localhost:3001/api/auth/send-otp', {
      data: { phone: '9999999999', role: 'ADMIN' }
    });
    const verifyRes = await page.request.post('http://localhost:3001/api/auth/verify-otp', {
      data: { phone: '9999999999', otp: '123456', expected_role: 'ADMIN' }
    });
    
    const verifyData = await verifyRes.json();
    const tokenStr = verifyData.token || verifyData.session_token;
    let cookieToken = tokenStr;
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session_token');
    if (sessionCookie) {
       cookieToken = sessionCookie.value;
    }
    
    console.log('Token acquired: ', !!cookieToken);
    
    // Do not create Region or Wholesaler so steps stay incomplete
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.evaluate(({ token }) => {
      window.localStorage.setItem('token', token);
      window.localStorage.setItem('currentUser', JSON.stringify({id: 'u-admin', role: 'ADMIN', phone: '9999999999'}));
    }, { token: cookieToken });
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Switch to Admin Portal if needed
    const adminPortalBtn = page.locator('button', { hasText: 'Admin Portal' });
    if (await adminPortalBtn.isVisible()) {
       await adminPortalBtn.click();
       await page.waitForTimeout(500);
    }
    
    // Wait for checklist to render
    await page.waitForSelector('text=Getting Started');
    await page.waitForTimeout(1000);

    const checkScroll = async (stepName, clickLocator, expectedTabStr) => {
      console.log(`Testing ${stepName}...`);
      await clickLocator.click();
      await page.waitForTimeout(600); // wait for 250ms timeout + scroll
      
      let rect = await getBoundingClientRect(page, '#admin-tab-content');
      console.log(`${stepName} offset: ${rect.top.toFixed(1)}px`);
      
      const contentText = await page.textContent('#admin-tab-content');
      if (!contentText.includes(expectedTabStr)) {
         console.warn(`Warning: Expected tab ${expectedTabStr} not found!`);
      }
      return rect.top;
    };
    
    const results = {};
    const steps = [
      { name: 'Step 1', locator: page.locator('div').filter({ hasText: /^1\. Create your first service region/ }).locator('span:has-text("Go")'), expectedStr: 'Regions' },
      { name: 'Step 2', locator: page.locator('div').filter({ hasText: /^2\. Register a wholesaler for that region/ }).locator('span:has-text("Go")'), expectedStr: 'Wholesalers' },
      { name: 'Step 3', locator: page.locator('div').filter({ hasText: /^3\. Wait for a shopkeeper to register/ }).locator('span:has-text("Go")'), expectedStr: 'Pending KYC' },
      { name: 'Step 4', locator: page.locator('div').filter({ hasText: /^4\. Invite customers to sign up/ }).locator('span:has-text("Go")'), expectedStr: 'Customers' }
    ];

    for (let step of steps) {
      // First click
      results[`${step.name} First`] = await checkScroll(`${step.name} First`, step.locator, step.expectedStr);
      
      // Scroll back to top manually
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
      
      // Second click
      results[`${step.name} Repeat`] = await checkScroll(`${step.name} Repeat`, step.locator, step.expectedStr);
      
      // Scroll back up for next test
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
    }

    // Step 1 -> sidebar click -> Step 1 again
    console.log('Testing step 1 -> sidebar -> step 1...');
    await steps[0].locator.click();
    await page.waitForTimeout(600);
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    const sidebarItem = page.locator('.sidebar-item').filter({ hasText: 'Regions' });
    if (await sidebarItem.isVisible()) {
       await sidebarItem.click();
    }
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    const rectSidebarTest = await checkScroll('Step 1 after sidebar', steps[0].locator, steps[0].expectedStr);
    
    // Manual scroll intervention
    console.log('Testing manual scroll intervention...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    
    await steps[0].locator.click();
    await page.waitForTimeout(20);
    // Emit wheel event to set flag
    await page.evaluate(() => window.dispatchEvent(new Event('wheel')));
    // Scroll manually
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(600);
    
    const afterCancelScroll = await page.evaluate(() => window.scrollY);
    console.log(`ScrollY after intervention (should be 500): ${afterCancelScroll}`);
    
    return results;
  } catch(e) {
    console.error(e);
    await page.screenshot({ path: `failure-${viewport.width}.png` });
  } finally {
    await browser.close();
  }
}

(async () => {
  const res1 = await runTest({ width: 1280, height: 800 });
  const res2 = await runTest({ width: 390, height: 844 });
  
  console.log('\n--- Final Offsets ---');
  console.log('1280x800:');
  console.log(res1);
  console.log('390x844:');
  console.log(res2);
  
  process.exit(0);
})();
