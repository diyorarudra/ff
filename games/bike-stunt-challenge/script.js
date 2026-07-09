const slug = "bike-stunt-challenge";

let level = 1;
let score = 0;
let gameLoop = null;

let keys = { accel: false, brake: false, leanFwd: false, leanBack: false };

let bike = { x: 50, y: 100, vx: 0, vy: 0, angle: 0, vAngle: 0, radius: 10, wheelDist: 20 };
let terrain = [];
let cameraX = 0;
let levelComplete = false;
let crashed = false;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
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
    score = 0;
    postMsg("GAME_START");
    startLevel();
    showScreen('game');
}

function generateTerrain() {
    terrain = [];
    let curX = 0;
    let curY = 200;
    
    // Flat start
    terrain.push({x: curX, y: curY});
    curX += 100;
    terrain.push({x: curX, y: curY});
    
    // Generate segments based on level
    let segments = 5 + (level * 2);
    
    for(let i=0; i<segments; i++) {
        curX += 50 + Math.random() * 100;
        
        // Occasional ramp
        if (Math.random() < 0.3) {
            curY -= (20 + Math.random() * 50);
            terrain.push({x: curX, y: curY});
            // gap or steep drop
            if (Math.random() < 0.5) {
                curX += 40;
                curY += 80;
                terrain.push({x: curX, y: curY});
            } else {
                curX += 80;
                terrain.push({x: curX, y: curY});
            }
        } else {
            // normal bumpy
            curY += (Math.random() * 60 - 30);
            // keep bounds
            if(curY < 100) curY = 100;
            if(curY > 280) curY = 280;
            terrain.push({x: curX, y: curY});
        }
    }
    
    // Flat finish
    curX += 100;
    terrain.push({x: curX, y: curY});
    curX += 200;
    terrain.push({x: curX, y: curY});
}

function getTerrainY(x) {
    if (x <= terrain[0].x) return terrain[0].y;
    if (x >= terrain[terrain.length-1].x) return terrain[terrain.length-1].y;
    
    for(let i=0; i<terrain.length-1; i++) {
        if (x >= terrain[i].x && x <= terrain[i+1].x) {
            let t = (x - terrain[i].x) / (terrain[i+1].x - terrain[i].x);
            return terrain[i].y + t * (terrain[i+1].y - terrain[i].y);
        }
    }
    return 200;
}

function getTerrainAngle(x) {
    let y1 = getTerrainY(x - 5);
    let y2 = getTerrainY(x + 5);
    return Math.atan2(y2 - y1, 10);
}

function startLevel() {
    generateTerrain();
    bike = { x: 50, y: 100, vx: 0, vy: 0, angle: 0, vAngle: 0, radius: 12, wheelDist: 15 };
    cameraX = 0;
    levelComplete = false;
    crashed = false;
    
    document.getElementById('val-level').innerText = level;
    document.getElementById('val-score').innerText = score;
    
    cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(tick);
}

function tick() {
    if (levelComplete || crashed) return;
    
    // Physics
    bike.vy += 0.2; // gravity
    
    // Controls
    let onGround = false;
    let terrY = getTerrainY(bike.x);
    let terrAngle = getTerrainAngle(bike.x);
    
    if (bike.y + bike.radius >= terrY) {
        onGround = true;
        bike.y = terrY - bike.radius;
        bike.vy = 0;
        
        // align to terrain gradually
        bike.angle = bike.angle * 0.8 + terrAngle * 0.2;
        bike.vAngle = 0;
        
        if (keys.accel) {
            bike.vx += Math.cos(bike.angle) * 0.5;
            bike.vy += Math.sin(bike.angle) * 0.5;
        }
        if (keys.brake) {
            bike.vx *= 0.8;
        }
    } else {
        // Air controls (leaning)
        if (keys.leanFwd) bike.vAngle += 0.01;
        if (keys.leanBack) bike.vAngle -= 0.01;
        bike.angle += bike.vAngle;
    }
    
    // Friction / drag
    bike.vx *= 0.98;
    bike.vy *= 0.99; // air resistance
    
    bike.x += bike.vx;
    bike.y += bike.vy;
    
    // Crash detection
    if (onGround) {
        // If angle difference between bike and terrain is too large, crash
        let angleDiff = Math.abs(bike.angle - terrAngle);
        // normalize diff to 0-PI
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        if (Math.abs(angleDiff) > 1.0) { // approx 60 degrees
            handleCrash();
            return;
        }
    }
    
    // Check finish line
    if (bike.x >= terrain[terrain.length - 1].x - 100) {
        winLevel();
        return;
    }
    
    draw();
    gameLoop = requestAnimationFrame(tick);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Camera follow
    cameraX = bike.x - 150;
    if (cameraX < 0) cameraX = 0;
    
    ctx.save();
    ctx.translate(-cameraX, 0);
    
    // Draw terrain
    ctx.beginPath();
    ctx.moveTo(terrain[0].x, canvas.height);
    for(let i=0; i<terrain.length; i++) {
        ctx.lineTo(terrain[i].x, terrain[i].y);
    }
    ctx.lineTo(terrain[terrain.length-1].x, canvas.height);
    ctx.fillStyle = '#475569';
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw Finish Line
    let finishX = terrain[terrain.length - 1].x - 100;
    ctx.fillStyle = 'yellow';
    ctx.fillRect(finishX, 0, 10, canvas.height);
    
    // Draw Bike (simple shapes)
    ctx.translate(bike.x, bike.y);
    ctx.rotate(bike.angle);
    
    // Wheels
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath(); ctx.arc(-bike.wheelDist, 0, bike.radius, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bike.wheelDist, 0, bike.radius, 0, Math.PI*2); ctx.fill();
    
    // Frame
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-bike.wheelDist, 0);
    ctx.lineTo(-5, -15);
    ctx.lineTo(10, -15);
    ctx.lineTo(bike.wheelDist, 0);
    ctx.stroke();
    
    // Rider
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.arc(-5, -25, 6, 0, Math.PI*2); ctx.fill(); // head
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath(); ctx.moveTo(-5, -15); ctx.lineTo(-5, -25); ctx.stroke(); // body
    
    ctx.restore();
}

function handleCrash() {
    crashed = true;
    draw();
    // highlight red
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.fillRect(0,0, canvas.width, canvas.height);
    
    setTimeout(() => {
        // Reset level
        startLevel();
    }, 1000);
}

function winLevel() {
    levelComplete = true;
    score += 100 * level;
    document.getElementById('val-score').innerText = score;
    
    if (level === 10) {
        endGame(true);
    } else {
        postMsg("LEVEL_COMPLETE", { score, coins: 15 });
        level++;
        setTimeout(startLevel, 1000);
    }
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'Champion!' : 'Game Over';
    document.getElementById('val-final-level').innerText = level;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 50 });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

// Input handling
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') keys.accel = true;
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') keys.brake = true;
    if (e.key === 'd') keys.leanFwd = true;
    if (e.key === 'a') keys.leanBack = true;
});

window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') keys.accel = false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') keys.brake = false;
    if (e.key === 'd') keys.leanFwd = false;
    if (e.key === 'a') keys.leanBack = false;
});

const bindBtn = (id, key) => {
    const btn = document.getElementById(id);
    btn.addEventListener('touchstart', e => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('touchend', e => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('mousedown', () => { keys[key] = true; });
    btn.addEventListener('mouseup', () => { keys[key] = false; });
    btn.addEventListener('mouseleave', () => { keys[key] = false; });
};

bindBtn('btn-accel', 'accel');
bindBtn('btn-brake', 'brake');
bindBtn('btn-lean-fwd', 'leanFwd');
bindBtn('btn-lean-back', 'leanBack');

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
