import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const fileUrl = 'file://' + path.resolve('scratch/measure_others.html');
  await page.goto(fileUrl);
  const boxC = await page.locator('#c-wrapper').boundingBox();
  console.log(`Measured width (Customers): ${boxC.width}px`);
  
  const boxP = await page.locator('#p-wrapper').boundingBox();
  console.log(`Measured width (Partners Lead): ${boxP.width}px`);
  
  await browser.close();
})();
