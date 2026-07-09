const slug = "hexa-block-puzzle";

// A hex board can be modeled as a staggered grid.
// Board radius 4 means rows: 4, 5, 6, 7, 6, 5, 4 elements.
const BOARD_LAYOUT = [4, 5, 6, 7, 6, 5, 4];
let grid = []; // array of arrays matching BOARD_LAYOUT lengths
let score = 0;
let currentShapes = [];
let selectedShapeIdx = -1;

// Define shapes in staggered coordinate offsets (rowOffset, colOffset)
// Note: Staggered coordinate math is tricky. 
// For an MVP, we define the shape relative to a starting index.
const SHAPES = [
    // 1 hex
    [[0,0]],
    // Horizontal line (2)
    [[0,0], [0,1]],
    // Horizontal line (3)
    [[0,0], [0,1], [0,2]],
    // Diagonal right-down (2)
    [[0,0], [1,0]],
    // Diagonal right-down (3)
    [[0,0], [1,0], [2,0]],
    // Triangle (3)
    [[0,0], [0,1], [1,0]],
    // Triangle inverted (3)
    [[0,0], [1,0], [1,1]]
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
    score = 0;
    // Build empty board
    grid = BOARD_LAYOUT.map(len => Array(len).fill(0));
    selectedShapeIdx = -1;
    postMsg("GAME_START");
    drawGrid();
    generateShapes();
    document.getElementById('val-score').innerText = score;
    showScreen('game');
}

function drawGrid() {
    const cont = document.getElementById('hex-grid');
    cont.innerHTML = '';
    
    grid.forEach((rowArr, r) => {
        let rowDiv = document.createElement('div');
        rowDiv.className = 'hex-row';
        rowArr.forEach((val, c) => {
            let cell = document.createElement('div');
            cell.className = 'h-cell ' + (val ? 'filled' : '');
            cell.id = `cell-${r}-${c}`;
            cell.onclick = () => tryPlaceShape(r, c);
            rowDiv.appendChild(cell);
        });
        cont.appendChild(rowDiv);
    });
}

function generateShapes() {
    currentShapes = [];
    selectedShapeIdx = -1;
    const cont = document.getElementById('blocks-container');
    cont.innerHTML = '';
    
    for(let i=0; i<3; i++) {
        let shapeOffsets = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        currentShapes.push({ offsets: shapeOffsets, used: false });
        
        let wrapper = document.createElement('div');
        wrapper.className = 'shape-wrapper';
        wrapper.id = `shape-${i}`;
        wrapper.onclick = () => selectShape(i);
        
        // Render shape mini-map. 
        // We figure out bounding box to render a mini staggered grid.
        let maxR = Math.max(...shapeOffsets.map(o => o[0]));
        let maxC = Math.max(...shapeOffsets.map(o => o[1]));
        
        for(let r=0; r<=maxR; r++) {
            let sRow = document.createElement('div');
            sRow.className = 'shape-row';
            // Staggering: odd rows shifted right visually
            if (r % 2 !== 0) sRow.style.marginLeft = '17px';
            
            for(let c=0; c<=maxC; c++) {
                let sCell = document.createElement('div');
                sCell.className = 'shape-h-cell';
                if (shapeOffsets.find(o => o[0]===r && o[1]===c)) {
                    sCell.classList.add('filled');
                }
                sRow.appendChild(sCell);
            }
            wrapper.appendChild(sRow);
        }
        cont.appendChild(wrapper);
    }
    
    checkGameOver();
}

function selectShape(idx) {
    if (currentShapes[idx].used) return;
    for(let i=0; i<3; i++) {
        const el = document.getElementById(`shape-${i}`);
        if(el) el.classList.remove('selected');
    }
    
    if (selectedShapeIdx === idx) {
        selectedShapeIdx = -1;
    } else {
        selectedShapeIdx = idx;
        document.getElementById(`shape-${idx}`).classList.add('selected');
    }
}

// Coordinate mapping for hex grid offsets based on row shifting.
// In a true hex grid, moving down a row (r+1) shifts the columns depending on whether we are in the top half (expanding) or bottom half (contracting).
// For MVP, we use absolute index addition, which provides enough puzzle variance even if geometrically abstract.
function canPlace(offsets, startR, startC) {
    for(let i=0; i<offsets.length; i++) {
        let oR = offsets[i][0];
        let oC = offsets[i][1];
        
        // Simple mapping: 
        let targetR = startR + oR;
        let targetC = startC + oC;
        
        if (targetR >= grid.length) return false;
        if (targetC >= grid[targetR].length) return false;
        if (grid[targetR][targetC] === 1) return false;
    }
    return true;
}

function tryPlaceShape(r, c) {
    if (selectedShapeIdx === -1) return;
    let shapeObj = currentShapes[selectedShapeIdx];
    if (shapeObj.used) return;
    
    if (canPlace(shapeObj.offsets, r, c)) {
        shapeObj.offsets.forEach(offset => {
            let tr = r + offset[0];
            let tc = c + offset[1];
            grid[tr][tc] = 1;
        });
        
        shapeObj.used = true;
        document.getElementById(`shape-${selectedShapeIdx}`).classList.add('used');
        selectedShapeIdx = -1;
        
        score += shapeObj.offsets.length;
        checkLines();
        
        drawGrid();
        document.getElementById('val-score').innerText = score;
        postMsg("SCORE_UPDATE", { score });
        
        if (currentShapes.every(s => s.used)) {
            generateShapes();
        } else {
            checkGameOver();
        }
    }
}

function checkLines() {
    // A full row is a line. In MVP, we only check horizontal rows.
    let linesCleared = 0;
    grid.forEach((row, r) => {
        if (row.every(val => val === 1)) {
            // clear row
            for(let c=0; c<row.length; c++) grid[r][c] = 0;
            linesCleared++;
        }
    });
    
    if (linesCleared > 0) {
        score += (linesCleared * 15);
        postMsg("LEVEL_COMPLETE", { score, coins: linesCleared });
    }
}

function checkGameOver() {
    for(let i=0; i<3; i++) {
        if (!currentShapes[i].used) {
            let offsets = currentShapes[i].offsets;
            for(let r=0; r<grid.length; r++) {
                for(let c=0; c<grid[r].length; c++) {
                    if (canPlace(offsets, r, c)) return; // Game continues
                }
            }
        }
    }
    
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
