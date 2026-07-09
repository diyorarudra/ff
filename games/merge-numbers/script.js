const slug = "merge-numbers";

const SIZE = 4;
let grid = [];
let score = 0;
let bestTile = 2;
let hasReachedTarget = false;
let milestones = [128, 256, 512, 1024];

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
    bestTile = 2;
    hasReachedTarget = false;
    milestones = [128, 256, 512, 1024];
    grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
    
    postMsg("GAME_START");
    addRandomTile();
    addRandomTile();
    updateUI();
    showScreen('game');
}

function addRandomTile() {
    let emptyCells = [];
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            if (grid[r][c] === 0) emptyCells.push({r, c});
        }
    }
    if (emptyCells.length > 0) {
        let cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function updateUI() {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    
    let currentBest = 2;
    
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            let val = grid[r][c];
            let cell = document.createElement('div');
            cell.className = 'cell';
            if (val > 0) {
                cell.innerText = val;
                cell.dataset.val = val;
                if (val > currentBest) currentBest = val;
            }
            cont.appendChild(cell);
        }
    }
    
    bestTile = currentBest;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-best').innerText = bestTile;
    
    // Check milestones
    if (milestones.length > 0 && bestTile >= milestones[0]) {
        let reached = milestones.shift();
        postMsg("LEVEL_COMPLETE", { score, coins: 20 });
    }
}

function move(direction) {
    let moved = false;
    
    // Copy grid to check if changed
    let oldGrid = JSON.stringify(grid);
    
    // Rotate grid so we always slide "left"
    let workingGrid = cloneGrid(grid);
    
    if (direction === 'up') workingGrid = rotateLeft(workingGrid);
    else if (direction === 'right') workingGrid = rotateRight(rotateRight(workingGrid));
    else if (direction === 'down') workingGrid = rotateRight(workingGrid);
    
    // Slide and merge left
    for(let r=0; r<SIZE; r++) {
        let row = workingGrid[r].filter(v => v !== 0);
        for(let i=0; i<row.length - 1; i++) {
            if (row[i] === row[i+1]) {
                row[i] *= 2;
                score += row[i];
                row[i+1] = 0;
            }
        }
        row = row.filter(v => v !== 0);
        while(row.length < SIZE) row.push(0);
        workingGrid[r] = row;
    }
    
    // Rotate back
    if (direction === 'up') workingGrid = rotateRight(workingGrid);
    else if (direction === 'right') workingGrid = rotateRight(rotateRight(workingGrid));
    else if (direction === 'down') workingGrid = rotateLeft(workingGrid);
    
    grid = workingGrid;
    
    if (JSON.stringify(grid) !== oldGrid) {
        addRandomTile();
        updateUI();
        postMsg("SCORE_UPDATE", { score });
        
        if (checkGameOver()) {
            endGame();
        }
    }
}

function cloneGrid(g) {
    return JSON.parse(JSON.stringify(g));
}

function rotateLeft(g) {
    let newGrid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            newGrid[SIZE - 1 - c][r] = g[r][c];
        }
    }
    return newGrid;
}

function rotateRight(g) {
    let newGrid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            newGrid[c][SIZE - 1 - r] = g[r][c];
        }
    }
    return newGrid;
}

function checkGameOver() {
    // Any empty?
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            if (grid[r][c] === 0) return false;
        }
    }
    // Any merges possible?
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            let val = grid[r][c];
            if (r < SIZE-1 && grid[r+1][c] === val) return false;
            if (c < SIZE-1 && grid[r][c+1] === val) return false;
        }
    }
    return true;
}

function endGame() {
    showScreen('end');
    document.getElementById('end-title').innerText = bestTile >= 1024 ? 'Target Reached!' : 'Game Over';
    document.getElementById('val-final-score').innerText = score;
    postMsg("GAME_COMPLETE", { score, coins: bestTile >= 1024 ? 50 : 10 });
}

// Touch/Swipe controls
let touchStartX = 0;
let touchStartY = 0;
document.getElementById('grid-container').addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: true});

document.getElementById('grid-container').addEventListener('touchend', e => {
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    
    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) {
            if (dx > 0) move('right');
            else move('left');
        }
    } else {
        if (Math.abs(dy) > 30) {
            if (dy > 0) move('down');
            else move('up');
        }
    }
}, {passive: true});

// Button controls
document.getElementById('btn-up').addEventListener('click', () => move('up'));
document.getElementById('btn-down').addEventListener('click', () => move('down'));
document.getElementById('btn-left').addEventListener('click', () => move('left'));
document.getElementById('btn-right').addEventListener('click', () => move('right'));

// Keyboard
window.addEventListener('keydown', e => {
    if (screens.game.classList.contains('active')) {
        if (e.key === 'ArrowUp') move('up');
        else if (e.key === 'ArrowDown') move('down');
        else if (e.key === 'ArrowLeft') move('left');
        else if (e.key === 'ArrowRight') move('right');
    }
});

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
