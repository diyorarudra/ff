const slug = "daily-word-puzzle";

const words = [
    { w: "apple", h: "A red or green fruit" },
    { w: "beach", h: "Sandy shore by the ocean" },
    { w: "clock", h: "Tells time" },
    { w: "dance", h: "Move rhythmically to music" },
    { w: "eagle", h: "A large bird of prey" },
    { w: "flame", h: "Hot glowing body of ignited gas" },
    { w: "grape", h: "Small purple or green fruit" },
    { w: "heart", h: "Pumps blood" },
    { w: "igloo", h: "House made of ice" },
    { w: "jungle", h: "Dense tropical forest" },
    { w: "koala", h: "Australian marsupial" },
    { w: "lemon", h: "Sour yellow citrus fruit" },
    { w: "mango", h: "Tropical stone fruit" },
    { w: "ninja", h: "Covert agent in feudal Japan" },
    { w: "ocean", h: "Vast body of salt water" }
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

function scramble(word) {
    let arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const res = arr.join('');
    return res === word ? scramble(word) : res;
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
    currentScrambled = scramble(currentWordObj.w);
    hintsUsed = 0;
    
    document.getElementById('scrambled-word').innerText = currentScrambled;
    document.getElementById('word-input').value = '';
    document.getElementById('word-input').focus();
    document.getElementById('hint-display').classList.add('hidden');
    document.getElementById('feedback').innerText = '';
    
    updateUI();
}

function checkAnswer() {
    const input = document.getElementById('word-input').value.toLowerCase().trim();
    const fb = document.getElementById('feedback');
    
    if (input === currentWordObj.w) {
        score += (100 - (hintsUsed * 30));
        fb.className = 'feedback-text success';
        fb.innerText = 'Correct!';
        
        postMsg("SCORE_UPDATE", { score });
        
        setTimeout(() => {
            currentRound++;
            if (currentRound > 10) {
                endGame(true);
            } else {
                postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                loadRound();
            }
        }, 1000);
    } else {
        lives--;
        fb.className = 'feedback-text error';
        fb.innerText = 'Wrong!';
        updateUI();
        
        if (lives <= 0) {
            setTimeout(() => endGame(false), 1000);
        } else {
            setTimeout(() => fb.innerText = '', 1000);
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
    document.getElementById('end-title').innerText = win ? 'You Win!' : 'Game Over';
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
