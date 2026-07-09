const slug = "traffic-control";

let score = 0;
let strikes = 0;
let lights = { n: 'red', s: 'red', e: 'red', w: 'red' };
let cars = [];
let gameLoop = null;
let spawnTimer = null;
let spawnRate = 2000;
let lastTickTime = Date.now();

const INT_MIN = 120;
const INT_MAX = 180;
const CAR_SIZE = 24;

const EMOJIS = ["🚗", "🚕", "🚙", "🚌", "🛻"];

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

function toggleLight(dir) {
    lights[dir] = lights[dir] === 'red' ? 'green' : 'red';
    const el = document.getElementById(`light-${dir}`);
    el.className = `light ${lights[dir]}`;
}

document.querySelectorAll('.light').forEach(el => {
    el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        toggleLight(e.target.dataset.dir);
    });
});

function initGame() {
    score = 0;
    strikes = 0;
    spawnRate = 2000;
    cars = [];
    lights = { n: 'red', s: 'red', e: 'red', w: 'red' };
    
    document.querySelectorAll('.light').forEach(el => el.className = 'light red');
    document.getElementById('cars-container').innerHTML = '';
    
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-strikes').innerText = strikes;
    
    postMsg("GAME_START");
    showScreen('game');
    
    lastTickTime = Date.now();
    cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(tick);
    
    clearTimeout(spawnTimer);
    scheduleSpawn();
}

function scheduleSpawn() {
    spawnTimer = setTimeout(() => {
        spawnCar();
        // gradually increase difficulty
        spawnRate = Math.max(800, spawnRate - 50);
        scheduleSpawn();
    }, spawnRate);
}

function spawnCar() {
    const dirs = ['n', 's', 'e', 'w'];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    
    let x, y, vx, vy, angle;
    
    // N = comes from top, goes down. Lane: x=125
    // S = comes from bottom, goes up. Lane: x=155
    // W = comes from left, goes right. Lane: y=155
    // E = comes from right, goes left. Lane: y=125
    
    if (dir === 'n') { x = 125; y = -30; vx = 0; vy = 60; angle = 180; }
    if (dir === 's') { x = 155; y = 300; vx = 0; vy = -60; angle = 0; }
    if (dir === 'w') { x = -30; y = 155; vx = 60; vy = 0; angle = 90; }
    if (dir === 'e') { x = 300; y = 125; vx = -60; vy = 0; angle = 270; }
    
    const el = document.createElement('div');
    el.className = 'car';
    el.innerText = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    // Set initial transform just for rotation, CSS left/top for pos
    el.style.transform = `rotate(${angle}deg)`;
    document.getElementById('cars-container').appendChild(el);
    
    cars.push({
        id: Math.random().toString(36).substr(2, 9),
        dir, x, y, vx, vy, angle, el,
        crashed: false,
        passed: false
    });
}

function tick() {
    let now = Date.now();
    let dt = (now - lastTickTime) / 1000;
    lastTickTime = now;
    
    // Update car positions
    cars.forEach(car => {
        if (car.crashed) return;
        
        let canMove = true;
        
        // Stop line logic
        // N light at y=90, stop line is ~90. If car is between 60 and 90, and light is red.
        if (car.dir === 'n' && lights.n === 'red' && car.y > 60 && car.y < 90) canMove = false;
        if (car.dir === 's' && lights.s === 'red' && car.y < 210 && car.y > 180) canMove = false;
        if (car.dir === 'w' && lights.w === 'red' && car.x > 60 && car.x < 90) canMove = false;
        if (car.dir === 'e' && lights.e === 'red' && car.x < 210 && car.x > 180) canMove = false;
        
        // Prevent rear-ending
        cars.forEach(other => {
            if (other === car || other.crashed) return;
            if (car.dir === other.dir) {
                // Same lane. Check distance.
                let dist = 0;
                if (car.dir === 'n' && other.y > car.y) dist = other.y - car.y;
                if (car.dir === 's' && other.y < car.y) dist = car.y - other.y;
                if (car.dir === 'w' && other.x > car.x) dist = other.x - car.x;
                if (car.dir === 'e' && other.x < car.x) dist = car.x - other.x;
                
                if (dist > 0 && dist < 35) canMove = false;
            }
        });
        
        if (canMove) {
            car.x += car.vx * dt;
            car.y += car.vy * dt;
        }
        
        car.el.style.left = car.x + 'px';
        car.el.style.top = car.y + 'px';
        
        // Check passed
        if (!car.passed) {
            if ((car.dir === 'n' && car.y > 300) ||
                (car.dir === 's' && car.y < -30) ||
                (car.dir === 'w' && car.x > 300) ||
                (car.dir === 'e' && car.x < -30)) {
                
                car.passed = true;
                score++;
                document.getElementById('val-score').innerText = score;
                postMsg("SCORE_UPDATE", { score });
                
                // Platform level complete threshold
                if (score > 0 && score % 10 === 0) {
                    postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                }
            }
        }
    });
    
    // Collision detection (very simple AABB within intersection)
    for (let i = 0; i < cars.length; i++) {
        for (let j = i + 1; j < cars.length; j++) {
            let c1 = cars[i];
            let c2 = cars[j];
            if (c1.crashed || c2.crashed || c1.passed || c2.passed) continue;
            
            // Only check if inside intersection
            if (c1.x > INT_MIN-10 && c1.x < INT_MAX && c1.y > INT_MIN-10 && c1.y < INT_MAX &&
                c2.x > INT_MIN-10 && c2.x < INT_MAX && c2.y > INT_MIN-10 && c2.y < INT_MAX) {
                
                // AABB distance check
                if (Math.abs(c1.x - c2.x) < 20 && Math.abs(c1.y - c2.y) < 20) {
                    c1.crashed = true;
                    c2.crashed = true;
                    c1.el.classList.add('crashed');
                    c2.el.classList.add('crashed');
                    
                    strikes++;
                    document.getElementById('val-strikes').innerText = strikes;
                    
                    if (strikes >= 3) {
                        endGame();
                        return;
                    }
                }
            }
        }
    }
    
    // Cleanup passed/old crashed cars
    for (let i = cars.length - 1; i >= 0; i--) {
        if (cars[i].passed || (cars[i].crashed && Math.random() < 0.01)) { // crashed cars despawn slowly
            cars[i].el.remove();
            cars.splice(i, 1);
        }
    }
    
    gameLoop = requestAnimationFrame(tick);
}

function endGame() {
    clearTimeout(spawnTimer);
    cancelAnimationFrame(gameLoop);
    
    setTimeout(() => {
        showScreen('end');
        document.getElementById('val-final-score').innerText = score;
        postMsg("GAME_OVER", { score });
    }, 1000);
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
