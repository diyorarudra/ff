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
                level++;
                startLevel();
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
