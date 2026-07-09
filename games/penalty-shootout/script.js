const slug = "penalty-shootout";

let goals = 0;
let shotCount = 1;
const maxShots = 10;

let powerValue = 0;
let powerDir = 1; // 1 = right, -1 = left
let powerActive = false;
let gameLoop = null;

let lockedPower = 0; // 0 to 100

// Target positions relative to goal net top/left
const targets = {
    'tl': { kx: 10, ky: 10, bx: 35, by: 30 },
    'tr': { kx: 190, ky: 10, bx: 215, by: 30 },
    'c':  { kx: 105, ky: 40, bx: 135, by: 60 },
    'bl': { kx: 10, ky: 40, bx: 35, by: 80 },
    'br': { kx: 190, ky: 40, bx: 215, by: 80 }
};

const screens = {
    start: document.getElementById('screen-start'),
    game: document.getElementById('screen-game'),
    end: document.getElementById('screen-end')
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

function postMsg(type, extra = {}) {
    window.parent.postMessage({ type, gameSlug: slug, ...extra }, "*");
}

function initGame() {
    goals = 0;
    shotCount = 1;
    updateUI();
    postMsg("GAME_START");
    showScreen('game');
    resetShot();
}

function updateUI() {
    document.getElementById('val-shot').innerText = shotCount;
    document.getElementById('val-goals').innerText = goals;
}

function resetShot() {
    lockedPower = 0;
    powerValue = 0;
    powerDir = 1;
    powerActive = true;
    
    // Reset visual
    const ball = document.getElementById('ball');
    ball.style.transition = 'none';
    ball.style.left = '135px';
    ball.style.bottom = '30px';
    ball.style.top = 'auto'; // clear top
    ball.style.transform = 'scale(1)';
    
    const keeper = document.getElementById('keeper');
    keeper.style.transition = 'none';
    keeper.style.left = '105px';
    keeper.style.top = '40px';
    keeper.style.transform = 'rotate(0deg)';
    
    document.getElementById('btn-action').disabled = false;
    document.getElementById('btn-action').innerText = "LOCK POWER";
    document.querySelectorAll('.target').forEach(t => t.classList.add('disabled'));
    
    cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(animatePower);
}

function animatePower() {
    if (!powerActive) return;
    
    powerValue += powerDir * 2.5; // speed
    if (powerValue >= 100) { powerValue = 100; powerDir = -1; }
    if (powerValue <= 0) { powerValue = 0; powerDir = 1; }
    
    document.getElementById('power-indicator').style.left = powerValue + '%';
    
    gameLoop = requestAnimationFrame(animatePower);
}

document.getElementById('btn-action').addEventListener('click', () => {
    if (powerActive) {
        powerActive = false;
        lockedPower = powerValue;
        document.getElementById('btn-action').disabled = true;
        document.getElementById('btn-action').innerText = "SELECT TARGET!";
        document.querySelectorAll('.target').forEach(t => t.classList.remove('disabled'));
    }
});

document.querySelectorAll('.target').forEach(t => {
    t.addEventListener('click', (e) => {
        if (!powerActive && t.classList.contains('disabled') === false) {
            document.querySelectorAll('.target').forEach(el => el.classList.add('disabled'));
            takeShot(e.target.dataset.target);
        }
    });
});

function takeShot(targetId) {
    // 1. Calculate accuracy based on lockedPower (sweet spot is 40% to 60%)
    let distFromCenter = Math.abs(lockedPower - 50);
    // distFromCenter goes 0 to 50. 0 is perfect.
    
    // 2. Decide if on target
    // If you miss the sweet spot entirely (> 15), chance to miss goal.
    let onTarget = true;
    if (distFromCenter > 20 && Math.random() < 0.5) {
        onTarget = false;
    }
    
    // 3. Keeper dive
    const kDirs = Object.keys(targets);
    let kChoice = kDirs[Math.floor(Math.random() * kDirs.length)];
    // But if power was very good (dist < 10), keeper is slower or guesses wrong more often
    if (distFromCenter < 10 && Math.random() < 0.7) {
        // force wrong guess
        while(kChoice === targetId) {
            kChoice = kDirs[Math.floor(Math.random() * kDirs.length)];
        }
    }
    
    const keeper = document.getElementById('keeper');
    keeper.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    let kPos = targets[kChoice];
    keeper.style.left = kPos.kx + 'px';
    keeper.style.top = kPos.ky + 'px';
    if(kChoice.includes('l')) keeper.style.transform = 'rotate(-45deg)';
    if(kChoice.includes('r')) keeper.style.transform = 'rotate(45deg)';
    
    // 4. Ball move
    const ball = document.getElementById('ball');
    ball.style.transition = 'all 0.5s ease-out';
    ball.style.bottom = 'auto'; // allow top positioning relative to goal
    
    let isGoal = false;
    
    if (onTarget) {
        let bPos = targets[targetId];
        ball.style.left = (bPos.bx + 25) + 'px'; // +25 to account for goal offset
        ball.style.top = (bPos.by + 20) + 'px';
        ball.style.transform = 'scale(0.6)'; // gets smaller as it goes away
        
        // Did keeper save?
        setTimeout(() => {
            if (kChoice === targetId) {
                // SAVED!
                showResult("SAVED!", "var(--danger)");
            } else {
                // GOAL!
                isGoal = true;
                goals++;
                showResult("GOAL!", "var(--success)");
            }
        }, 500);
        
    } else {
        // Missed completely (wide/over)
        let bPos = targets[targetId];
        ball.style.left = (bPos.bx + 25 + (Math.random() > 0.5 ? 100 : -100)) + 'px';
        ball.style.top = (bPos.by - 50) + 'px';
        ball.style.transform = 'scale(0.5)';
        setTimeout(() => showResult("MISSED!", "var(--danger)"), 500);
    }
}

function showResult(text, color) {
    const msg = document.getElementById('msg-overlay');
    msg.innerText = text;
    msg.style.color = color;
    msg.classList.remove('hidden');
    
    updateUI();
    
    setTimeout(() => {
        msg.classList.add('hidden');
        if (shotCount >= maxShots) {
            endGame();
        } else {
            shotCount++;
            updateUI();
            resetShot();
        }
    }, 1500);
}

function endGame() {
    showScreen('end');
    document.getElementById('val-final-goals').innerText = goals;
    
    let rank = "Beginner";
    if (goals >= 8) rank = "Penalty King 👑";
    else if (goals >= 5) rank = "Striker ⚡";
    
    document.getElementById('rank-msg').innerText = "Rank: " + rank;
    
    postMsg("GAME_COMPLETE", { score: goals * 10, coins: goals * 5 });
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);

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
