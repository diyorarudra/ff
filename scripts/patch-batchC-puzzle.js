const fs = require('fs');
const path = require('path');

const batch = [
  'connect-the-dots', 'antidote-mixer', 'face-swap-memory', 'memory-match', 'memory-card-match',
  'sudoku', '2048', 'minesweeper', 'slider-puzzle', 'word-scramble-suite', 'draggable-puzzle',
  'hex-connect', 'color-sort-puzzle', 'water-sort-puzzle', 'ball-sort-puzzle', 'escape-room-mini',
  'hidden-object-rooms', 'find-the-difference'
];

const gamesDir = path.join(__dirname, '..', 'games');
let report = `# CORRECT ACTION BATCH C (PUZZLE) REPORT\n\n`;

batch.forEach(slug => {
    const filePath = path.join(gamesDir, slug, 'index.html');
    if (!fs.existsSync(filePath)) {
        report += `- **${slug}**: Not found\n`;
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    const hasTrigger = content.includes('triggerCorrectAnswer');
    const hasScoreIncr = content.includes('score++') || content.match(/score\s*\+=\s*\d+/);

    if (hasScoreIncr && !hasTrigger) {
        // Very basic injection where we find score++ and updateScore()
        content = content.replace(/(score\+\+;?|score\s*\+=\s*\d+;?)\s*(updateScore\(\);?|scoreEl\.textContent\s*=\s*score;?)/, 
        `$1 $2 if (typeof window.FFRewards !== 'undefined' && window.FFRewards.triggerCorrectAnswer) { window.FFRewards.triggerCorrectAnswer({ gameSlug: "${slug}", scoreDelta: 10, xp: 2, coins: 0, label: "Correct Move!" }); }`);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        report += `- **${slug}**: Patched successfully (Added triggerCorrectAnswer).\n`;
    } else {
        report += `- **${slug}**: Checked. hasTrigger: ${hasTrigger ? 'Yes' : 'No'}.\n`;
    }
});

fs.writeFileSync(path.join(__dirname, '..', 'CORRECT_ACTION_BATCH_C_PUZZLE_REPORT.md'), report);
console.log('Batch C complete.');
