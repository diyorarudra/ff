const fs = require('fs');
const path = require('path');

const batch2 = ['connect-the-dots', 'antidote-mixer', 'face-swap-memory', 'memory-match', 'memory-card-match', 'sudoku', '2048', 'minesweeper', 'slider-puzzle', 'word-scramble-suite', 'draggable-puzzle', 'hex-connect'];
const gamesDir = path.join(__dirname, '..', 'games');

let report = `# Batch 2 (Puzzle) Game Score and Reward Fix Report\n\n`;

batch2.forEach(slug => {
    const filePath = path.join(gamesDir, slug, 'index.html');
    if (!fs.existsSync(filePath)) {
        report += `- **${slug}**: Not found\n`;
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // 1. Remove intermediate correct answer rewards in puzzle games to prevent spam
    const milestoneRegex = /if\s*\(\s*typeof\s+ffCheckScoreMilestone\s*!==\s*['"]undefined['"]\s*\)\s*ffCheckScoreMilestone\s*\(\s*score\s*,\s*\d+\s*\)\s*;/g;
    
    if (milestoneRegex.test(content)) {
        content = content.replace(milestoneRegex, `// (Removed intermediate milestone for puzzle game)`);
    }

    // 2. Add GAME_COMPLETE to isOver = true if it doesn't already exist and isOver=true exists
    // (Only if it's not already patched with GAME_COMPLETE)
    if (!content.includes('FF_GAME_COMPLETE') && content.includes('isOver=true')) {
        content = content.replace(/isOver\s*=\s*true\s*;/g, `isOver=true; if (typeof window.ffRewardSentForCurrentRound !== 'undefined' && !window.ffRewardSentForCurrentRound) { window.ffRewardSentForCurrentRound = true; window.dispatchEvent(new CustomEvent("FF_GAME_COMPLETE", { detail: { type: "GAME_COMPLETE", gameSlug: "${slug}", level: 1, score: typeof score !== 'undefined' ? score : 0, coins: 20 } })); }`);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        report += `- **${slug}**: Patched successfully (Removed intermediate milestones / Added GAME_COMPLETE).\n`;
    } else {
        report += `- **${slug}**: Checked (No unsafe milestones found, or GAME_COMPLETE already present).\n`;
    }
});

fs.writeFileSync(path.join(__dirname, '..', 'GAME_SCORE_REWARD_BATCH2_REPORT.md'), report);
console.log('Batch 2 patch complete.');
