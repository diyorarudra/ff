const slug = "bus-driver-route";

const SIZE = 10;
let level = 1;
let score = 0;
let timeLeft = 30;
let timerInterval = null;

let bus = { r: 0, c: 0, angle: 90 };
let paxCollected = 0;
let paxTotal = 0;

let grid = []; // 0=road, 1=obstacle, 2=passenger, 3=goal

let keys = { up: false, down: false, left: false, right: false };
let canMove = true; // prevent double move from keyhold

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

function startLevel() {
    timeLeft = 30 + (level * 5); // extra time per level
    paxCollected = 0;
    paxTotal = Math.min(3 + level, 8); // more pax on higher levels
    
    document.getElementById('val-level').innerText = level;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-time').innerText = timeLeft;
    
    generateMap();
    drawGrid();
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('val-time').innerText = timeLeft;
        if (timeLeft <= 0) {
            handleCrashOrTimeout();
        }
    }, 1000);
}

function generateMap() {
    grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
    
    bus = { r: 0, c: 0, angle: 90 };
    
    // Goal at bottom right
    grid[SIZE-1][SIZE-1] = 3;
    
    // Add obstacles (maze generation is complex, so we do random but ensure path exists via low density)
    let obsCount = 15 + level * 2;
    for(let i=0; i<obsCount; i++) {
        let r = Math.floor(Math.random() * SIZE);
        let c = Math.floor(Math.random() * SIZE);
        if ((r===0 && c===0) || (r===SIZE-1 && c===SIZE-1)) continue; // don't block start/end
        grid[r][c] = 1;
    }
    
    // Clear path around start and goal to prevent easy soft-locks
    grid[0][1] = 0; grid[1][0] = 0;
    grid[SIZE-1][SIZE-2] = 0; grid[SIZE-2][SIZE-1] = 0;
    
    // Add passengers
    let pAdded = 0;
    while(pAdded < paxTotal) {
        let r = Math.floor(Math.random() * SIZE);
        let c = Math.floor(Math.random() * SIZE);
        if (grid[r][c] === 0 && !(r===0 && c===0)) {
            grid[r][c] = 2;
            pAdded++;
        }
    }
}

function drawGrid() {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            let cell = document.createElement('div');
            let val = grid[r][c];
            
            if (r === bus.r && c === bus.c) {
                cell.className = 'cell bus';
                cell.innerText = '🚌';
                
                // Rotations based on angle: 0=Up, 90=Right, 180=Down, 270=Left
                // Emoji bus faces left natively usually? Let's assume it faces left.
                // Or maybe right. Assuming standard right-facing emoji: 
                // Right = 0, Down = 90, Left = 180, Up = 270.
                let rot = 0;
                if (bus.angle === 0) rot = -90; // up
                if (bus.angle === 90) rot = 0; // right
                if (bus.angle === 180) rot = 90; // down
                if (bus.angle === 270) rot = 180; // left
                
                cell.style.transform = `rotate(${rot}deg)`;
            } else if (val === 1) {
                cell.className = 'cell obstacle';
                cell.innerText = '🏢';
            } else if (val === 2) {
                cell.className = 'cell road passenger';
                cell.innerText = '🧍';
            } else if (val === 3) {
                cell.className = 'cell road goal';
                cell.innerText = '🏁';
            } else {
                cell.className = 'cell road';
            }
            
            cont.appendChild(cell);
        }
    }
}

function attemptMove(dr, dc, angle) {
    if (!canMove) return;
    canMove = false;
    
    bus.angle = angle;
    let nr = bus.r + dr;
    let nc = bus.c + dc;
    
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
        if (grid[nr][nc] === 1) {
            // Hit obstacle - soft crash penalty?
            score = Math.max(0, score - 5);
            document.getElementById('val-score').innerText = score;
            // Visual feedback
            const container = document.getElementById('grid-container');
            container.style.filter = 'drop-shadow(0 0 10px red)';
            setTimeout(() => { container.style.filter = ''; }, 200);
        } else {
            bus.r = nr;
            bus.c = nc;
            
            if (grid[nr][nc] === 2) {
                // Collect passenger
                grid[nr][nc] = 0;
                paxCollected++;
                score += 20;
                document.getElementById('val-score').innerText = score;
                postMsg("SCORE_UPDATE", { score });
            } else if (grid[nr][nc] === 3) {
                // Goal
                if (paxCollected >= paxTotal) {
                    winLevel();
                }
            }
        }
    }
    
    drawGrid();
    
    setTimeout(() => { canMove = true; }, 150); // move delay
}

function handleCrashOrTimeout() {
    clearInterval(timerInterval);
    endGame(false);
}

function winLevel() {
    clearInterval(timerInterval);
    
    let timeBonus = timeLeft * 5;
    score += timeBonus;
    document.getElementById('val-score').innerText = score;
    
    if (level === 10) {
        endGame(true);
    } else {
        postMsg("LEVEL_COMPLETE", { score, coins: 20 });
        level++;
        setTimeout(startLevel, 1000);
    }
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'Route Complete!' : 'Out of Time';
    document.getElementById('val-final-score').innerText = score;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 50 });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

// Input handling
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') attemptMove(-1, 0, 0);
    if (e.key === 'ArrowDown') attemptMove(1, 0, 180);
    if (e.key === 'ArrowLeft') attemptMove(0, -1, 270);
    if (e.key === 'ArrowRight') attemptMove(0, 1, 90);
});

// Mobile button handling
document.getElementById('btn-up').addEventListener('touchstart', (e) => { e.preventDefault(); attemptMove(-1, 0, 0); });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); attemptMove(1, 0, 180); });
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); attemptMove(0, -1, 270); });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); attemptMove(0, 1, 90); });

document.getElementById('btn-up').addEventListener('mousedown', () => attemptMove(-1, 0, 0));
document.getElementById('btn-down').addEventListener('mousedown', () => attemptMove(1, 0, 180));
document.getElementById('btn-left').addEventListener('mousedown', () => attemptMove(0, -1, 270));
document.getElementById('btn-right').addEventListener('mousedown', () => attemptMove(0, 1, 90));

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
