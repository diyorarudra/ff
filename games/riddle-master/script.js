const slug = "riddle-master";

const words = [
    { q: "I have keys but open no doors. What am I?", w: "piano", h: "A musical instrument" },
    { q: "I have branches, but no fruit, trunk or leaves. What am I?", w: "bank", h: "A place for money" },
    { q: "What has to be broken before you can use it?", w: "egg", h: "Usually eaten for breakfast" },
    { q: "I'm tall when I'm young, and I'm short when I'm old. What am I?", w: "candle", h: "Used for light or birthdays" },
    { q: "What month of the year has 28 days?", w: "all", h: "Think about the calendar" },
    { q: "What is full of holes but still holds water?", w: "sponge", h: "Used for cleaning" },
    { q: "What goes up but never comes down?", w: "age", h: "A number related to your birth" },
    { q: "The more of this there is, the less you see. What is it?", w: "darkness", h: "Absence of light" },
    { q: "I have a tail and a head, but no body. What am I?", w: "coin", h: "Used as money" },
    { q: "What has many teeth, but can't bite?", w: "comb", h: "Used for hair" },
    { q: "What has words, but never speaks?", w: "book", h: "You read it" },
    { q: "What has a thumb and four fingers, but is not a hand?", w: "glove", h: "Worn in winter" }
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

function getQuestion(wordObj) {
    return wordObj.q;
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
    hasRevived = false;
    currentRound = 1;
    score = 0;
    lives = 3;
    postMsg("GAME_START");
    loadRound();
    showScreen('game');
}

function loadRound() {
    currentWordObj = words[Math.floor(Math.random() * words.length)];
    currentScrambled = getQuestion(currentWordObj);
    hintsUsed = 0;
    
    document.getElementById('scrambled-word').innerText = currentScrambled;
    document.getElementById('word-input').value = '';
    document.getElementById('word-input').focus();
    document.getElementById('hint-display').classList.add('hidden');
    document.getElementById('feedback').innerText = '';
    
    updateUI();
}

function checkAnswer() {
    const input = document.getElementById('word-input').value.trim().toLowerCase();
    const fb = document.getElementById('feedback');
    
    if (input === currentWordObj.w.toLowerCase()) {
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
                showLevelCompleteModal(() => {
                    loadRound();
                });
            }
        }, 1200);
    } else {
        lives--;
        fb.className = 'feedback-text error';
        fb.innerText = 'Wrong!';
        updateUI();
        
        if (lives <= 0) {
            setTimeout(() => endGame(false), 1200);
        } else {
            setTimeout(() => fb.innerText = '', 1200);
        }
    }
}

function ffOriginalHint() {
    hintsUsed++;
    const hintEl = document.getElementById('hint-display');
    hintEl.innerText = "Hint: " + currentWordObj.h;
    hintEl.classList.remove('hidden');
}

function ffOriginalEndGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'You Win!' : 'Game Over!';
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


function showHint() {
    if (window.FFRewards) {
        if (typeof hints !== 'undefined' && hints > 0) {
            ffOriginalHint();
        } else {
            window.FFRewards.showSpendConfirm({
                title: "Use Hint?",
                message: "Use 20 coins for a hint?",
                cost: 20,
                itemId: "hint_pack",
                onConfirm: (success) => {
                    if (success) {
                        if (typeof hints !== 'undefined') hints++; 
                        ffOriginalHint();
                    }
                }
            });
        }
    } else {
        ffOriginalHint();
    }
}
        

let hasRevived = false;
function endGame(win) {
    if (!win && window.FFRewards && !hasRevived) {
        window.FFRewards.showSpendConfirm({
            title: "Revive?",
            message: "Use 30 coins or a Revive Token to continue?",
            cost: 30,
            itemId: "revive_token",
            onConfirm: (success) => {
                if (success) {
                    hasRevived = true;
                    // RECOVER STATE
                    
    attempts = MAX_ATTEMPTS;
    updateUI();

                } else {
                    ffOriginalEndGame(win);
                }
            }
        });
        // Override cancel to trigger original game over
        setTimeout(() => {
            document.getElementById('ff-confirm-btn-cancel').onclick = () => {
                document.getElementById('ff-confirm-modal').classList.add('hidden');
                ffOriginalEndGame(win);
            };
        }, 100);
        return; // Halt game over
    }
    ffOriginalEndGame(win);
}
