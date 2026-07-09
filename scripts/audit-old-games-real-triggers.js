const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '../js/main.js');
let registryContent = fs.readFileSync(registryPath, 'utf8');

const gamesMatch = registryContent.match(/const\s+GAMES\s*=\s*(\[[\s\S]*?\]);/);
let gamesList = [];
if (gamesMatch) {
    try {
        gamesList = eval(gamesMatch[1]);
    } catch (e) {
        console.error("Failed to parse games list", e);
    }
}

const oldGames = gamesList.filter(g => g.isNew !== true).map(g => g.slug);
const skippedGames = ['draw-pixels', 'play-chess', 'spider-solitaire'];

const gamesDir = path.join(__dirname, '..', 'games');

let report = `# Old Games Real Trigger Audit\n\n`;
report += `| Slug | Assets Loaded | Helper Exists | Trigger Call | Dup Guard | Reset Guard | Direct Coin Mut | Status |\n`;
report += `|---|---|---|---|---|---|---|---|\n`;

let helperOnlyNoCallCount = 0;
let missingTriggerCount = 0;
let directCoinMutationCount = 0;
let fixedCount = 0;

oldGames.forEach(slug => {
    if (skippedGames.includes(slug)) {
        report += `| ${slug} | YES | N/A | N/A | N/A | N/A | N/A | skipped-playtime-only |\n`;
        return;
    }
    
    const indexFile = path.join(gamesDir, slug, 'index.html');
    const scriptFile = path.join(gamesDir, slug, 'script.js');
    let content = '';
    
    if (fs.existsSync(indexFile)) {
        content += fs.readFileSync(indexFile, 'utf8');
    }
    if (fs.existsSync(scriptFile)) {
        content += fs.readFileSync(scriptFile, 'utf8');
    }
    
    const hasAssets = content.includes('game-rewards.css') && content.includes('game-rewards.js');
    const hasHelper = content.includes('function ffTriggerRewardEvent');
    
    const triggerCallMatch = content.match(/ffTriggerRewardEvent\s*\(['"]/g);
    const customEventMatch = content.match(/window\.dispatchEvent\s*\(\s*new\s*CustomEvent\s*\(\s*['"]FF_(LEVEL|GAME)_COMPLETE/g);
    const directApiMatch = content.match(/window\.FFRewards\.triggerReward/g);
    
    const hasCall = (triggerCallMatch !== null) || (customEventMatch !== null) || (directApiMatch !== null);
    
    const hasDupGuard = content.includes('ffRewardSentForCurrentRound = true') || content.includes('ffRoundRewardGiven = true') || content.includes('ffLastRewardMilestone =');
    const hasResetGuard = content.includes('ffRewardSentForCurrentRound = false') || content.includes('ffRoundRewardGiven = false') || content.includes('ffLastRewardMilestone = 0');
    const hasDirectCoinMut = content.includes("localStorage.setItem('coins'") || content.includes("localStorage.setItem('gameCoins'") || /coins\s*\+=/.test(content);
    if (hasDirectCoinMut) directCoinMutationCount++;
    
    let status = 'OK';
    if (!hasCall) {
        if (hasHelper) {
            status = 'helper-only-no-call';
            helperOnlyNoCallCount++;
        } else {
            status = 'missing-trigger';
            missingTriggerCount++;
        }
    } else {
        if (slug === 'antidote-mixer') fixedCount++;
    }
    
    report += `| ${slug} | ${hasAssets ? 'YES' : 'NO'} | ${hasHelper ? 'YES' : 'NO'} | ${hasCall ? 'YES' : 'NO'} | ${hasDupGuard ? 'YES' : 'NO'} | ${hasResetGuard ? 'YES' : 'NO'} | ${hasDirectCoinMut ? 'YES' : 'NO'} | ${status} |\n`;
});

report += `\n\n## Summary\n`;
report += `- Total patched old games: ${oldGames.length - skippedGames.length}\n`;
report += `- Helper-only-no-call count: ${helperOnlyNoCallCount}\n`;
report += `- Missing trigger count: ${missingTriggerCount}\n`;
report += `- Direct coin mutation count: ${directCoinMutationCount}\n`;

fs.writeFileSync(path.join(__dirname, '..', 'OLD_GAMES_REAL_TRIGGER_AUDIT.md'), report);
console.log('Audit complete. See OLD_GAMES_REAL_TRIGGER_AUDIT.md');
