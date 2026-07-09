const fs = require('fs');
const path = require('path');

const batch1 = ['quiz-game-2', 'quiz-games', 'millionaire-quiz', 'guess-number', 'guess-the-song', 'faster-or-slower', 'solve-math-ex', 'hacker-challenge'];
const gamesDir = path.join(__dirname, '..', 'games');

let report = `# Batch 1 (Quiz) Game Score and Reward Fix Report\n\n`;

batch1.forEach(slug => {
    const filePath = path.join(gamesDir, slug, 'index.html');
    if (!fs.existsSync(filePath)) {
        report += `- **${slug}**: Not found\n`;
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // 1. Replace correct answer reward
    // This matches: if (typeof ffCheckScoreMilestone !== 'undefined') ffCheckScoreMilestone(score, 50);
    const milestoneRegex = /if\s*\(\s*typeof\s+ffCheckScoreMilestone\s*!==\s*['"]undefined['"]\s*\)\s*ffCheckScoreMilestone\s*\(\s*score\s*,\s*\d+\s*\)\s*;/g;
    
    if (milestoneRegex.test(content)) {
        content = content.replace(milestoneRegex, `if (window.FFRewards && window.FFRewards.triggerCorrectAnswer) { window.FFRewards.triggerCorrectAnswer({ gameSlug: '${slug}', scoreDelta: 10, xp: 2, coins: 0 }); } if (typeof ffCheckScoreMilestone !== 'undefined') ffCheckScoreMilestone(score, 50);`);
    }

    // 2. Add GAME_COMPLETE to isOver = true
    // This matches: isOver=true;
    // We only want to replace it if we haven't already
    if (!content.includes('FF_GAME_COMPLETE')) {
        content = content.replace(/isOver\s*=\s*true\s*;/g, `isOver=true; if (typeof window.ffRewardSentForCurrentRound !== 'undefined' && !window.ffRewardSentForCurrentRound) { window.ffRewardSentForCurrentRound = true; window.dispatchEvent(new CustomEvent("FF_GAME_COMPLETE", { detail: { type: "GAME_COMPLETE", gameSlug: "${slug}", level: 1, score: typeof score !== 'undefined' ? score : 0, coins: 20 } })); }`);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        report += `- **${slug}**: Patched successfully.\n`;
    } else {
        report += `- **${slug}**: No changes made.\n`;
    }
});

fs.writeFileSync(path.join(__dirname, '..', 'GAME_SCORE_REWARD_BATCH1_REPORT.md'), report);
console.log('Batch 1 patch complete.');
