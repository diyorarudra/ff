const fs = require('fs');
const path = require('path');

// 1. Get old games from main.js
const mainJsPath = path.join(__dirname, '../js/main.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
// Regex to extract all game objects
const gameBlocks = mainJsContent.match(/\{[\s\S]*?slug:\s*['"]([^'"]+)['"][\s\S]*?\}/g);
let games = [];

if (gameBlocks) {
    gameBlocks.forEach(block => {
        const slugMatch = block.match(/slug:\s*['"]([^'"]+)['"]/);
        const isNewMatch = block.match(/isNewAddedGame:\s*(true|false)/);
        const titleMatch = block.match(/title:\s*['"]([^'"]+)['"]/);
        
        if (slugMatch) {
            games.push({
                slug: slugMatch[1],
                title: titleMatch ? titleMatch[1] : slugMatch[1],
                isNewAddedGame: isNewMatch ? isNewMatch[1] === 'true' : false
            });
        }
    });
}


const oldGames = games.filter(g => !g.isNewAddedGame);
console.log(`Found ${oldGames.length} old games to audit.`);

const keywords = [
    'winGame', 'gameWon', 'levelComplete', 'completeLevel', 'checkWin', 
    'gameOver', 'endGame', 'victory', 'success', 'solved', 'allMatched', 
    'nextLevel', 'finish', 'completed'
];

let report = `# Old Game Reward Event Audit\n\n`;
report += `| Slug | Game Name | Win Func Found | Game Over Func Found | Recommendation | Risk | Auto Patch | Notes |\n`;
report += `|---|---|---|---|---|---|---|---|\n`;

let lowRiskCount = 0;
let mediumRiskCount = 0;
let highRiskCount = 0;

oldGames.forEach(game => {
    const gameDir = path.join(__dirname, '../games', game.slug);
    if (!fs.existsSync(gameDir)) return;

    let hasRewardScript = false;
    let foundWin = [];
    let foundGameOver = [];
    let isEndless = false;

    // Read all js and html files in game directory
    const files = fs.readdirSync(gameDir);
    const codeFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.html'));

    codeFiles.forEach(file => {
        const content = fs.readFileSync(path.join(gameDir, file), 'utf8');
        
        if (content.includes('game-rewards.js')) {
            hasRewardScript = true;
        }

        // Search for win triggers
        ['winGame', 'gameWon', 'levelComplete', 'completeLevel', 'victory', 'success', 'solved', 'allMatched', 'nextLevel', 'completed', 'showWinScreen'].forEach(kw => {
            if (new RegExp(kw, 'i').test(content) && !foundWin.includes(kw)) {
                foundWin.push(kw);
            }
        });

        // Search for game over triggers
        ['gameOver', 'endGame', 'finish', 'loseGame', 'showGameOver'].forEach(kw => {
            if (new RegExp(kw, 'i').test(content) && !foundGameOver.includes(kw)) {
                foundGameOver.push(kw);
            }
        });
        
        // Simple heuristic for endless games
        if (new RegExp('score\\s*\\+\\=', 'i').test(content) && !foundWin.length) {
            isEndless = true;
        }
    });

    let risk = 'high';
    let recommendation = 'skip';
    let autoPatch = 'no';
    let notes = '';

    if (foundWin.length > 0) {
        risk = 'low';
        recommendation = 'LEVEL_COMPLETE';
        autoPatch = 'yes';
        notes = 'Clear win condition found.';
    } else if (foundGameOver.length > 0 && !isEndless) {
        risk = 'medium';
        recommendation = 'GAME_COMPLETE';
        autoPatch = 'no';
        notes = 'Only game over found. May need manual check.';
    } else if (isEndless) {
        risk = 'high';
        recommendation = 'milestone';
        autoPatch = 'no';
        notes = 'Endless game structure detected.';
    } else {
        risk = 'high';
        recommendation = 'skip';
        autoPatch = 'no';
        notes = 'No clear completion signals.';
    }

    if (risk === 'low') lowRiskCount++;
    if (risk === 'medium') mediumRiskCount++;
    if (risk === 'high') highRiskCount++;

    report += `| ${game.slug} | ${game.title} | ${foundWin.join(', ') || '-'} | ${foundGameOver.join(', ') || '-'} | ${recommendation} | ${risk} | ${autoPatch} | ${notes} |\n`;
});

report += `\n## Summary\n`;
report += `- Total old games audited: ${oldGames.length}\n`;
report += `- Low Risk (Auto Patchable): ${lowRiskCount}\n`;
report += `- Medium Risk (Manual Review): ${mediumRiskCount}\n`;
report += `- High Risk (Skip / Manual Milestone): ${highRiskCount}\n`;

fs.writeFileSync(path.join(__dirname, '../OLD_GAME_REWARD_EVENT_AUDIT.md'), report, 'utf8');
console.log('Audit complete. Generated OLD_GAME_REWARD_EVENT_AUDIT.md');
