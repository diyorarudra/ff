const slug = "archery-master";

let score = 0;
    currentLevel = 1;
let currentLevel = 1;
const MAX_LEVELS = 5;
let arrows = 10;
let targetX = 0; // offset from center
let targetY = 0;
let tDirX = 1;
let tDirY = 1;
let aimX = 0; // crosshair pos relative to game area
let aimY = 0;
let isAiming = false;
let isShooting = false;
let gameLoop = null;

const TARGET_BASE_X = 50; // percentage
const TARGET_BASE_Y = 100; // pixels from top
const TARGET_RADIUS = 60; // total 120px

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
    score = 0;
    arrows = 10;
    targetX = 0;
    targetY = 0;
    isShooting = false;
    
    updateUI();
    postMsg("GAME_START");
    showScreen('game');
    
    resetArrow();
    
    cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(tick);
}

function updateUI() {
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-arrows').innerText = arrows;
}

function resetArrow() {
    isShooting = false;
    const arrow = document.getElementById('arrow');
    arrow.style.transition = 'none';
    arrow.style.bottom = '10px';
    arrow.style.left = '50%';
    arrow.style.transform = 'translateX(-50%) rotate(-45deg) scale(1)';
    arrow.style.opacity = '1';
    
    // reset crosshair
    const gameArea = document.getElementById('game-area');
    aimX = gameArea.clientWidth / 2;
    aimY = gameArea.clientHeight / 2;
    updateCrosshair();
}

function updateCrosshair() {
    const crosshair = document.getElementById('crosshair');
    crosshair.style.left = aimX + 'px';
    crosshair.style.top = aimY + 'px';
}

function tick() {
    if (screens.game.classList.contains('active')) {
        // Move target (difficulty increases as arrows go down)
        let speed = 1 + ((10 - arrows) * 0.3);
        
        targetX += speed * tDirX;
        targetY += (speed * 0.5) * tDirY;
        
        // Boundaries for target
        if (targetX > 100) { targetX = 100; tDirX = -1; }
        if (targetX < -100) { targetX = -100; tDirX = 1; }
        if (targetY > 50) { targetY = 50; tDirY = -1; }
        if (targetY < -50) { targetY = -50; tDirY = 1; }
        
        const targetEl = document.getElementById('target');
        targetEl.style.transform = `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px))`;
    }
    
    gameLoop = requestAnimationFrame(tick);
}

// Input handling for aiming
const gameArea = document.getElementById('game-area');

function handleMove(e) {
    if (isShooting) return;
    let clientX, clientY;
    if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const rect = gameArea.getBoundingClientRect();
    aimX = clientX - rect.left;
    aimY = clientY - rect.top;
    
    // clamp
    if (aimX < 0) aimX = 0; if (aimX > rect.width) aimX = rect.width;
    if (aimY < 0) aimY = 0; if (aimY > rect.height) aimY = rect.height;
    
    updateCrosshair();
}

gameArea.addEventListener('mousedown', (e) => { isAiming = true; handleMove(e); });
gameArea.addEventListener('mousemove', (e) => { if(isAiming) handleMove(e); });
gameArea.addEventListener('mouseup', shootArrow);
gameArea.addEventListener('mouseleave', () => { if(isAiming) shootArrow(); });

gameArea.addEventListener('touchstart', (e) => { isAiming = true; handleMove(e); e.preventDefault(); });
gameArea.addEventListener('touchmove', (e) => { if(isAiming) handleMove(e); e.preventDefault(); });
gameArea.addEventListener('touchend', (e) => { shootArrow(); e.preventDefault(); });

function shootArrow() {
    if (!isAiming || isShooting) return;
    isAiming = false;
    isShooting = true;
    
    const arrow = document.getElementById('arrow');
    arrow.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    arrow.style.left = aimX + 'px';
    arrow.style.top = aimY + 'px';
    arrow.style.bottom = 'auto'; // clear bottom
    arrow.style.transform = 'translate(-50%, -50%) rotate(-45deg) scale(0.5)';
    
    setTimeout(() => {
        calculateHit();
    }, 400);
}

function calculateHit() {
    const gameAreaRect = document.getElementById('game-area').getBoundingClientRect();
    // actual absolute position of target center
    const tCenterX = (gameAreaRect.width / 2) + targetX;
    const tCenterY = TARGET_BASE_Y + targetY;
    
    // distance from aim to target center
    let dx = aimX - tCenterX;
    let dy = aimY - tCenterY;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    let pts = 0;
    let msg = "MISS";
    let color = "var(--danger)";
    
    if (dist < 10) { pts = 50; msg = "BULLSEYE!"; color = "var(--primary)"; }
    else if (dist < 25) { pts = 30; msg = "GREAT!"; color = "var(--success)"; }
    else if (dist < 45) { pts = 10; msg = "GOOD!"; color = "#38bdf8"; }
    else if (dist < 60) { pts = 5; msg = "HIT"; color = "#fff"; }
    
    score += pts;
    arrows--;
    updateUI();
    
    const msgEl = document.getElementById('msg-overlay');
    msgEl.innerText = msg + (pts > 0 ? ` (+${pts})` : "");
    msgEl.style.color = color;
    msgEl.classList.remove('hidden');
    
    setTimeout(() => {
        msgEl.classList.add('hidden');
        if (arrows <= 0) {
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

            }
        }, 1500);
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
