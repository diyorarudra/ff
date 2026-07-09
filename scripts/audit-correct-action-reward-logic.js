const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '..', 'games');
const games = fs.readdirSync(gamesDir).filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory());

let report = `# Correct Action and Reward Logic Audit\n\n`;
report += `| Slug | Category | Score Var | Score UI | Action Handler | Level Complete | Game Complete | Direct Coin Mutation | Wallet | Issue/Fix | Batch |\n`;
report += `|---|---|---|---|---|---|---|---|---|---|---|\n`;

games.forEach(slug => {
    const indexPath = path.join(gamesDir, slug, 'index.html');
    if (!fs.existsSync(indexPath)) return;
    
    const content = fs.readFileSync(indexPath, 'utf8');
    
    const scoreVar = content.includes('score') || content.includes('scoreValue') ? 'Yes' : 'No';
    const scoreUI = content.includes('id="score"') || content.includes('.textContent = score') || content.includes('.innerHTML = score') ? 'Yes' : 'No';
    const actionHandler = content.includes('score++') || content.includes('score +=') || content.includes('updateScore()') ? 'Yes' : 'No';
    const levelComplete = content.includes('FF_LEVEL_COMPLETE') ? 'Yes' : 'No';
    const gameComplete = content.includes('FF_GAME_COMPLETE') ? 'Yes' : 'No';
    
    // Unsafe mutations
    const directMutation = content.match(/localStorage\.setItem\(['"]ffliveplay_coins['"]/) || content.match(/coins\s*\+?=/) ? 'Yes' : 'No';
    
    let issue = 'OK';
    let fix = 'None';
    let batch = 'None';
    
    if (directMutation === 'Yes') {
        issue = 'direct-coin-mutation-found';
        fix = 'Remove manual mutation, use FFRewards';
    } else if (actionHandler === 'Yes' && !content.includes('triggerCorrectAnswer')) {
        issue = 'missing-correct-action-feedback';
        fix = 'Add triggerCorrectAnswer';
    } else if (levelComplete === 'No' && gameComplete === 'No') {
        issue = 'missing-game-complete-trigger';
        fix = 'Add trigger on isOver=true';
    }

    report += `| ${slug} | N/A | ${scoreVar} | ${scoreUI} | ${actionHandler} | ${levelComplete} | ${gameComplete} | ${directMutation} | Shared | ${issue} | ${batch} |\n`;
});

fs.writeFileSync(path.join(__dirname, '..', 'CORRECT_ACTION_REWARD_AUDIT.md'), report);
console.log('Audit complete.');
