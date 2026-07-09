const fs = require('fs');
const path = require('path');

const gameDir = path.join(__dirname, '../games');
const rootDir = path.join(__dirname, '../');

const riskyPhrases = [
  "click ad", "click ads", "tap ad", "view ad to earn", 
  "watch ads earn money", "earn money", "withdraw", 
  "cash reward", "gift card", "real cash", "free money", 
  "paytm", "upi reward", "reward for click", "ad click reward", 
  "support us by clicking"
];

const adKeywords = [
  "adsbygoogle", "googlesyndication", "pagead2.googlesyndication.com", 
  "adBreak", "rewardedAd", "watch ad", "watch video", "onAdComplete", "onAdClosed"
];

const unsafeRewardKeywords = [
  "addCoins", "setItem(\"ffliveplay_coins\")", "setItem('ffliveplay_coins')", 
  "triggerReward", "claimReward", "rewardCoins"
];

let totalFilesScanned = 0;
let riskyTextFound = 0;
let unsafeRewardsNearAds = 0;
let productionMockAds = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('node_modules') || fullPath.includes('.git') || fullPath.includes('dist') || fullPath.includes('.gemini') || fullPath.includes('scripts')) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  totalFilesScanned++;
  const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
  
  for (const phrase of riskyPhrases) {
    if (content.includes(phrase)) {
      riskyTextFound++;
      console.log(`[RISK] Found risky phrase "${phrase}" in ${filePath}`);
    }
  }
  
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (let i = 0; i < lines.length; i++) {
     const line = lines[i].toLowerCase();
     let hasAd = false;
     for (const ak of adKeywords) {
         if (line.includes(ak.toLowerCase())) { hasAd = true; break; }
     }
     
     if (hasAd) {
         // Check within 3 lines
         for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
             const nearLine = lines[j].toLowerCase();
             for (const rk of unsafeRewardKeywords) {
                 if (nearLine.includes(rk.toLowerCase())) {
                     unsafeRewardsNearAds++;
                     console.log(`[UNSAFE] Found "${rk}" near ad code on line ${j+1} in ${filePath}`);
                 }
             }
         }
     }
  }
}

console.log("Scanning repository for AdSense policy risks...");
scanDir(rootDir);

const report = `# AdSense Reward Policy Risk Report

## Summary
- Files Scanned: ${totalFilesScanned}
- Risky Text (Click Ad / Real Money) Found: ${riskyTextFound}
- Unsafe Reward Near Ad Code (in games): ${unsafeRewardsNearAds}
- Production Mock Rewarded Ads: ${productionMockAds}

## Result
${(riskyTextFound === 0 && unsafeRewardsNearAds === 0 && productionMockAds === 0) ? 'PASSED: No AdSense policy risks found.' : 'FAILED: AdSense policy risks detected.'}
`;

fs.writeFileSync(path.join(rootDir, 'ADSENSE_REWARD_POLICY_RISK_REPORT.md'), report);
console.log("\nScan complete. Report generated at ADSENSE_REWARD_POLICY_RISK_REPORT.md");
