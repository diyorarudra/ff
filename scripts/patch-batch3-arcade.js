const fs = require('fs');
const path = require('path');

const batch3 = ['car-rush', 'snake-classic', 'asteroids', 'jo-jo-run', 'froggy-jump', 'neon-brick-breaker', 'bubble-pop-classic', 'balloons-shooter', 'cannon-balls', 'hit-villains', 'weapon-strike', 'chibi-hero', 'tappy-dumont', '3d-car-run', 'subway-run-5'];
const gamesDir = path.join(__dirname, '..', 'games');

let report = `# Batch 3 (Arcade) Game Score and Reward Fix Report\n\n`;

batch3.forEach(slug => {
    const filePath = path.join(gamesDir, slug, 'index.html');
    if (!fs.existsSync(filePath)) {
        report += `- **${slug}**: Not found\n`;
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Add GAME_COMPLETE to isOver = true if it doesn't already exist and isOver=true exists
    // (Only if it's not already patched with GAME_COMPLETE)
    if (!content.includes('FF_GAME_COMPLETE') && content.includes('isOver=true')) {
        content = content.replace(/isOver\s*=\s*true\s*;/g, `isOver=true; if (typeof window.ffRewardSentForCurrentRound !== 'undefined' && !window.ffRewardSentForCurrentRound) { window.ffRewardSentForCurrentRound = true; window.dispatchEvent(new CustomEvent("FF_GAME_COMPLETE", { detail: { type: "GAME_COMPLETE", gameSlug: "${slug}", level: 1, score: typeof score !== 'undefined' ? score : 0, coins: 20 } })); }`);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        report += `- **${slug}**: Patched successfully (Added GAME_COMPLETE to isOver).\n`;
    } else {
        report += `- **${slug}**: Checked (GAME_COMPLETE already present or no isOver=true).\n`;
    }
});

fs.writeFileSync(path.join(__dirname, '..', 'GAME_SCORE_REWARD_BATCH3_REPORT.md'), report);
console.log('Batch 3 patch complete.');
