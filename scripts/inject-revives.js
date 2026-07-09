const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, '..', 'games');

function doRevive(slug, replacerFn) {
    let jsPath = path.join(gamesDir, slug, 'script.js');
    if (!fs.existsSync(jsPath)) {
        console.log("Missing " + slug);
        return;
    }
    let code = fs.readFileSync(jsPath, 'utf8');
    if (code.includes('FFRewards.showSpendConfirm') && code.includes('revive_token')) {
        console.log(`Already patched revive: ${slug}`);
        return;
    }
    
    // Most games have function endGame(win)
    code = code.replace(/function endGame\(win\)\s*\{/, `function ffOriginalEndGame(win) {`);
    
    let wrapper = `
let hasRevived = false;
function endGame(win) {
    if (!win && window.FFRewards && !hasRevived) {
        window.FFRewards.showSpendConfirm({
            title: "Revive?",
            message: "Use 30 coins or a Revive Token to continue?",
            cost: 30,
            itemId: "revive_token",
            onConfirm: (success) => {
                if (success) {
                    hasRevived = true;
                    // RECOVER STATE
                    ${replacerFn()}
                } else {
                    ffOriginalEndGame(win);
                }
            }
        });
        // Override cancel to trigger original game over
        setTimeout(() => {
            document.getElementById('ff-confirm-btn-cancel').onclick = () => {
                document.getElementById('ff-confirm-modal').classList.add('hidden');
                ffOriginalEndGame(win);
            };
        }, 100);
        return; // Halt game over
    }
    ffOriginalEndGame(win);
}
`;
    // For games like archery-master that don't have endGame(win), we'll do custom injections.
    
    if (code.includes('function ffOriginalEndGame')) {
        code += "\n" + wrapper;
        
        // Reset hasRevived on initGame
        code = code.replace(/function initGame\(\)\s*\{/, "function initGame() {\n    hasRevived = false;");
        fs.writeFileSync(jsPath, code, 'utf8');
        console.log(`Patched revive for: ${slug}`);
    } else {
        console.log(`Could not hook endGame in: ${slug}. Attempting manual inject...`);
        // manual hooks for archery and penalty
        if (slug === 'archery-master') {
            code = code.replace(/if \(arrows <= 0\) \{[\s\S]*?showScreen\('end'\);[\s\S]*?postMsg\("GAME_COMPLETE"[\s\S]*?\}\)/, (match) => {
                return `if (arrows <= 0) {
        if (window.FFRewards && !window.hasRevived) {
            window.FFRewards.showSpendConfirm({
                title: "Out of Arrows",
                message: "Revive for 10 extra arrows?",
                cost: 30,
                itemId: "revive_token",
                onConfirm: (success) => {
                    if (success) {
                        window.hasRevived = true;
                        arrows = 10;
                        updateUI();
                        isAiming = false;
                    } else {
                        showScreen('end');
                        document.getElementById('val-final-score').innerText = score;
                        postMsg("GAME_COMPLETE", { score, coins: 50 });
                    }
                }
            });
            setTimeout(() => {
                document.getElementById('ff-confirm-btn-cancel').onclick = () => {
                    document.getElementById('ff-confirm-modal').classList.add('hidden');
                    showScreen('end');
                    document.getElementById('val-final-score').innerText = score;
                    postMsg("GAME_COMPLETE", { score, coins: 50 });
                };
            }, 100);
            return;
        }
        showScreen('end');
        document.getElementById('val-final-score').innerText = score;
        postMsg("GAME_COMPLETE", { score, coins: 50 });
    }`;
            });
            fs.writeFileSync(jsPath, code, 'utf8');
            console.log(`Patched revive custom for: ${slug}`);
        } else if (slug === 'penalty-shootout') {
            // Very similar to archery
            code = code.replace(/if \(shots >= MAX_SHOTS\) \{[\s\S]*?postMsg\("GAME_COMPLETE"[\s\S]*?\}\)/, (match) => {
                return `if (shots >= MAX_SHOTS) {
        if (window.FFRewards && !window.hasRevived && currentRound === MAX_ROUNDS) {
            window.FFRewards.showSpendConfirm({
                title: "Game Over",
                message: "Revive for 5 extra shots?",
                cost: 30,
                itemId: "revive_token",
                onConfirm: (success) => {
                    if (success) {
                        window.hasRevived = true;
                        shots -= 5;
                        updateUI();
                        resetPlay();
                    } else {
                        showScreen('end');
                        document.getElementById('val-final-score').innerText = score;
                        postMsg("GAME_COMPLETE", { score, coins: 50 });
                    }
                }
            });
            setTimeout(() => {
                document.getElementById('ff-confirm-btn-cancel').onclick = () => {
                    document.getElementById('ff-confirm-modal').classList.add('hidden');
                    showScreen('end');
                    document.getElementById('val-final-score').innerText = score;
                    postMsg("GAME_COMPLETE", { score, coins: 50 });
                };
            }, 100);
            return;
        }
        // Original logic for normal game complete
        setTimeout(() => {
            if (currentRound < MAX_ROUNDS) {
                postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                showLevelCompleteModal(() => {
                    currentRound++;
                    shots = 0; 
                    updateUI();
                    resetPlay();
                });
            } else {
                showScreen('end');
                document.getElementById('val-final-score').innerText = score;
                postMsg("GAME_COMPLETE", { score, coins: 50 });
            }
        }, 1500);
    }`;
            });
            fs.writeFileSync(jsPath, code, 'utf8');
            console.log(`Patched revive custom for: ${slug}`);
        }
    }
}

// 1. daily-word-puzzle
doRevive('daily-word-puzzle', () => `
    attempts = MAX_ATTEMPTS;
    updateUI();
`);

// 2. hindi-word-master
doRevive('hindi-word-master', () => `
    attempts = MAX_ATTEMPTS;
    updateUI();
`);

// 3. english-word-challenge
doRevive('english-word-challenge', () => `
    attempts = MAX_ATTEMPTS;
    updateUI();
`);

// 4. cricket-quiz-league
doRevive('cricket-quiz-league', () => `
    lives = 3;
    updateUI();
    loadQuestion();
`);

// 5. bollywood-quiz-battle
doRevive('bollywood-quiz-battle', () => `
    lives = 3;
    updateUI();
    loadQuestion();
`);

// 6. gk-quiz-india
doRevive('gk-quiz-india', () => `
    lives = 3;
    updateUI();
    loadQuestion();
`);

// 7. archery-master (Custom)
doRevive('archery-master', () => ``);

// 8. penalty-shootout (Custom)
doRevive('penalty-shootout', () => ``);
