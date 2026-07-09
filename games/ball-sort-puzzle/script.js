const slug = "ball-sort-puzzle";

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
    
    // Create an array of balls (4 of each color)
    let balls = [];
    for(let c=1; c<=numColors; c++) {
        for(let i=0; i<TUBE_CAPACITY; i++) balls.push(c);
    }
    
    // Shuffle balls
    for(let i=balls.length-1; i>0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balls[i], balls[j]] = [balls[j], balls[i]];
    }
    
    // Distribute into tubes
    tubes = [];
    let bIdx = 0;
    for(let i=0; i<numTubes; i++) {
        let t = [];
        if (i < numColors) {
            for(let j=0; j<TUBE_CAPACITY; j++) {
                t.push(balls[bIdx++]);
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
            bEl.className = `ball color-${colorVal}`;
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
            // Try to move ONE ball
            let src = tubes[selectedTube];
            let dst = tubes[idx];
            
            let colorToMove = src[src.length - 1];
            
            if (dst.length < TUBE_CAPACITY && (dst.length === 0 || dst[dst.length-1] === colorToMove)) {
                // valid move
                // Save state to history for undo
                history.push(JSON.parse(JSON.stringify(tubes)));
                
                // For Ball Sort, we only move ONE ball at a time, unlike Water Sort which moves layers.
                // Or we could move all matching top balls. Standard game moves 1 if you tap, 
                // but some games move all. Let's move 1 for distinct gameplay difference.
                dst.push(src.pop());
                
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
                showLevelCompleteModal(() => {
                    level++;
                    startLevel();
                });
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
