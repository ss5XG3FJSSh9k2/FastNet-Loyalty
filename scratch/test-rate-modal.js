const { chromium } = require('playwright');
const serverModule = require('../backend/server.js');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let previewReqCount = 0;
  let applyReqCount = 0;
  
  await page.route('**/api/admin/stockists/*/commission-rate', async route => {
    const req = route.request();
    const data = JSON.parse(req.postData());
    if (data.confirmationText === 'CONFIRM') {
      applyReqCount++;
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      previewReqCount++;
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        orders_count: 10,
        gross_gmv: 5000,
        current_rate: 10,
        new_rate: 15,
        current_earnings_30d: 500,
        new_earnings_30d: 750,
        diff: 250
      }) });
    }
  });

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Switch to admin role if needed (assume dev mode)
    await page.evaluate(() => { window.localStorage.setItem('auth_token', 'dev-admin-token'); });
    await page.reload();
    await page.waitForTimeout(1000);
    
    console.log('Switching to Admin role...');
    // We can simulate clicking the Stockists tab
    const stockistsTab = await page.locator('text=Stockists');
    if (await stockistsTab.isVisible()) {
      await stockistsTab.click();
    } else {
      await page.goto('http://localhost:5173/admin/stockists');
    }
    
    console.log('Waiting for stockists grid...');
    await page.waitForTimeout(2000);
    
    // Click on a stockist row
    const stockistRow = await page.locator('text=Store').first();
    await stockistRow.click();
    
    // Wait for Stockist Details Modal
    console.log('Waiting for Change Commission Rate button...');
    const changeCommBtn = await page.locator('text=Change Commission Rate').first();
    await changeCommBtn.click();
    
    console.log('Testing Preview double click...');
    const previewBtn = await page.locator('text=Calculate 30-Day Earnings Preview');
    await previewBtn.click();
    await previewBtn.click(); // double click
    await previewBtn.click(); // triple click
    
    console.log('Waiting for response...');
    await page.waitForTimeout(2500); // Wait for the 2s delayed response
    console.log(`Preview Request Count: ${previewReqCount}`);
    
    console.log('Testing Apply double click...');
    const confirmInput = await page.locator('input[placeholder="CONFIRM"]');
    await confirmInput.fill('CONFIRM');
    
    const applyBtn = await page.locator('text=Apply Rate Change');
    await applyBtn.click();
    await applyBtn.click(); // double click
    
    await page.waitForTimeout(2500); // Wait for response
    console.log(`Apply Request Count: ${applyReqCount}`);
    
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
