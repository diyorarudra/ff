const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, '..', 'games');

const helperStr = `
function showLevelCompleteModal(onNext) {
    let modal = document.getElementById('ff-internal-level-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ff-internal-level-modal';
        modal.innerHTML = '<div style="background:rgba(15,23,42,0.95);padding:40px;border-radius:24px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.8);border:2px solid #fbbf24;min-width:300px;"><h2 style="color:#fbbf24;font-size:32px;margin:0 0 20px 0;font-family:system-ui,sans-serif;font-weight:900;">Level Complete!</h2><button id="ff-internal-next-btn" style="background:linear-gradient(135deg, #fbbf24, #f59e0b);color:#000;border:none;padding:16px 32px;font-size:20px;font-weight:900;border-radius:30px;cursor:pointer;box-shadow:0 4px 15px rgba(245,158,11,0.4);transition:transform 0.2s;">Next Level ➔</button></div>';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
        document.body.appendChild(modal);
        
        const btn = document.getElementById('ff-internal-next-btn');
        btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
    }
    modal.style.display = 'flex';
    document.getElementById('ff-internal-next-btn').onclick = () => {
        modal.style.display = 'none';
        if (onNext) onNext();
    };
}
`;

function patchFile(slug, replacerFn) {
    let jsPath = path.join(gamesDir, slug, 'script.js');
    if (!fs.existsSync(jsPath)) return;
    let code = fs.readFileSync(jsPath, 'utf8');
    if (code.includes('showLevelCompleteModal')) {
        console.log('Skipped (already patched): ' + slug);
        return;
    }
    code += helperStr;
    code = replacerFn(code);
    fs.writeFileSync(jsPath, code, 'utf8');
    console.log('Patched custom: ' + slug);
    updateAudit(slug);
}

function updateAudit(slug) {
    const auditPath = path.join(__dirname, '..', 'LEVEL_FLOW_AUDIT.md');
    if (fs.existsSync(auditPath)) {
        let audit = fs.readFileSync(auditPath, 'utf8');
        const regex = new RegExp(`\\| ${slug} \\|.*`);
        audit = audit.replace(regex, `| ${slug} | ✅ | ✅ | ✅ | FIXED | Batch 3 Custom Applied |`);
        fs.writeFileSync(auditPath, audit, 'utf8');
    }
}

// 1. wood-block-puzzle (Add milestone logic)
patchFile('wood-block-puzzle', (code) => {
    // Add currentLevel var
    code = code.replace(/let score = 0;/, "let score = 0;\nlet currentLevel = 1;");
    code = code.replace(/score = 0;/, "score = 0;\n    currentLevel = 1;");
    
    // Replace the checkLines postMsg logic
    code = code.replace(/if \(lines > 0\) \{[\s\S]*?postMsg\("LEVEL_COMPLETE".*?;[\s\S]*?\}/, 
    `if (lines > 0) {
        score += (lines * 10) * lines;
        if (score >= currentLevel * 500) {
            postMsg("LEVEL_COMPLETE", { score, coins: 15 });
            showLevelCompleteModal(() => {
                currentLevel++;
            });
        }
    }`);
    return code;
});

// 2. hexa-block-puzzle (Add milestone logic)
patchFile('hexa-block-puzzle', (code) => {
    code = code.replace(/let score = 0;/, "let score = 0;\nlet currentLevel = 1;");
    code = code.replace(/score = 0;/, "score = 0;\n    currentLevel = 1;");
    
    code = code.replace(/if \(lines > 0\) \{[\s\S]*?postMsg\("LEVEL_COMPLETE".*?;[\s\S]*?\}/, 
    `if (lines > 0) {
        score += (lines * 15) * lines;
        if (score >= currentLevel * 500) {
            postMsg("LEVEL_COMPLETE", { score, coins: 15 });
            showLevelCompleteModal(() => {
                currentLevel++;
            });
        }
    }`);
    return code;
});

// 3. reaction-speed-test (Set of 10 attempts)
patchFile('reaction-speed-test', (code) => {
    // Look for postMsg("LEVEL_COMPLETE" ... ) inside handleTap
    code = code.replace(/(postMsg\("LEVEL_COMPLETE"[^\)]*\);)\s+([a-zA-Z\(\); ]+?startWait\(\);)/g, 
        `$1\n            showLevelCompleteModal(() => {\n                $2\n            });`);
    return code;
});

// 4. cricket-batting-challenge (Add multi-round logic: 5 rounds)
patchFile('cricket-batting-challenge', (code) => {
    // Currently single level.
    code = code.replace(/let score = 0;/, "let score = 0;\nlet currentRound = 1;\nconst MAX_ROUNDS = 5;");
    code = code.replace(/score = 0;/, "score = 0;\n    currentRound = 1;");
    
    // When out:
    // Instead of GAME_COMPLETE immediately, do Round Complete until MAX_ROUNDS
    code = code.replace(/postMsg\("GAME_COMPLETE".*?\);/, 
    `if (currentRound < MAX_ROUNDS) {
            postMsg("LEVEL_COMPLETE", { score, coins: 10 });
            showLevelCompleteModal(() => {
                currentRound++;
                initGameInternal();
            });
        } else {
            postMsg("GAME_COMPLETE", { score, coins: 50 });
        }`);
        
    // Add internal restarter so score isn't reset
    code = code.replace(/function initGame\(\) \{/, 
    `function initGameInternal() {
    state = 'idle';
    targetTime = 0;
    document.getElementById('msg-overlay').classList.add('hidden');
    document.getElementById('ball').style.animation = 'none';
    document.getElementById('ball').style.transform = 'translate(-50%, -50%) scale(0.1)';
    setTimeout(pitchBall, 1000);
}
function initGame() {`);

    return code;
});

// 5. penalty-shootout (5 rounds of 5 shots)
patchFile('penalty-shootout', (code) => {
    code = code.replace(/let score = 0;/, "let score = 0;\nlet currentRound = 1;\nconst MAX_ROUNDS = 5;");
    code = code.replace(/score = 0;/, "score = 0;\n    currentRound = 1;");
    
    code = code.replace(/if \(shots >= MAX_SHOTS\) \{[\s\S]*?postMsg\("GAME_COMPLETE".*?\);[\s\S]*?\}/, 
    `if (shots >= MAX_SHOTS) {
        setTimeout(() => {
            if (currentRound < MAX_ROUNDS) {
                postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                showLevelCompleteModal(() => {
                    currentRound++;
                    shots = 0; // Reset shots for next round
                    updateUI();
                    resetPlay();
                });
            } else {
                showScreen('end');
                document.getElementById('val-final-score').innerText = score;
                postMsg("GAME_COMPLETE", { score, coins: 50 });
            }
        }, 1500);
    }`);
    return code;
});

// 6. archery-master (5 levels)
patchFile('archery-master', (code) => {
    code = code.replace(/let score = 0;/, "let score = 0;\nlet currentLevel = 1;\nconst MAX_LEVELS = 5;");
    code = code.replace(/score = 0;/, "score = 0;\n    currentLevel = 1;");
    
    code = code.replace(/if \(arrows <= 0\) \{[\s\S]*?postMsg\("GAME_COMPLETE".*?\);[\s\S]*?\}/, 
    `if (arrows <= 0) {
        setTimeout(() => {
            if (currentLevel < MAX_LEVELS) {
                postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                showLevelCompleteModal(() => {
                    currentLevel++;
                    arrows = 10; // Reset arrows
                    updateUI();
                    // Increase difficulty logic here if possible
                    isAiming = false;
                });
            } else {
                showScreen('end');
                document.getElementById('val-final-score').innerText = score;
                postMsg("GAME_COMPLETE", { score, coins: 50 });
            }
        }, 1500);
    }`);
    return code;
});
