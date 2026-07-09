const slug = "nonogram-picture-puzzle";

let level = 1;
let score = 0;
let lives = 3;
let mode = 'fill'; // fill or cross

// Puzzles: 1 to 4 are 5x5, 5 to 8 are 6x6
const puzzles = [
    { size: 5, data: [1,1,1,1,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,1] }, // square
    { size: 5, data: [0,0,1,0,0, 0,1,1,1,0, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0] }, // diamond
    { size: 5, data: [1,0,0,0,1, 0,1,0,1,0, 0,0,1,0,0, 0,1,0,1,0, 1,0,0,0,1] }, // X
    { size: 5, data: [0,1,0,1,0, 1,1,1,1,1, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0] }, // heart
    { size: 6, data: [0,1,1,1,1,0, 1,0,0,0,0,1, 1,0,1,1,0,1, 1,0,1,1,0,1, 1,0,0,0,0,1, 0,1,1,1,1,0] }, // face
    { size: 6, data: [1,1,0,0,1,1, 1,1,0,0,1,1, 0,0,1,1,0,0, 0,0,1,1,0,0, 1,1,0,0,1,1, 1,1,0,0,1,1] }, // checker
    { size: 6, data: [0,0,1,1,0,0, 0,1,1,1,1,0, 1,1,0,0,1,1, 1,1,1,1,1,1, 1,1,0,0,1,1, 1,1,0,0,1,1] }, // A
    { size: 6, data: [1,1,1,1,1,1, 1,0,0,0,0,0, 1,1,1,1,1,0, 1,0,0,0,0,0, 1,0,0,0,0,0, 1,1,1,1,1,1] }  // E
];

let currentPuzzle = null;
let gridState = []; // 0=empty, 1=fill, 2=cross
let rowClues = [];
let colClues = [];

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
    lives = 3;
    postMsg("GAME_START");
    startLevel();
    showScreen('game');
}

function startLevel() {
    currentPuzzle = puzzles[level - 1];
    let size = currentPuzzle.size;
    gridState = new Array(size * size).fill(0);
    
    generateClues();
    renderGrid();
    updateUI();
}

function generateClues() {
    let size = currentPuzzle.size;
    rowClues = [];
    colClues = [];
    
    // Rows
    for(let r=0; r<size; r++) {
        let clues = [];
        let count = 0;
        for(let c=0; c<size; c++) {
            let val = currentPuzzle.data[r * size + c];
            if (val === 1) count++;
            else if (count > 0) { clues.push(count); count = 0; }
        }
        if (count > 0) clues.push(count);
        if (clues.length === 0) clues.push(0);
        rowClues.push(clues);
    }
    
    // Cols
    for(let c=0; c<size; c++) {
        let clues = [];
        let count = 0;
        for(let r=0; r<size; r++) {
            let val = currentPuzzle.data[r * size + c];
            if (val === 1) count++;
            else if (count > 0) { clues.push(count); count = 0; }
        }
        if (count > 0) clues.push(count);
        if (clues.length === 0) clues.push(0);
        colClues.push(clues);
    }
}

function renderGrid() {
    let size = currentPuzzle.size;
    const container = document.getElementById('grid-container');
    container.innerHTML = '';
    
    // Grid template: 1 col for row clues + 'size' cols for grid
    container.style.gridTemplateColumns = `auto repeat(${size}, 35px)`;
    
    // Top-left corner empty
    let corner = document.createElement('div');
    corner.className = 'cell header-cell';
    container.appendChild(corner);
    
    // Top column clues
    for(let c=0; c<size; c++) {
        let cell = document.createElement('div');
        cell.className = 'cell header-cell';
        cell.innerHTML = colClues[c].join('<br>');
        container.appendChild(cell);
    }
    
    // Rows
    for(let r=0; r<size; r++) {
        // Row clue
        let rClue = document.createElement('div');
        rClue.className = 'cell header-cell';
        rClue.style.flexDirection = 'row';
        rClue.style.gap = '4px';
        rClue.innerText = rowClues[r].join(' ');
        container.appendChild(rClue);
        
        // Grid cells
        for(let c=0; c<size; c++) {
            let idx = r * size + c;
            let cell = document.createElement('div');
            cell.className = 'cell playable';
            cell.dataset.idx = idx;
            cell.style.width = '35px';
            cell.style.height = '35px';
            
            if (gridState[idx] === 1) cell.classList.add('filled');
            else if (gridState[idx] === 2) cell.classList.add('crossed');
            
            // Mouse drag logic could be added, but click is safer for simple webview
            cell.addEventListener('mousedown', () => toggleCell(idx));
            cell.addEventListener('touchstart', (e) => { e.preventDefault(); toggleCell(idx); });
            
            container.appendChild(cell);
        }
    }
}

function toggleCell(idx) {
    if (gridState[idx] === 0) {
        gridState[idx] = mode === 'fill' ? 1 : 2;
    } else if (gridState[idx] === 1) {
        gridState[idx] = mode === 'fill' ? 0 : 2;
    } else if (gridState[idx] === 2) {
        gridState[idx] = mode === 'cross' ? 0 : 1;
    }
    renderGrid();
}

document.getElementById('btn-mode-fill').addEventListener('click', (e) => {
    mode = 'fill';
    e.target.classList.add('active');
    document.getElementById('btn-mode-cross').classList.remove('active');
});

document.getElementById('btn-mode-cross').addEventListener('click', (e) => {
    mode = 'cross';
    e.target.classList.add('active');
    document.getElementById('btn-mode-fill').classList.remove('active');
});

document.getElementById('btn-hint').addEventListener('click', () => {
    if (score >= 50) {
        score -= 50;
        let size = currentPuzzle.size;
        // find a wrong or empty cell that should be filled
        let emptyFillIdxs = [];
        for(let i=0; i<size*size; i++) {
            if (currentPuzzle.data[i] === 1 && gridState[i] !== 1) {
                emptyFillIdxs.push(i);
            }
        }
        
        if (emptyFillIdxs.length > 0) {
            let randIdx = emptyFillIdxs[Math.floor(Math.random() * emptyFillIdxs.length)];
            gridState[randIdx] = 1;
            renderGrid();
            
            // highlight it briefly
            let cell = document.querySelector(`.cell[data-idx="${randIdx}"]`);
            if (cell) {
                cell.classList.add('hinted');
                setTimeout(() => cell.classList.remove('hinted'), 1000);
            }
        }
        updateUI();
    }
});

document.getElementById('btn-check').addEventListener('click', () => {
    let size = currentPuzzle.size;
    let correct = true;
    let wrongCells = [];
    
    for(let i=0; i<size*size; i++) {
        let expected = currentPuzzle.data[i];
        let actual = gridState[i] === 1 ? 1 : 0; // treat cross and empty as 0
        if (expected !== actual) {
            correct = false;
            if (gridState[i] === 1) wrongCells.push(i); // wrongly filled
        }
    }
    
    if (correct) {
        score += level * 100;
        updateUI();
        
        const msgEl = document.getElementById('msg-overlay');
        msgEl.innerText = "CORRECT!";
        msgEl.style.color = "var(--success)";
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
            if (level >= 8) {
                endGame(true);
            } else {
                postMsg("LEVEL_COMPLETE", { score, coins: 15 });
                showLevelCompleteModal(() => {
                    level++;
                    startLevel();
                });
            }
        }, 1500);
    } else {
        lives--;
        score = Math.max(0, score - 20);
        updateUI();
        
        // flash wrong cells
        wrongCells.forEach(idx => {
            let cell = document.querySelector(`.cell[data-idx="${idx}"]`);
            if (cell) {
                cell.classList.add('wrong');
                setTimeout(() => cell.classList.remove('wrong'), 800);
            }
        });
        
        if (lives <= 0) {
            setTimeout(() => endGame(false), 1000);
        }
    }
});

function updateUI() {
    document.getElementById('val-level').innerText = level;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-lives').innerText = lives;
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'Puzzle Master!' : 'Game Over';
    document.getElementById('val-final-score').innerText = score;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 50 });
    } else {
        postMsg("GAME_OVER", { score });
    }
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


// --- SKIP LEVEL INJECTION ---
window.addEventListener('DOMContentLoaded', () => {
    const actionsArea = document.querySelector('.actions-area') || document.querySelector('.header') || document.getElementById('screen-game');
    if (!actionsArea) return;
    
    const skipBtn = document.createElement('button');
    skipBtn.id = 'btn-ff-skip';
    skipBtn.className = 'btn-sm';
    skipBtn.style.backgroundColor = '#8b5cf6';
    skipBtn.style.color = '#fff';
    skipBtn.style.marginLeft = '10px';
    skipBtn.innerText = '⏭️ Skip (50)';
    
    skipBtn.addEventListener('click', () => {
        if (window.FFRewards) {
            window.FFRewards.showSpendConfirm({
                title: "Skip Level?",
                message: "Use 50 coins or a Skip Token to skip this level?",
                cost: 50,
                itemId: "skip_level",
                onConfirm: (success) => {
                    if (success) {
                        // Trigger level complete directly
                        if (typeof score !== 'undefined') score += 10;
                        postMsg("LEVEL_COMPLETE", { score: (typeof score !== 'undefined' ? score : 10), coins: 0 }); // 0 coins since they skipped
                        if (typeof showLevelCompleteModal === 'function') {
                            showLevelCompleteModal(() => {
                                // Find how this game goes to next level
                                if (typeof currentLevel !== 'undefined') currentLevel++;
                                else if (typeof level !== 'undefined') level++;
                                
                                if (typeof initGame === 'function' && slug === 'escape-room-mini') {
                                    // custom for escape-room-mini
                                    loadRoom(currentRoom + 1);
                                } else if (typeof loadRound === 'function') {
                                    loadRound();
                                } else if (typeof startLevel === 'function') {
                                    startLevel();
                                } else if (typeof initGame === 'function') {
                                    initGame();
                                }
                            });
                        }
                    }
                }
            });
        }
    });
    
    if (actionsArea.id === 'screen-game') {
        // Fallback
        actionsArea.appendChild(skipBtn);
    } else {
        actionsArea.appendChild(skipBtn);
    }
});
