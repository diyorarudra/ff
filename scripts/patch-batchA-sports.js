const fs = require('fs');
const path = require('path');

const batch = [
  'swipe-basketball', 'classic-bowling', 'penalty-shootout', 'cricket-batting-challenge',
  'cricket-quiz-league', 'archery-master', 'target-tap', 'cannon-balls', 'weapon-strike', 'hit-villains'
];

const gamesDir = path.join(__dirname, '..', 'games');
let report = `# CORRECT ACTION BATCH A (SPORTS) REPORT\n\n`;

batch.forEach(slug => {
    const filePath = path.join(gamesDir, slug, 'index.html');
    if (!fs.existsSync(filePath)) {
        report += `- **${slug}**: Not found\n`;
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Check if score++ or score += is present, and if we can inject triggerCorrectAnswer
    // We already manually patched swipe-basketball.
    if (slug !== 'swipe-basketball') {
        const hasTrigger = content.includes('triggerCorrectAnswer');
        const hasScoreIncr = content.includes('score++') || content.match(/score\s*\+=\s*\d+/);

        if (hasScoreIncr && !hasTrigger) {
            // Very basic injection where we find score++ and updateScore()
            content = content.replace(/(score\+\+;?|score\s*\+=\s*\d+;?)\s*(updateScore\(\);?|scoreEl\.textContent\s*=\s*score;?)/, 
            `$1 $2 if (typeof window.FFRewards !== 'undefined' && window.FFRewards.triggerCorrectAnswer) { window.FFRewards.triggerCorrectAnswer({ gameSlug: "${slug}", scoreDelta: 10, xp: 2, coins: 0, label: "Goal!" }); }`);
            
            // Also ensure milestone doesn't fire big rain
            content = content.replace(/ffCheckScoreMilestone\(\s*score\s*,\s*(\d+)\s*\);?/g, 
            `if(typeof ffCheckScoreMilestone !== 'undefined') ffCheckScoreMilestone(score, $1);`);
        }
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        report += `- **${slug}**: Patched successfully (Added triggerCorrectAnswer).\n`;
    } else {
        const hasTrigger = content.includes('triggerCorrectAnswer') ? 'Yes' : 'No';
        report += `- **${slug}**: Checked. hasTrigger: ${hasTrigger}.\n`;
    }
});

fs.writeFileSync(path.join(__dirname, '..', 'CORRECT_ACTION_BATCH_A_SPORTS_REPORT.md'), report);
console.log('Batch A complete.');
