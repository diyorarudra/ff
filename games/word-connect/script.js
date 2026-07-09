const slug = "word-connect";

const levels = [
    { letters: ['A', 'R', 'T'], words: ['ART', 'RAT', 'TAR'] },
    { letters: ['E', 'A', 'T', 'M'], words: ['MEAT', 'TEAM', 'MATE', 'TAME', 'EAT', 'MAT', 'TEA'] },
    { letters: ['O', 'D', 'G'], words: ['DOG', 'GOD', 'GO'] },
    { letters: ['P', 'L', 'A', 'Y'], words: ['PLAY', 'PAL', 'LAP', 'PAY'] },
    { letters: ['S', 'T', 'A', 'R'], words: ['STAR', 'ARTS', 'RATS', 'TAR', 'ART'] }
];

let currentLevelIdx = 0;
let score = 0;
let foundWords = [];
let currentInput = "";
let currentLevelData = null;

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
    foundWords = [];
    postMsg("GAME_START");
    loadLevel();
    showScreen('game');
}

function loadLevel() {
    currentLevelData = JSON.parse(JSON.stringify(levels[currentLevelIdx]));
    foundWords = [];
    currentInput = "";
    
    document.getElementById('val-level').innerText = currentLevelIdx + 1;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-total').innerText = currentLevelData.words.length;
    document.getElementById('val-found').innerText = 0;
    
    renderSlots();
    renderLetters();
    updateInputDisplay();
}

function renderSlots() {
    const wrap = document.getElementById('word-slots');
    wrap.innerHTML = currentLevelData.words.sort((a,b)=>a.length-b.length).map(word => {
        const isFound = foundWords.includes(word);
        const slots = word.split('').map(char => 
            `<div class="slot ${isFound ? 'revealed' : ''}">${isFound ? char : ''}</div>`
        ).join('');
        return `<div class="word-row">${slots}</div>`;
    }).join('');
}

function renderLetters() {
    const wrap = document.getElementById('letters-wheel');
    wrap.innerHTML = currentLevelData.letters.map(char => 
        `<div class="letter-node" data-char="${char}">${char}</div>`
    ).join('');
    
    document.querySelectorAll('.letter-node').forEach(node => {
        node.addEventListener('click', () => {
            currentInput += node.dataset.char;
            updateInputDisplay();
        });
    });
}

function updateInputDisplay() {
    document.getElementById('current-input').innerText = currentInput;
}

document.getElementById('btn-clear').addEventListener('click', () => {
    currentInput = "";
    updateInputDisplay();
});

document.getElementById('btn-submit').addEventListener('click', () => {
    const fb = document.getElementById('feedback');
    if (!currentInput) return;
    
    if (currentLevelData.words.includes(currentInput) && !foundWords.includes(currentInput)) {
        foundWords.push(currentInput);
        score += (currentInput.length * 10);
        document.getElementById('val-score').innerText = score;
        document.getElementById('val-found').innerText = foundWords.length;
        
        postMsg("SCORE_UPDATE", { score });
        renderSlots();
        fb.className = 'feedback-text success';
        fb.innerText = 'Found!';
        
        if (foundWords.length === currentLevelData.words.length) {
            setTimeout(() => {
                currentLevelIdx++;
                if (currentLevelIdx >= levels.length) {
                    endGame();
                } else {
                    postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                    loadLevel();
                }
            }, 1000);
        }
    } else if (foundWords.includes(currentInput)) {
        fb.className = 'feedback-text warning';
        fb.innerText = 'Already found!';
    } else {
        fb.className = 'feedback-text error';
        fb.innerText = 'Not in word list!';
    }
    
    currentInput = "";
    updateInputDisplay();
    setTimeout(() => fb.innerText = '', 1500);
});

document.getElementById('btn-shuffle').addEventListener('click', () => {
    currentLevelData.letters.sort(() => Math.random() - 0.5);
    renderLetters();
});

document.getElementById('btn-hint').addEventListener('click', () => {
    const missing = currentLevelData.words.find(w => !foundWords.includes(w));
    if (missing) {
        foundWords.push(missing);
        score = Math.max(0, score - 5); // penalty for hint
        document.getElementById('val-score').innerText = score;
        document.getElementById('val-found').innerText = foundWords.length;
        renderSlots();
        
        if (foundWords.length === currentLevelData.words.length) {
            setTimeout(() => {
                currentLevelIdx++;
                if (currentLevelIdx >= levels.length) endGame();
                else loadLevel();
            }, 1000);
        }
    }
});

function endGame() {
    showScreen('end');
    document.getElementById('val-final-score').innerText = score;
    postMsg("GAME_COMPLETE", { score, coins: 25 });
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
