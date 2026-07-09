const slug = "wood-block-puzzle";

const SHAPES = [
    // 1x1
    [[1]],
    // 2x2
    [[1,1],[1,1]],
    // 3x3 block
    [[1,1,1],[1,1,1],[1,1,1]],
    // Horizontal lines
    [[1,1]], [[1,1,1]], [[1,1,1,1]], [[1,1,1,1,1]],
    // Vertical lines
    [[1],[1]], [[1],[1],[1]], [[1],[1],[1],[1]], [[1],[1],[1],[1],[1]],
    // L shapes
    [[1,0],[1,1]], [[0,1],[1,1]], [[1,1],[1,0]], [[1,1],[0,1]],
    [[1,0,0],[1,0,0],[1,1,1]], [[0,0,1],[0,0,1],[1,1,1]],
    // T shapes
    [[1,1,1],[0,1,0]], [[0,1,0],[1,1,1]], [[1,0],[1,1],[1,0]], [[0,1],[1,1],[0,1]]
];

let grid = [];
const SIZE = 8;
let score = 0;
let currentShapes = [];
let selectedShapeIdx = -1;

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
    grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
    selectedShapeIdx = -1;
    postMsg("GAME_START");
    drawGrid();
    generateShapes();
    document.getElementById('val-score').innerText = score;
    showScreen('game');
}

function drawGrid() {
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            let cell = document.createElement('div');
            cell.className = 'cell ' + (grid[r][c] ? 'filled' : '');
            cell.id = `cell-${r}-${c}`;
            // For mobile tap-to-place
            cell.onclick = () => tryPlaceShape(r, c);
            cont.appendChild(cell);
        }
    }
}

function generateShapes() {
    currentShapes = [];
    selectedShapeIdx = -1;
    const cont = document.getElementById('blocks-container');
    cont.innerHTML = '';
    
    for(let i=0; i<3; i++) {
        let shapeMatrix = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        currentShapes.push({ matrix: shapeMatrix, used: false });
        
        let wrapper = document.createElement('div');
        wrapper.className = 'shape-wrapper';
        wrapper.id = `shape-${i}`;
        wrapper.onclick = () => selectShape(i);
        
        let shapeDiv = document.createElement('div');
        shapeDiv.className = 'shape';
        shapeDiv.style.gridTemplateRows = `repeat(${shapeMatrix.length}, 15px)`;
        shapeDiv.style.gridTemplateColumns = `repeat(${shapeMatrix[0].length}, 15px)`;
        
        for(let r=0; r<shapeMatrix.length; r++) {
            for(let c=0; c<shapeMatrix[0].length; c++) {
                let sc = document.createElement('div');
                sc.className = 'shape-cell ' + (shapeMatrix[r][c] ? '' : 'empty');
                shapeDiv.appendChild(sc);
            }
        }
        wrapper.appendChild(shapeDiv);
        cont.appendChild(wrapper);
    }
    
    checkGameOver();
}

function selectShape(idx) {
    if (currentShapes[idx].used) return;
    
    // Deselect others
    for(let i=0; i<3; i++) {
        const el = document.getElementById(`shape-${i}`);
        if(el) el.classList.remove('selected');
    }
    
    if (selectedShapeIdx === idx) {
        selectedShapeIdx = -1; // toggle off
    } else {
        selectedShapeIdx = idx;
        document.getElementById(`shape-${idx}`).classList.add('selected');
    }
}

function canPlace(shapeMatrix, startR, startC) {
    for(let r=0; r<shapeMatrix.length; r++) {
        for(let c=0; c<shapeMatrix[0].length; c++) {
            if (shapeMatrix[r][c] === 1) {
                let gr = startR + r;
                let gc = startC + c;
                if (gr >= SIZE || gc >= SIZE || grid[gr][gc] === 1) {
                    return false;
                }
            }
        }
    }
    return true;
}

function tryPlaceShape(r, c) {
    if (selectedShapeIdx === -1) return;
    let shapeObj = currentShapes[selectedShapeIdx];
    if (shapeObj.used) return;
    
    if (canPlace(shapeObj.matrix, r, c)) {
        // Place it
        let blocksPlaced = 0;
        for(let sr=0; sr<shapeObj.matrix.length; sr++) {
            for(let sc=0; sc<shapeObj.matrix[0].length; sc++) {
                if (shapeObj.matrix[sr][sc] === 1) {
                    grid[r + sr][c + sc] = 1;
                    blocksPlaced++;
                }
            }
        }
        
        shapeObj.used = true;
        document.getElementById(`shape-${selectedShapeIdx}`).classList.add('used');
        selectedShapeIdx = -1;
        
        score += blocksPlaced;
        checkLines();
        
        drawGrid();
        document.getElementById('val-score').innerText = score;
        postMsg("SCORE_UPDATE", { score });
        
        // Check if need new shapes
        if (currentShapes.every(s => s.used)) {
            generateShapes();
        } else {
            checkGameOver();
        }
    }
}

function checkLines() {
    let rowsToClear = [];
    let colsToClear = [];
    
    // Check rows
    for(let r=0; r<SIZE; r++) {
        let full = true;
        for(let c=0; c<SIZE; c++) {
            if (grid[r][c] === 0) full = false;
        }
        if (full) rowsToClear.push(r);
    }
    
    // Check cols
    for(let c=0; c<SIZE; c++) {
        let full = true;
        for(let r=0; r<SIZE; r++) {
            if (grid[r][c] === 0) full = false;
        }
        if (full) colsToClear.push(c);
    }
    
    // Clear them
    rowsToClear.forEach(r => {
        for(let c=0; c<SIZE; c++) grid[r][c] = 0;
    });
    colsToClear.forEach(c => {
        for(let r=0; r<SIZE; r++) grid[r][c] = 0;
    });
    
    let lines = rowsToClear.length + colsToClear.length;
    if (lines > 0) {
        score += (lines * 10) * lines; // Combo multiplier
        postMsg("LEVEL_COMPLETE", { score, coins: lines }); // Give coins per line clear!
    }
}

function checkGameOver() {
    // Is there ANY valid placement for ANY unused shape?
    for(let i=0; i<3; i++) {
        if (!currentShapes[i].used) {
            let mat = currentShapes[i].matrix;
            for(let r=0; r<SIZE; r++) {
                for(let c=0; c<SIZE; c++) {
                    if (canPlace(mat, r, c)) return; // Game continues
                }
            }
        }
    }
    
    // If we reach here, no moves possible
    setTimeout(() => {
        showScreen('end');
        document.getElementById('val-final-score').innerText = score;
        postMsg("GAME_OVER", { score });
    }, 500);
}

document.getElementById('btn-giveup').addEventListener('click', () => {
    showScreen('end');
    document.getElementById('val-final-score').innerText = score;
    postMsg("GAME_OVER", { score });
});

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
