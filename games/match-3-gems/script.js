const slug = "match-3-gems";

const GEMS = ["💎", "❤️", "⭐", "🔮", "🍀", "🔥"];
const SIZE = 8;
let grid = [];
let score = 0;
let level = 1;
let moves = 30;
let targetScore = 1000;

let selectedGem = null;
let isAnimating = false;

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
    moves = 30;
    targetScore = 1000;
    postMsg("GAME_START");
    startLevel();
    showScreen('game');
}

function startLevel() {
    document.getElementById('val-level').innerText = level;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-target').innerText = targetScore;
    document.getElementById('val-moves').innerText = moves;
    
    grid = [];
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    
    for(let r=0; r<SIZE; r++) {
        grid[r] = [];
        for(let c=0; c<SIZE; c++) {
            let type = getRandomGem(r, c);
            grid[r][c] = { type, el: createGemElement(r, c, type) };
            cont.appendChild(grid[r][c].el);
        }
    }
    
    setTimeout(resolveMatches, 500); // clear initial matches without using moves
}

function getRandomGem(r, c) {
    let type;
    do {
        type = GEMS[Math.floor(Math.random() * GEMS.length)];
    } while (
        (r >= 2 && grid[r-1] && grid[r-2] && grid[r-1][c].type === type && grid[r-2][c].type === type) ||
        (c >= 2 && grid[r] && grid[r][c-1].type === type && grid[r][c-2].type === type)
    );
    return type;
}

function createGemElement(r, c, type) {
    let div = document.createElement('div');
    div.className = 'gem';
    div.innerText = type;
    div.dataset.r = r;
    div.dataset.c = c;
    
    // Tap to select logic
    div.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (isAnimating) return;
        
        if (!selectedGem) {
            selectedGem = { r, c, el: div };
            div.classList.add('selected');
        } else {
            let dr = Math.abs(selectedGem.r - r);
            let dc = Math.abs(selectedGem.c - c);
            
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                // Adjacent, attempt swap
                swapGems(selectedGem.r, selectedGem.c, r, c);
            } else {
                // Not adjacent, reselect
                selectedGem.el.classList.remove('selected');
                selectedGem = { r, c, el: div };
                div.classList.add('selected');
            }
        }
    });
    
    return div;
}

function updateElementPositions() {
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            if(grid[r][c] && grid[r][c].el) {
                grid[r][c].el.dataset.r = r;
                grid[r][c].el.dataset.c = c;
            }
        }
    }
}

async function swapGems(r1, c1, r2, c2) {
    if (isAnimating) return;
    isAnimating = true;
    
    selectedGem.el.classList.remove('selected');
    selectedGem = null;
    
    // Swap in data array
    let temp = grid[r1][c1];
    grid[r1][c1] = grid[r2][c2];
    grid[r2][c2] = temp;
    
    // Visual swap (simple dom re-render for MVP)
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    updateElementPositions();
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            cont.appendChild(grid[r][c].el);
        }
    }
    
    // Check matches
    let matches = findMatches();
    if (matches.length > 0) {
        moves--;
        document.getElementById('val-moves').innerText = moves;
        await resolveMatches();
    } else {
        // Swap back
        setTimeout(() => {
            let t = grid[r1][c1];
            grid[r1][c1] = grid[r2][c2];
            grid[r2][c2] = t;
            
            cont.innerHTML = '';
            updateElementPositions();
            for(let r=0; r<SIZE; r++) {
                for(let c=0; c<SIZE; c++) {
                    cont.appendChild(grid[r][c].el);
                }
            }
            isAnimating = false;
        }, 300);
    }
}

function findMatches() {
    let matches = [];
    
    // Horizontal
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE - 2; c++) {
            let type = grid[r][c].type;
            if (type && type === grid[r][c+1].type && type === grid[r][c+2].type) {
                matches.push({r, c});
                matches.push({r, c:c+1});
                matches.push({r, c:c+2});
            }
        }
    }
    // Vertical
    for (let c = 0; c < SIZE; c++) {
        for (let r = 0; r < SIZE - 2; r++) {
            let type = grid[r][c].type;
            if (type && type === grid[r+1][c].type && type === grid[r+2][c].type) {
                matches.push({r, c});
                matches.push({r:r+1, c});
                matches.push({r:r+2, c});
            }
        }
    }
    
    // Deduplicate
    let unique = [];
    let set = new Set();
    matches.forEach(m => {
        let key = `${m.r}_${m.c}`;
        if (!set.has(key)) {
            set.add(key);
            unique.push(m);
        }
    });
    return unique;
}

async function resolveMatches(combo = 1) {
    isAnimating = true;
    let matches = findMatches();
    
    if (matches.length === 0) {
        isAnimating = false;
        checkWinLose();
        return;
    }
    
    // Mark for deletion visually
    matches.forEach(m => {
        grid[m.r][m.c].el.classList.add('hidden');
    });
    
    score += (matches.length * 10 * combo);
    document.getElementById('val-score').innerText = score;
    postMsg("SCORE_UPDATE", { score });
    
    await new Promise(r => setTimeout(r, 300));
    
    // Remove and drop
    for (let c = 0; c < SIZE; c++) {
        for (let r = SIZE - 1; r >= 0; r--) {
            if (matches.find(m => m.r === r && m.c === c)) {
                // Found a hole, drop everything above it
                for (let k = r; k >= 0; k--) {
                    if (k === 0) {
                        grid[k][c] = { type: null, el: null };
                    } else {
                        grid[k][c] = grid[k-1][c];
                    }
                }
                r++; // Recheck this row as something just fell into it
            }
        }
    }
    
    // Fill empty tops
    for (let c = 0; c < SIZE; c++) {
        for (let r = 0; r < SIZE; r++) {
            if (!grid[r][c] || !grid[r][c].type) {
                let type = GEMS[Math.floor(Math.random() * GEMS.length)];
                grid[r][c] = { type, el: createGemElement(r, c, type) };
            }
        }
    }
    
    // Rerender
    const cont = document.getElementById('grid-container');
    cont.innerHTML = '';
    updateElementPositions();
    for(let r=0; r<SIZE; r++) {
        for(let c=0; c<SIZE; c++) {
            cont.appendChild(grid[r][c].el);
        }
    }
    
    await new Promise(r => setTimeout(r, 400));
    resolveMatches(combo + 1); // Check chain reaction
}

function checkWinLose() {
    if (score >= targetScore) {
        if (level >= 5) {
            endGame(true);
        } else {
            postMsg("LEVEL_COMPLETE", { score, coins: 10 });
            level++;
            targetScore = Math.floor(targetScore * 1.8);
            moves += 15;
            startLevel();
        }
    } else if (moves <= 0) {
        endGame(false);
    }
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'You Won!' : 'Out of Moves!';
    document.getElementById('val-final-score').innerText = score;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 50 });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
