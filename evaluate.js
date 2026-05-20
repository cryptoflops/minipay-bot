const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForSelector('.md\\:col-span-3');
  const bg = await page.evaluate(() => {
    const el = document.querySelector('.md\\:col-span-3');
    return window.getComputedStyle(el).backgroundColor;
  });
  console.log('Card background color:', bg);
  
  const mainZ = await page.evaluate(() => {
    const el = document.querySelector('main');
    return window.getComputedStyle(el).zIndex;
  });
  console.log('Main z-index:', mainZ);
  
  const canvasZ = await page.evaluate(() => {
    const el = document.querySelector('canvas');
    return window.getComputedStyle(el.parentElement).zIndex;
  });
  console.log('Canvas z-index:', canvasZ);
  
  await browser.close();
})();
