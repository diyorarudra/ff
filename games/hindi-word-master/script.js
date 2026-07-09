const slug = "hindi-word-master";

const words = [
    { w: "कमल", h: "एक फूल (Lotus)" },
    { w: "किताब", h: "पढ़ने की वस्तु (Book)" },
    { w: "पानी", h: "जल (Water)" },
    { w: "स्कूल", h: "विद्यालय (School)" },
    { w: "परिवार", h: "कुटुंब (Family)" },
    { w: "बाजार", h: "जहाँ सामान बिकता है (Market)" },
    { w: "समय", h: "वक्त (Time)" },
    { w: "मेहनत", h: "परिश्रम (Hard work)" },
    { w: "खेल", h: "क्रीड़ा (Sport)" },
    { w: "भारत", h: "हमारा देश (India)" },
    { w: "आकाश", h: "गगन (Sky)" },
    { w: "दोस्त", h: "मित्र (Friend)" }
];

let currentRound = 1;
let score = 0;
let lives = 3;
let currentWordObj = null;
let currentScrambled = "";
let hintsUsed = 0;

const screens = {
    start: document.getElementById('screen-start'),
    game: document.getElementById('screen-game'),
    end: document.getElementById('screen-end')
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

function scrambleHindi(word) {
    // Basic array split for simple words. For complex matras, it might visually separate them, which makes it challenging!
    let arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const res = arr.join(' ');
    return res;
}

function updateUI() {
    document.getElementById('val-round').innerText = currentRound;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-lives').innerText = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
}

function postMsg(type, extra = {}) {
    window.parent.postMessage({ type, gameSlug: slug, ...extra }, "*");
}

function initGame() {
    currentRound = 1;
    score = 0;
    lives = 3;
    postMsg("GAME_START");
    loadRound();
    showScreen('game');
}

function loadRound() {
    currentWordObj = words[Math.floor(Math.random() * words.length)];
    currentScrambled = scrambleHindi(currentWordObj.w);
    hintsUsed = 0;
    
    document.getElementById('scrambled-word').innerText = currentScrambled;
    document.getElementById('word-input').value = '';
    document.getElementById('word-input').focus();
    document.getElementById('hint-display').classList.add('hidden');
    document.getElementById('feedback').innerText = '';
    
    updateUI();
}

function checkAnswer() {
    const input = document.getElementById('word-input').value.trim();
    const fb = document.getElementById('feedback');
    
    if (input === currentWordObj.w) {
        score += (100 - (hintsUsed * 30));
        fb.className = 'feedback-text success';
        fb.innerText = 'Correct! सही जवाब!';
        
        postMsg("SCORE_UPDATE", { score });
        
        setTimeout(() => {
            currentRound++;
            if (currentRound > 10) {
                endGame(true);
            } else {
                postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                loadRound();
            }
        }, 1200);
    } else {
        lives--;
        fb.className = 'feedback-text error';
        fb.innerText = 'Wrong! गलत!';
        updateUI();
        
        if (lives <= 0) {
            setTimeout(() => endGame(false), 1200);
        } else {
            setTimeout(() => fb.innerText = '', 1200);
        }
    }
}

function showHint() {
    hintsUsed++;
    const hintEl = document.getElementById('hint-display');
    hintEl.innerText = "Hint: " + currentWordObj.h;
    hintEl.classList.remove('hidden');
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'You Win! बधाई हो!' : 'Game Over! खेल समाप्त!';
    document.getElementById('val-final-score').innerText = score;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 20 });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
document.getElementById('btn-submit').addEventListener('click', checkAnswer);
document.getElementById('btn-hint').addEventListener('click', showHint);
document.getElementById('word-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') checkAnswer();
});
