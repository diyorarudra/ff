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
                showLevelCompleteModal(() => {
                    loadLevel();
                });
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
    if (window.FFRewards) {
        if (typeof hints !== 'undefined' && hints > 0) {
            // let normal logic run
        } else {
            window.FFRewards.showSpendConfirm({
                title: "Use Hint?",
                message: "Use 20 coins for a hint?",
                cost: 20,
                itemId: "hint_pack",
                onConfirm: (success) => {
                    if (success) {
                        if (typeof hints !== 'undefined') hints++; 
                        ffOriginalHintLogic();
                    }
                }
            });
            return;
        }
    }
    ffOriginalHintLogic();
});

function ffOriginalHintLogic() {

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

}


function endGame() {
    showScreen('end');
    document.getElementById('val-final-score').innerText = score;
    postMsg("GAME_COMPLETE", { score, coins: 25 });
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
