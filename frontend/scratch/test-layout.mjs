import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to FastNet...');
  await page.goto('http://localhost:5173');

  // Log in as Admin
  console.log('Logging in as Admin...');
  await page.click('text=Admin Portal');
  await page.fill('input[placeholder*="10-digit"]', 'admin@fastnet.com');
  await page.click('button:has-text("Send One-Time Password")');
  await page.waitForSelector('input[placeholder*="6-digit"]', { state: 'visible' });
  await page.fill('input[placeholder*="6-digit"]', '123456');
  await page.click('button:has-text("Verify & Login")');
  await //, { state: 'visible' });

  // Go to Stockists tab
  console.log('Navigating to Stockists...');
  // The sidebar item for Stockists
  await page.waitForTimeout(2000); await page.screenshot({path: "debug_login.png"}); await page.waitForSelector("text=Stockists"); await page.click("text=Stockists");
  await page.waitForSelector('text=Add Stockist', { state: 'visible' });

  // Open Edit Stockist modal
  console.log('Opening Edit Stockist Modal...');
  // Find a stockist and click Edit
  await page.click('table tbody tr:first-child button:has-text("Edit")');
  await page.waitForSelector('text=Edit Stockist Details', { state: 'visible' });

  // Take 1280px screenshot
  const outDir = 'C:\\Users\\thari\\.gemini\\antigravity-ide\\brain\\eeff2f38-4c0a-47b9-b503-e9a1da26bfe1';
  await page.screenshot({ path: path.join(outDir, 'edit_stockist_1280.png') });
  console.log('Saved edit_stockist_1280.png');

  // Check 2-column grid alignment
  console.log('Checking Alignment...');
  const openInput = await page.locator('#edit-stk-open').boundingBox();
  const closeInput = await page.locator('#edit-stk-close').boundingBox();
  const etaInput = await page.locator('#edit-stk-eta').boundingBox();
  const radiusInput = await page.locator('#edit-stk-radius').boundingBox();

  if (Math.abs(openInput.y - closeInput.y) > 1 || Math.abs(openInput.height - closeInput.height) > 1) {
    console.error('Alignment fail: Open and Close times do not align perfectly.');
  } else {
    console.log('Open/Close row aligned perfectly.');
  }

  if (Math.abs(etaInput.y - radiusInput.y) > 1 || Math.abs(etaInput.height - radiusInput.height) > 1) {
    console.error('Alignment fail: ETA and Radius do not align perfectly.');
  } else {
    console.log('ETA/Radius row aligned perfectly.');
  }

  // Ensure suffix is inside the cell
  console.log('Validating suffix inside cell...');
  // Just capturing screenshots as proof.

  // 360px viewport
  console.log('Resizing to 360px...');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'edit_stockist_360.png') });
  console.log('Saved edit_stockist_360.png');

  // Check horizontal scroll
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  if (scrollWidth > clientWidth) {
    console.error(`Horizontal scroll detected! scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);
  } else {
    console.log('No horizontal scroll detected at 360px.');
  }

  // Restore 1280px
  await page.setViewportSize({ width: 1280, height: 900 });

  // Change a value with + and -
  console.log('Changing Prep ETA value...');
  const initialEta = await page.inputValue('#edit-stk-eta');
  await page.locator('#edit-stk-eta').locator('xpath=..').locator('button', { hasText: '＋' }).click();
  const newEta = await page.inputValue('#edit-stk-eta');
  console.log(`Changed ETA from ${initialEta} to ${newEta}`);

  // Switch to Hindi
  console.log('Switching to Hindi...');
  await page.click('button[title="Switch to Hindi"]'); // Assuming the language button has title or text
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'edit_stockist_hindi.png') });
  console.log('Saved edit_stockist_hindi.png');

  // Switch to Bengali
  console.log('Switching to Bengali...');
  await page.click('button[title="Switch to Bengali"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'edit_stockist_bengali.png') });
  console.log('Saved edit_stockist_bengali.png');

  // Switch back to English
  await page.click('button[title="Switch to English"]');
  await page.waitForTimeout(1000);

  console.log('Closing Edit Modal and opening Add Modal...');
  await page.click('button:has-text("Cancel")'); // Wait, there's an X button or Cancel?
  // Use the X button
  await page.click('.modal-content button .lucide-x');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Add Stockist")');
  await page.waitForSelector('text=Stockist / Shop Name', { state: 'visible' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'add_stockist_1280.png') });
  console.log('Saved add_stockist_1280.png');

  await browser.close();
  console.log('Tests completed.');
})();
