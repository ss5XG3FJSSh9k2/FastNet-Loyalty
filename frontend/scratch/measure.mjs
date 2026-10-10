import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // get absolute path to measure.html
  const fileUrl = 'file://' + path.resolve('scratch/measure.html');
  await page.goto(fileUrl);
  const box = await page.locator('#wrapper').boundingBox();
  console.log(`Measured width: ${box.width}px`);
  
  // also check Reactivate
  await page.evaluate(() => {
    document.querySelectorAll('button')[4].textContent = 'Reactivate';
  });
  const box2 = await page.locator('#wrapper').boundingBox();
  console.log(`Measured width (Reactivate): ${box2.width}px`);
  
  await browser.close();
})();
