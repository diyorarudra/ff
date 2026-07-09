const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Go to 2048 game
  await page.goto('http://localhost:3000/games/2048');
  
  // Wait for the reward script to initialize
  await page.waitForTimeout(2000);

  // Dispatch event
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent("FF_LEVEL_COMPLETE", {
      detail: {
        type: "LEVEL_COMPLETE",
        gameSlug: "2048",
        level: 1,
        score: 1000,
        coins: 10
      }
    }));
  });
  
  // Wait a bit for animation
  await page.waitForTimeout(500);

  // Check if coins are in DOM
  const coinCount = await page.evaluate(() => {
    return document.querySelectorAll('.ff-falling-coin').length;
  });
  
  const toastCount = await page.evaluate(() => {
    return document.querySelectorAll('.ff-toast').length;
  });

  console.log('Falling coins:', coinCount);
  console.log('Toasts:', toastCount);

  await browser.close();
})();
