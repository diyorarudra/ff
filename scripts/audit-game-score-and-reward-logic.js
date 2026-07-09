const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '..', 'games');
const mainJsContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'main.js'), 'utf8');

const gamesMatch = mainJsContent.match(/const\s+GAMES\s*=\s*(\[[\s\S]*?\]);/);
let gamesList = [];
if (gamesMatch) {
    try { gamesList = eval(gamesMatch[1]); } catch(e) {}
}

const batch1 = ['true-or-false', 'quiz-game-2', 'quiz-games', 'millionaire-quiz', 'guess-number', 'guess-the-song', 'faster-or-slower', 'solve-math-ex', 'hacker-challenge'];
const batch2 = ['connect-the-dots', 'antidote-mixer', 'face-swap-memory', 'memory-match', 'memory-card-match', 'sudoku', '2048', 'minesweeper', 'slider-puzzle', 'word-scramble-suite', 'draggable-puzzle', 'hex-connect'];
const batch3 = ['car-rush', 'snake-classic', 'asteroids', 'jo-jo-run', 'froggy-jump', 'neon-brick-breaker', 'bubble-pop-classic', 'balloons-shooter', 'cannon-balls', 'hit-villains', 'weapon-strike', 'chibi-hero', 'tappy-dumont', '3d-car-run', 'subway-run-5'];
const batch4 = ['tic-tac-toe', 'retro-tic-tac-toe', 'snake-ladders', 'ludo', 'four-colors', 'play-chess', 'spider-solitaire'];

function getBatch(slug) {
    if (batch1.includes(slug)) return 'Batch 1 (Quiz)';
    if (batch2.includes(slug)) return 'Batch 2 (Puzzle)';
    if (batch3.includes(slug)) return 'Batch 3 (Arcade)';
    if (batch4.includes(slug)) return 'Batch 4 (Board)';
    return 'Other';
}

let report = `# Game Score and Reward Logic Audit\n\n`;
report += `| Slug | Type | Score Var | Score UI | Correct Ans Handler | Level Complete | Game Complete | Dup Guard | Shared Wallet | Batch |\n`;
report += `|---|---|---|---|---|---|---|---|---|---|\n`;

gamesList.forEach(game => {
    const slug = game.slug;
    const gamePath = path.join(gamesDir, slug, 'index.html');
    let content = '';
    
    if (fs.existsSync(gamePath)) {
        content += fs.readFileSync(gamePath, 'utf8');
    }
    const scriptPath = path.join(gamesDir, slug, 'script.js');
    if (fs.existsSync(scriptPath)) {
        content += fs.readFileSync(scriptPath, 'utf8');
    }

    const type = game.category || 'unknown';
    const batch = getBatch(slug);

    const hasScoreVar = content.includes('let score') || content.includes('var score') || content.includes('score =') || content.includes('score+=');
    const hasScoreUI = content.includes('id="score"') || content.includes("getElementById('score')") || content.includes('querySelector(\'[id*="score"]\')');
    const hasCorrectHandler = content.includes('triggerCorrectAnswer') || (content.includes('score+=') && content.includes('ffCheckScoreMilestone'));
    const hasLevelComplete = content.includes('FF_LEVEL_COMPLETE');
    const hasGameComplete = content.includes('FF_GAME_COMPLETE');
    const hasDupGuard = content.includes('ffRewardSentForCurrentRound') || content.includes('ffLastRewardMilestone');
    const hasDirectCoinMut = content.includes("localStorage.setItem('coins'") || content.includes("localStorage.setItem('gameCoins'") || /coins\s*\+=/.test(content);
    
    report += `| ${slug} | ${type} | ${hasScoreVar ? 'YES' : 'NO'} | ${hasScoreUI ? 'YES' : 'NO'} | ${hasCorrectHandler ? 'YES' : 'NO'} | ${hasLevelComplete ? 'YES' : 'NO'} | ${hasGameComplete ? 'YES' : 'NO'} | ${hasDupGuard ? 'YES' : 'NO'} | ${hasDirectCoinMut ? 'NO' : 'YES'} | ${batch} |\n`;
});

fs.writeFileSync(path.join(__dirname, '..', 'GAME_SCORE_REWARD_LOGIC_AUDIT.md'), report);
console.log('Audit complete. See GAME_SCORE_REWARD_LOGIC_AUDIT.md');
