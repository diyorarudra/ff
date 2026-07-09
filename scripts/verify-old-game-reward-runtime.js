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
const auditReport = [];

let needsRepair = 0;

oldGames.forEach(slug => {
    const indexPath = path.join(__dirname, '../games', slug, 'index.html');
    if (!fs.existsSync(indexPath)) return;
    
    const content = fs.readFileSync(indexPath, 'utf8');
    
    const hasCustomEvent = content.includes('dispatchEvent(new CustomEvent("FF_LEVEL_COMPLETE"') || 
                           content.includes('dispatchEvent(new CustomEvent("FF_GAME_COMPLETE"') ||
                           content.includes('window.FFRewards.triggerReward');
                           
    const hasHelperThatUsesCustomEvent = content.includes('function ffTriggerRewardEvent') && content.includes('new CustomEvent(');
    
    const hasTrigger = hasCustomEvent || hasHelperThatUsesCustomEvent || content.includes('window.dispatchEvent(new CustomEvent("FF_GAME_COMPLETE"');
    
    const reliesOnlyOnPostMessage = content.includes('postMessage') && !hasTrigger;

    const hasGuard = content.includes('ffLastRewardMilestone') || 
                     content.includes('ffRewardSentForCurrentRound') || 
                     content.includes('ffTicTacToeRewardSent') || 
                     content.includes('ffRewardSentForMatch') ||
                     content.includes('ffLastMilestone') ||
                     content.includes('ffRoundRewardGiven');

    const jsCount = (content.match(/game-rewards\.js/g) || []).length;
    const cssCount = (content.match(/game-rewards\.css/g) || []).length;
    
    const skips = ['draw-pixels', 'play-chess', 'spider-solitaire'];
    
    if (skips.includes(slug)) {
        auditReport.push(`| ${slug} | Skipped (Documented) | N/A | N/A |`);
    } else {
        let issues = [];
        if (!hasTrigger || reliesOnlyOnPostMessage) issues.push("Missing CustomEvent Dispatch");
        if (!hasGuard) issues.push("Missing Duplicate Guard");
        if (jsCount !== 1) issues.push(`game-rewards.js count: ${jsCount}`);
        if (cssCount !== 1) issues.push(`game-rewards.css count: ${cssCount}`);
        
        if (issues.length === 0) {
            auditReport.push(`| ${slug} | OK | None |`);
        } else {
            auditReport.push(`| ${slug} | ERROR | ${issues.join(", ")} |`);
            needsRepair++;
        }
    }
});

const reportMarkdown = `# Old Game Reward Trigger Repair Report\n\n| Slug | Status | Issues |\n|---|---|---|\n${auditReport.join("\n")}\n`;
fs.writeFileSync(path.join(__dirname, '../OLD_GAME_REWARD_TRIGGER_REPAIR_REPORT.md'), reportMarkdown);

console.log(`Runtime check complete. ${needsRepair} games need repair. See OLD_GAME_REWARD_TRIGGER_REPAIR_REPORT.md`);
if (needsRepair > 0) process.exit(1);
