const slug = "color-sort-puzzle";

let level = 1;
let moves = 0;
let tubes = [];
let history = [];
let selectedTube = -1;
const TUBE_CAPACITY = 4;

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
    postMsg("GAME_START");
    startLevel();
    showScreen('game');
}

function startLevel() {
    moves = 0;
    history = [];
    selectedTube = -1;
    generateLevel(level);
    updateUI();
    renderTubes();
}

function generateLevel(lvl) {
    // Determine colors and tubes based on level
    let numColors = Math.min(3 + Math.floor(lvl / 2), 7);
    let numTubes = numColors + 2; // Always 2 empty tubes
    
    // Create an array of blocks (4 of each color)
    let blocks = [];
    for(let c=1; c<=numColors; c++) {
        for(let i=0; i<TUBE_CAPACITY; i++) blocks.push(c);
    }
    
    // Shuffle blocks
    for(let i=blocks.length-1; i>0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    }
    
    // Distribute into tubes
    tubes = [];
    let bIdx = 0;
    for(let i=0; i<numTubes; i++) {
        let t = [];
        if (i < numColors) {
            for(let j=0; j<TUBE_CAPACITY; j++) {
                t.push(blocks[bIdx++]);
            }
        }
        tubes.push(t);
    }
}

function renderTubes() {
    const container = document.getElementById('tubes-container');
    container.innerHTML = '';
    
    tubes.forEach((tData, idx) => {
        let tEl = document.createElement('div');
        tEl.className = 'tube';
        if (idx === selectedTube) tEl.classList.add('selected');
        
        tData.forEach(colorVal => {
            let bEl = document.createElement('div');
            bEl.className = `block color-${colorVal}`;
            tEl.appendChild(bEl);
        });
        
        tEl.addEventListener('click', () => handleTubeClick(idx));
        container.appendChild(tEl);
    });
    
    document.getElementById('btn-undo').disabled = history.length === 0;
}

function handleTubeClick(idx) {
    if (selectedTube === -1) {
        // Select source
        if (tubes[idx].length > 0) {
            let isComplete = isTubeComplete(idx);
            if (!isComplete) {
                selectedTube = idx;
                renderTubes();
            }
        }
    } else {
        // We have a source, select destination
        if (idx === selectedTube) {
            // Deselect
            selectedTube = -1;
            renderTubes();
        } else {
            // Try to move
            let src = tubes[selectedTube];
            let dst = tubes[idx];
            
            let colorToMove = src[src.length - 1];
            
            if (dst.length < TUBE_CAPACITY && (dst.length === 0 || dst[dst.length-1] === colorToMove)) {
                // valid move
                // Save state to history for undo
                history.push(JSON.parse(JSON.stringify(tubes)));
                
                let countToMove = 0;
                for(let i=src.length-1; i>=0; i--) {
                    if (src[i] === colorToMove) countToMove++;
                    else break;
                }
                
                // cap by dst space
                let space = TUBE_CAPACITY - dst.length;
                let movedCount = Math.min(countToMove, space);
                
                for(let i=0; i<movedCount; i++) {
                    dst.push(src.pop());
                }
                
                moves++;
                updateUI();
                selectedTube = -1;
                renderTubes();
                
                checkWin();
            } else {
                // Invalid move, just deselect
                selectedTube = -1;
                renderTubes();
            }
        }
    }
}

function isTubeComplete(idx) {
    let t = tubes[idx];
    if (t.length === 0) return false;
    if (t.length < TUBE_CAPACITY) return false;
    let c = t[0];
    for(let i=1; i<t.length; i++) {
        if(t[i] !== c) return false;
    }
    return true;
}

function checkWin() {
    let completeCount = 0;
    let emptyCount = 0;
    for(let i=0; i<tubes.length; i++) {
        if (tubes[i].length === 0) emptyCount++;
        else if (isTubeComplete(i)) completeCount++;
    }
    
    // Win if all tubes are either empty or complete
    if (completeCount + emptyCount === tubes.length) {
        const msgEl = document.getElementById('msg-overlay');
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
            if (level === 10) {
                endGame();
            } else {
                postMsg("LEVEL_COMPLETE", { score: level * 10, coins: 15 });
                level++;
                startLevel();
            }
        }, 1500);
    }
}

function updateUI() {
    document.getElementById('val-level').innerText = level;
    document.getElementById('val-moves').innerText = moves;
}

function endGame() {
    showScreen('end');
    postMsg("GAME_COMPLETE", { score: 100, coins: 50 });
}

document.getElementById('btn-undo').addEventListener('click', () => {
    if (history.length > 0) {
        tubes = history.pop();
        moves++;
        updateUI();
        selectedTube = -1;
        renderTubes();
    }
});

document.getElementById('btn-reset-level').addEventListener('click', () => {
    if (history.length > 0) {
        tubes = history[0]; // first state
        history = [];
        moves++;
        updateUI();
        selectedTube = -1;
        renderTubes();
    }
});

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
