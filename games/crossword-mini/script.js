const slug = "crossword-mini";

const levels = [
    {
        gridSize: 5,
        words: [
            { id: 1, word: "CAT", dir: "H", row: 0, col: 0, clue: "A small domesticated carnivorous mammal." },
            { id: 2, word: "CAR", dir: "V", row: 0, col: 0, clue: "A four-wheeled road vehicle." },
            { id: 3, word: "TEA", dir: "H", row: 2, col: 0, clue: "A hot drink made by infusing dried, crushed leaves." },
            { id: 4, word: "ART", dir: "V", row: 0, col: 1, clue: "Expression of creative skill." }
        ]
    },
    {
        gridSize: 5,
        words: [
            { id: 1, word: "DOG", dir: "H", row: 0, col: 1, clue: "Man's best friend." },
            { id: 2, word: "DAY", dir: "V", row: 0, col: 1, clue: "Opposite of night." },
            { id: 3, word: "YES", dir: "H", row: 2, col: 1, clue: "Opposite of no." },
            { id: 4, word: "SUN", dir: "V", row: 2, col: 3, clue: "The star around which the earth orbits." }
        ]
    },
    {
        gridSize: 5,
        words: [
            { id: 1, word: "BIRD", dir: "H", row: 1, col: 0, clue: "Feathered flying creature." },
            { id: 2, word: "BLUE", dir: "V", row: 1, col: 0, clue: "Color of the sky." },
            { id: 3, word: "RED", dir: "H", row: 4, col: 0, clue: "Color of blood." }
        ]
    },
    {
        gridSize: 5,
        words: [
            { id: 1, word: "FISH", dir: "H", row: 0, col: 0, clue: "Aquatic animal with gills." },
            { id: 2, word: "FIRE", dir: "V", row: 0, col: 0, clue: "Combustion producing heat and light." },
            { id: 3, word: "STAR", dir: "H", row: 2, col: 0, clue: "Luminous point in the night sky." }
        ]
    },
    {
        gridSize: 6,
        words: [
            { id: 1, word: "WATER", dir: "H", row: 0, col: 0, clue: "H2O liquid." },
            { id: 2, word: "WOOD", dir: "V", row: 0, col: 0, clue: "Material from trees." },
            { id: 3, word: "TREE", dir: "H", row: 2, col: 0, clue: "A woody perennial plant." },
            { id: 4, word: "ROAD", dir: "V", row: 0, col: 4, clue: "Wide way leading from one place to another." }
        ]
    }
];

let currentLevelIdx = 0;
let score = 0;
let lives = 3;
let currentWordObj = null;
let activeCellId = null;
let gridState = {}; // { "r_c": { letter: "", correct: false } }

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
    currentLevelIdx = 0;
    score = 0;
    lives = 3;
    postMsg("GAME_START");
    loadLevel();
    showScreen('game');
}

function loadLevel() {
    const level = levels[currentLevelIdx];
    document.getElementById('val-level').innerText = currentLevelIdx + 1;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-lives').innerText = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    document.getElementById('clue-text').innerText = "Tap a cell to select a word.";
    document.getElementById('cell-input').value = '';
    document.getElementById('feedback').innerText = '';
    
    currentWordObj = null;
    activeCellId = null;
    gridState = {};
    
    const gridEl = document.getElementById('crossword-grid');
    gridEl.style.gridTemplateColumns = `repeat(${level.gridSize}, 1fr)`;
    gridEl.innerHTML = '';
    
    // Map cells
    let cellMap = {};
    level.words.forEach(w => {
        for(let i=0; i<w.word.length; i++) {
            let r = w.row + (w.dir === 'V' ? i : 0);
            let c = w.col + (w.dir === 'H' ? i : 0);
            let key = `${r}_${c}`;
            if(!cellMap[key]) {
                cellMap[key] = { words: [], num: (i===0) ? w.id : null, target: w.word[i] };
                gridState[key] = { letter: "", correct: false, target: w.word[i] };
            } else {
                if (i===0 && !cellMap[key].num) cellMap[key].num = w.id;
            }
            cellMap[key].words.push(w);
        }
    });
    
    for(let r=0; r<level.gridSize; r++) {
        for(let c=0; c<level.gridSize; c++) {
            let key = `${r}_${c}`;
            let cellData = cellMap[key];
            let div = document.createElement('div');
            div.className = 'cell ' + (cellData ? 'filled' : 'empty');
            div.id = `cell_${key}`;
            
            if(cellData) {
                if(cellData.num) {
                    div.innerHTML += `<span class="cell-num">${cellData.num}</span>`;
                }
                div.innerHTML += `<span class="cell-letter" id="letter_${key}"></span>`;
                div.onclick = () => selectCell(key, cellData.words);
            }
            gridEl.appendChild(div);
        }
    }
}

function selectCell(key, words) {
    if (gridState[key].correct) {
        document.getElementById('cell-input').value = '';
    } else {
        document.getElementById('cell-input').value = gridState[key].letter;
    }
    document.getElementById('cell-input').focus();
    
    activeCellId = key;
    
    // Toggle between words if cell belongs to multiple
    if (currentWordObj && words.includes(currentWordObj) && words.length > 1) {
        currentWordObj = words.find(w => w !== currentWordObj);
    } else {
        currentWordObj = words[0];
    }
    
    document.getElementById('clue-text').innerText = `${currentWordObj.dir === 'H' ? 'Across' : 'Down'} ${currentWordObj.id}: ${currentWordObj.clue}`;
    
    // Highlight
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('active', 'highlight');
    });
    
    for(let i=0; i<currentWordObj.word.length; i++) {
        let r = currentWordObj.row + (currentWordObj.dir === 'V' ? i : 0);
        let c = currentWordObj.col + (currentWordObj.dir === 'H' ? i : 0);
        document.getElementById(`cell_${r}_${c}`).classList.add('highlight');
    }
    document.getElementById(`cell_${key}`).classList.add('active');
}

document.getElementById('cell-input').addEventListener('input', (e) => {
    if(!activeCellId || gridState[activeCellId].correct) return;
    let val = e.target.value.toUpperCase();
    gridState[activeCellId].letter = val;
    document.getElementById(`letter_${activeCellId}`).innerText = val;
    
    if (val) {
        // Auto move to next cell in current word
        let r = parseInt(activeCellId.split('_')[0]);
        let c = parseInt(activeCellId.split('_')[1]);
        
        let nextR = r + (currentWordObj.dir === 'V' ? 1 : 0);
        let nextC = c + (currentWordObj.dir === 'H' ? 1 : 0);
        let nextKey = `${nextR}_${nextC}`;
        
        if (gridState[nextKey] && !gridState[nextKey].correct) {
            selectCell(nextKey, [currentWordObj]);
        }
    }
});

document.getElementById('btn-check').addEventListener('click', () => {
    if (!currentWordObj) return;
    
    let isWordCorrect = true;
    let keys = [];
    
    for(let i=0; i<currentWordObj.word.length; i++) {
        let r = currentWordObj.row + (currentWordObj.dir === 'V' ? i : 0);
        let c = currentWordObj.col + (currentWordObj.dir === 'H' ? i : 0);
        let key = `${r}_${c}`;
        keys.push(key);
        if (gridState[key].letter !== gridState[key].target) {
            isWordCorrect = false;
        }
    }
    
    const fb = document.getElementById('feedback');
    if (isWordCorrect) {
        fb.className = 'feedback-text success';
        fb.innerText = 'Correct Word!';
        score += 20;
        document.getElementById('val-score').innerText = score;
        postMsg("SCORE_UPDATE", { score });
        
        keys.forEach(k => {
            gridState[k].correct = true;
            document.getElementById(`cell_${k}`).classList.add('correct');
            document.getElementById(`cell_${k}`).classList.remove('wrong');
        });
        
        checkLevelComplete();
    } else {
        fb.className = 'feedback-text error';
        fb.innerText = 'Incorrect Word!';
        lives--;
        document.getElementById('val-lives').innerText = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
        
        keys.forEach(k => {
            if(!gridState[k].correct && gridState[k].letter) {
                document.getElementById(`cell_${k}`).classList.add('wrong');
            }
        });
        
        if (lives <= 0) {
            setTimeout(() => endGame(false), 1000);
        }
    }
    setTimeout(() => fb.innerText='', 1500);
});

document.getElementById('btn-hint').addEventListener('click', () => {
    if (!activeCellId || gridState[activeCellId].correct) return;
    gridState[activeCellId].letter = gridState[activeCellId].target;
    gridState[activeCellId].correct = true;
    document.getElementById(`letter_${activeCellId}`).innerText = gridState[activeCellId].target;
    document.getElementById(`cell_${activeCellId}`).classList.add('correct');
    document.getElementById(`cell_${activeCellId}`).classList.remove('wrong');
    score = Math.max(0, score - 5);
    document.getElementById('val-score').innerText = score;
    checkLevelComplete();
});

function checkLevelComplete() {
    let allCorrect = true;
    for (let key in gridState) {
        if (!gridState[key].correct) {
            allCorrect = false;
            break;
        }
    }
    
    if (allCorrect) {
        setTimeout(() => {
            currentLevelIdx++;
            if (currentLevelIdx >= levels.length) {
                endGame(true);
            } else {
                postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                loadLevel();
            }
        }, 1000);
    }
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'Puzzle Solved!' : 'Game Over';
    document.getElementById('val-final-score').innerText = score;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 20 });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
