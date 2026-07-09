const slug = "parking-master";

let level = 1;
let lives = 3;
let timeLeft = 30;
let carState = { x: 20, y: 20, angle: 90, speed: 0 };
let parkTimer = 0;
let isParked = false;
let obstacles = [];
let gameLoop = null;
let timerInterval = null;

const CAR_W = 30;
const CAR_H = 40;
const LOT_W = 300;
const LOT_H = 300;
const OBSTACLE_SIZE = 30;

let keys = { up: false, down: false, left: false, right: false };

const levels = [
    { start: {x: 20, y: 20, angle: 180}, zone: {x: 200, y: 200}, obs: [] },
    { start: {x: 20, y: 20, angle: 180}, zone: {x: 220, y: 20}, obs: [{x: 150, y: 20}, {x: 150, y: 60}] },
    { start: {x: 20, y: 250, angle: 0}, zone: {x: 200, y: 50}, obs: [{x: 100, y: 150}, {x: 140, y: 150}, {x: 180, y: 150}] },
    { start: {x: 150, y: 250, angle: 0}, zone: {x: 150, y: 20}, obs: [{x: 50, y: 150}, {x: 250, y: 150}, {x: 150, y: 150}] },
    { start: {x: 20, y: 20, angle: 90}, zone: {x: 230, y: 230}, obs: [{x: 100, y: 100}, {x: 100, y: 140}, {x: 200, y: 100}] },
    { start: {x: 150, y: 250, angle: 0}, zone: {x: 250, y: 50}, obs: [{x: 100, y: 200}, {x: 150, y: 150}, {x: 200, y: 100}] },
    { start: {x: 20, y: 150, angle: 90}, zone: {x: 220, y: 150}, obs: [{x: 120, y: 50}, {x: 120, y: 90}, {x: 120, y: 130}, {x: 120, y: 210}, {x: 120, y: 250}] },
    { start: {x: 20, y: 20, angle: 180}, zone: {x: 150, y: 150}, obs: [{x: 100, y: 100}, {x: 200, y: 100}, {x: 100, y: 200}, {x: 200, y: 200}] },
    { start: {x: 150, y: 250, angle: 0}, zone: {x: 20, y: 20}, obs: [{x: 100, y: 150}, {x: 100, y: 110}, {x: 100, y: 70}, {x: 140, y: 70}] },
    { start: {x: 20, y: 250, angle: 90}, zone: {x: 240, y: 20}, obs: [{x: 80, y: 200}, {x: 160, y: 150}, {x: 200, y: 100}, {x: 150, y: 50}] }
];

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
    level = 1;
    lives = 3;
    postMsg("GAME_START");
    startLevel();
    showScreen('game');
}

function startLevel() {
    let curLvl = levels[level - 1];
    carState = { ...curLvl.start, speed: 0 };
    timeLeft = 30;
    parkTimer = 0;
    isParked = false;
    obstacles = curLvl.obs;
    
    document.getElementById('val-level').innerText = level;
    document.getElementById('val-lives').innerText = lives;
    document.getElementById('val-time').innerText = timeLeft;
    
    // Setup DOM
    const lot = document.getElementById('parking-lot');
    // Remove old obstacles
    document.querySelectorAll('.obstacle').forEach(e => e.remove());
    
    // Add new obstacles
    obstacles.forEach(obs => {
        let el = document.createElement('div');
        el.className = 'obstacle';
        el.innerText = '🚧';
        el.style.left = obs.x + 'px';
        el.style.top = obs.y + 'px';
        lot.appendChild(el);
    });
    
    // Set zone
    const zoneEl = document.getElementById('parking-zone');
    zoneEl.style.left = curLvl.zone.x + 'px';
    zoneEl.style.top = curLvl.zone.y + 'px';
    zoneEl.classList.remove('active');
    
    updateCarDOM();
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('val-time').innerText = timeLeft;
        if (timeLeft <= 0) {
            handleCrash(); // time out counts as lose life
        }
    }, 1000);
    
    cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(tick);
}

function updateCarDOM() {
    const carEl = document.getElementById('car');
    carEl.style.left = carState.x + 'px';
    carEl.style.top = carState.y + 'px';
    carEl.style.transform = `rotate(${carState.angle}deg)`;
}

function tick() {
    // Movement logic (simple arcade physics)
    if (keys.up) carState.speed = Math.min(carState.speed + 0.2, 3);
    else if (keys.down) carState.speed = Math.max(carState.speed - 0.2, -2);
    else {
        // Friction
        if (carState.speed > 0) carState.speed = Math.max(carState.speed - 0.1, 0);
        if (carState.speed < 0) carState.speed = Math.min(carState.speed + 0.1, 0);
    }
    
    if (Math.abs(carState.speed) > 0.1) {
        if (keys.left) carState.angle -= 3;
        if (keys.right) carState.angle += 3;
    }
    
    // Calculate new position
    let rad = carState.angle * (Math.PI / 180);
    let nextX = carState.x + Math.sin(rad) * carState.speed;
    let nextY = carState.y - Math.cos(rad) * carState.speed; // - because y is down
    
    // Check boundaries
    if (nextX < 0 || nextX > LOT_W - CAR_W || nextY < 0 || nextY > LOT_H - CAR_H) {
        handleCrash();
        return;
    }
    
    // Check obstacle collisions (simple AABB)
    let crashed = false;
    obstacles.forEach(obs => {
        if (nextX < obs.x + OBSTACLE_SIZE && nextX + CAR_W > obs.x &&
            nextY < obs.y + OBSTACLE_SIZE && nextY + CAR_H > obs.y) {
            crashed = true;
        }
    });
    
    if (crashed) {
        handleCrash();
        return;
    }
    
    // Apply position
    carState.x = nextX;
    carState.y = nextY;
    updateCarDOM();
    
    // Check parking zone
    let curLvl = levels[level - 1];
    let zx = curLvl.zone.x;
    let zy = curLvl.zone.y;
    // Car must be inside zone (50x60)
    let inZone = (carState.x >= zx && carState.x + CAR_W <= zx + 50 &&
                  carState.y >= zy && carState.y + CAR_H <= zy + 60 && 
                  Math.abs(carState.speed) < 0.2);
                  
    const zoneEl = document.getElementById('parking-zone');
    if (inZone) {
        zoneEl.classList.add('active');
        parkTimer += 16.6; // approx 1 frame at 60fps
        if (parkTimer > 2000) {
            winLevel();
            return;
        }
    } else {
        zoneEl.classList.remove('active');
        parkTimer = 0;
    }
    
    gameLoop = requestAnimationFrame(tick);
}

function handleCrash() {
    cancelAnimationFrame(gameLoop);
    clearInterval(timerInterval);
    
    lives--;
    document.getElementById('val-lives').innerText = lives;
    
    // Flash car red
    const carEl = document.getElementById('car');
    carEl.style.filter = 'drop-shadow(0 0 10px red)';
    
    setTimeout(() => {
        carEl.style.filter = '';
        if (lives <= 0) {
            endGame(false);
        } else {
            // restart current level
            startLevel();
        }
    }, 1000);
}

function winLevel() {
    cancelAnimationFrame(gameLoop);
    clearInterval(timerInterval);
    
    if (level === 10) {
        endGame(true);
    } else {
        postMsg("LEVEL_COMPLETE", { score: level * 100, coins: 15 });
        level++;
        setTimeout(startLevel, 1000);
    }
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'Parking Master!' : 'Game Over';
    document.getElementById('val-final-level').innerText = level;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score: level * 100, coins: 50 });
    } else {
        postMsg("GAME_OVER", { score: level * 100 });
    }
}

// Input handling
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});

window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

// Mobile button handling
const bindBtn = (id, key) => {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('mousedown', e => { keys[key] = true; });
    btn.addEventListener('mouseup', e => { keys[key] = false; });
    btn.addEventListener('mouseleave', e => { keys[key] = false; });
};

bindBtn('btn-up', 'up');
bindBtn('btn-down', 'down');
bindBtn('btn-left', 'left');
bindBtn('btn-right', 'right');

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
