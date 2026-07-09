const fs = require('fs');
const path = require('path');

const batch = [
  'true-or-false', 'quiz-game-2', 'quiz-games', 'millionaire-quiz', 'guess-number', 
  'guess-the-song', 'faster-or-slower', 'solve-math-ex', 'hacker-challenge', 
  'daily-word-puzzle', 'word-connect', 'gk-quiz-india', 'logo-guess-game', 'guess-the-city'
];

const gamesDir = path.join(__dirname, '..', 'games');
let report = `# CORRECT ACTION BATCH B (QUIZ) REPORT\n\n`;

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
        `$1 $2 if (typeof window.FFRewards !== 'undefined' && window.FFRewards.triggerCorrectAnswer) { window.FFRewards.triggerCorrectAnswer({ gameSlug: "${slug}", scoreDelta: 10, xp: 2, coins: 0, label: "Correct!" }); }`);
        
        // Also ensure milestone doesn't fire big rain
        content = content.replace(/ffCheckScoreMilestone\(\s*score\s*,\s*(\d+)\s*\);?/g, 
        `if(typeof ffCheckScoreMilestone !== 'undefined') ffCheckScoreMilestone(score, $1);`);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        report += `- **${slug}**: Patched successfully (Added triggerCorrectAnswer).\n`;
    } else {
        report += `- **${slug}**: Checked. hasTrigger: ${hasTrigger ? 'Yes' : 'No'}.\n`;
    }
});

fs.writeFileSync(path.join(__dirname, '..', 'CORRECT_ACTION_BATCH_B_QUIZ_REPORT.md'), report);
console.log('Batch B complete.');
