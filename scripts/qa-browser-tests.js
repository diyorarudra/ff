const puppeteer = require('puppeteer');

async function runQA() {
    console.log("Starting Browser QA Automation...");
    const browser = await puppeteer.launch({ channel: 'chrome', headless: "new" });
    const page = await browser.newPage();
    const results = {};

    try {
        console.log("\n[Test 1] Clean localStorage state");
        await page.goto('http://127.0.0.1:8080/index.html');
        await page.evaluate(() => {
            localStorage.removeItem('ffliveplay_coins');
            localStorage.removeItem('ffliveplay_xp');
            localStorage.removeItem('ffliveplay_inventory');
            localStorage.removeItem('ffliveplay_xp_boost_until');
            localStorage.removeItem('ffliveplay_theme');
            localStorage.removeItem('ffliveplay_bonus_challenge_unlocked');
            localStorage.removeItem('ffliveplay_reward_cooldowns');
        });
        await page.reload();
        
        let coinsText = await page.$eval('#ui-coins', el => el.innerText);
        if (coinsText.includes('0')) {
            results['Clean State'] = 'PASS';
            console.log("PASS: Clean state applied, coins reset.");
        } else {
            results['Clean State'] = 'FAIL';
            console.log("FAIL: Coins not 0. Found: " + coinsText);
        }

        console.log("\n[Test 2] Earn coins fast");
        await page.goto('http://127.0.0.1:8080/games/tic-tac-toe/index.html?rewardTest=1');
        await page.waitForSelector('#ff-reward-hud', { timeout: 5000 });
        
        console.log("Waiting for reward to trigger (10s)...");
        await new Promise(r => setTimeout(r, 12000)); 
        
        let gameCoins = await page.evaluate(() => window.FFRewards.getCoins());
        let gameXP = await page.evaluate(() => parseInt(localStorage.getItem('ffliveplay_xp') || '0'));
        
        if (gameCoins > 0 && gameXP > 0) {
            results['Earn Coins Fast'] = 'PASS';
            console.log(`PASS: Earned ${gameCoins} coins and ${gameXP} XP.`);
        } else {
            results['Earn Coins Fast'] = 'FAIL';
            console.log("FAIL: Coins/XP did not increase.");
        }
        
        // Give 500 coins for shop tests
        await page.evaluate(() => window.FFRewards.addCoins(500));
        console.log("Added 500 coins for testing.");

        console.log("\n[Test 3, 4, 5] Coin Shop, XP Boost, Golden Theme");
        await page.click('#ff-btn-shop');
        await page.waitForSelector('#ff-modals-wrapper', { visible: true });
        
        // Buy Hint Pack
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('.ff-buy-btn'));
            const hintBtn = btns.find(b => b.innerText.includes('20') && b.parentElement.innerHTML.includes('Hint Pack'));
            if(hintBtn) hintBtn.click();
        });
        
        // Buy Golden Theme
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('.ff-buy-btn'));
            const goldBtn = btns.find(b => b.innerText.includes('150') && b.parentElement.innerHTML.includes('Golden Theme'));
            if(goldBtn) goldBtn.click();
        });
        
        let themeCheck = await page.evaluate(() => {
            return document.querySelector('.ff-hud-inner').classList.contains('golden-theme') || 
                   document.querySelector('#ff-hud-inner').classList.contains('golden-theme') ||
                   localStorage.getItem('ffliveplay_theme') === 'golden';
        });
        
        let inv = await page.evaluate(() => window.FFRewards.getInventory());
        if (inv['hint_pack'] > 0) {
            results['Shop & Inventory'] = 'PASS';
            console.log("PASS: Hint pack bought successfully.");
        } else {
            results['Shop & Inventory'] = 'FAIL';
            console.log("FAIL: Hint pack not in inventory.");
        }
        
        if (themeCheck) {
            results['Golden Theme'] = 'PASS';
            console.log("PASS: Golden theme applied.");
        } else {
            results['Golden Theme'] = 'FAIL';
            console.log("FAIL: Golden theme not applied.");
        }

        console.log("\n[Test 6] Hint integration (daily-word-puzzle)");
        await page.goto('http://127.0.0.1:8080/games/daily-word-puzzle/index.html');
        await page.waitForSelector('#btn-hint');
        
        // Remove free hints
        await page.evaluate(() => { hints = 0; updateUI(); });
        
        await page.click('#btn-hint');
        await page.waitForSelector('#ff-confirm-modal', { visible: true, timeout: 2000 });
        let confirmText = await page.$eval('#ff-confirm-modal', el => el.innerText);
        
        if (confirmText.includes('Use Hint?') || confirmText.includes('Hint Pack')) {
            results['Hint Integration'] = 'PASS';
            console.log("PASS: Hint modal opened.");
        } else {
            results['Hint Integration'] = 'FAIL';
            console.log("FAIL: Hint modal text mismatch.");
        }

        console.log("\n[Test 7] Revive integration");
        // We'll intentionally lose by calling the original endGame
        await page.evaluate(() => {
            if(typeof endGame === 'function') endGame(false);
        });
        await page.waitForSelector('#ff-confirm-modal', { visible: true, timeout: 2000 });
        let reviveText = await page.$eval('#ff-confirm-modal', el => el.innerText);
        if (reviveText.includes('Revive?')) {
            results['Revive Integration'] = 'PASS';
            console.log("PASS: Revive modal opened upon game over.");
        } else {
            results['Revive Integration'] = 'FAIL';
            console.log("FAIL: Revive modal not shown.");
        }
        
        console.log("\n[Test 8] Skip Level integration");
        await page.goto('http://127.0.0.1:8080/games/color-sort-puzzle/index.html');
        await page.waitForSelector('#btn-ff-skip');
        await page.click('#btn-ff-skip');
        await page.waitForSelector('#ff-confirm-modal', { visible: true, timeout: 2000 });
        let skipText = await page.$eval('#ff-confirm-modal', el => el.innerText);
        if (skipText.includes('Skip Level?')) {
            results['Skip Integration'] = 'PASS';
            console.log("PASS: Skip modal opened.");
        } else {
            results['Skip Integration'] = 'FAIL';
            console.log("FAIL: Skip modal not shown.");
        }

        console.log("\n[Test 9] Homepage sync");
        await page.goto('http://127.0.0.1:8080/index.html');
        await page.waitForSelector('#ui-coins');
        let homeCoins = await page.$eval('#ui-coins', el => el.innerText);
        if (parseInt(homeCoins) > 0) {
            results['Homepage Sync'] = 'PASS';
            console.log("PASS: Homepage synced. Coins: " + homeCoins);
        } else {
            results['Homepage Sync'] = 'FAIL';
            console.log("FAIL: Homepage coins didn't sync.");
        }

    } catch (err) {
        console.error("QA Test Error:", err);
    } finally {
        await browser.close();
    }
    
    console.log("\n=== FINAL REPORT ===");
    for (const [test, res] of Object.entries(results)) {
        console.log(`- ${test}: ${res}`);
    }
    console.log("====================");
}

runQA();
