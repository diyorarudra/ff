const slug = "number-memory-challenge";

let round = 1;
let score = 0;
let strikes = 0;
const MAX_ROUNDS = 10;
const MAX_STRIKES = 3;

let currentNumber = "";
let userInput = "";
let showTimer = null;
let startTime = 0;

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
    round = 1;
    score = 0;
    strikes = 0;
    postMsg("GAME_START");
    startRound();
    showScreen('game');
}

function startRound() {
    userInput = "";
    document.getElementById('input-display').innerText = "";
    updateUI();
    
    // length starts at 4, increases by 1 each round
    let len = 3 + round;
    currentNumber = "";
    for(let i=0; i<len; i++) {
        // first digit 1-9, others 0-9
        if(i===0) currentNumber += Math.floor(Math.random() * 9 + 1).toString();
        else currentNumber += Math.floor(Math.random() * 10).toString();
    }
    
    // Show view
    document.getElementById('display-number').innerText = currentNumber;
    document.getElementById('view-display').classList.remove('hidden');
    document.getElementById('view-input').classList.add('hidden');
    
    // Timer bar animation (gives ~2 seconds + 0.5s per digit)
    let displayTime = 1500 + (len * 400); 
    let bar = document.getElementById('timer-bar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    
    setTimeout(() => {
        bar.style.transition = `width ${displayTime}ms linear`;
        bar.style.width = '0%';
    }, 50);
    
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
        // Hide and show input
        document.getElementById('view-display').classList.add('hidden');
        document.getElementById('view-input').classList.remove('hidden');
        startTime = Date.now();
    }, displayTime);
}

// Input handling
document.querySelectorAll('.num-btn[data-val]').forEach(btn => {
    btn.addEventListener('click', () => {
        let val = btn.getAttribute('data-val');
        userInput += val;
        document.getElementById('input-display').innerText = userInput;
    });
});

document.getElementById('btn-clear').addEventListener('click', () => {
    userInput = "";
    document.getElementById('input-display').innerText = "";
});

document.getElementById('btn-submit').addEventListener('click', checkAnswer);

// allow physical keyboard
window.addEventListener('keydown', (e) => {
    if (!screens.game.classList.contains('active') || document.getElementById('view-input').classList.contains('hidden')) return;
    
    if (e.key >= '0' && e.key <= '9') {
        userInput += e.key;
        document.getElementById('input-display').innerText = userInput;
    } else if (e.key === 'Backspace') {
        userInput = userInput.slice(0, -1);
        document.getElementById('input-display').innerText = userInput;
    } else if (e.key === 'Enter') {
        checkAnswer();
    }
});

function checkAnswer() {
    let timeTaken = Date.now() - startTime;
    
    if (userInput === currentNumber) {
        // Correct
        let timeBonus = Math.max(0, 3000 - timeTaken) / 10;
        let roundScore = (round * 50) + Math.floor(timeBonus);
        score += roundScore;
        showResult("CORRECT!", "var(--success)");
        
        setTimeout(() => {
            if (round >= MAX_ROUNDS) endGame(true);
            else {
                postMsg("LEVEL_COMPLETE", { score, coins: 15 });
                showLevelCompleteModal(() => {
                    round++;
                    startRound();
                });
            }
        }, 1500);
        
    } else {
        // Wrong
        strikes++;
        showResult("WRONG: " + currentNumber, "var(--danger)");
        
        setTimeout(() => {
            if (strikes >= MAX_STRIKES) {
                endGame(false);
            } else {
                startRound();
            }
        }, 2000);
    }
}

function showResult(text, color) {
    const msg = document.getElementById('msg-overlay');
    msg.innerText = text;
    msg.style.color = color;
    msg.style.fontSize = text.length > 10 ? '2rem' : '3rem';
    msg.classList.remove('hidden');
    updateUI();
    
    setTimeout(() => {
        msg.classList.add('hidden');
    }, 1500);
}

function updateUI() {
    document.getElementById('val-round').innerText = round;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-strikes').innerText = strikes;
}

function endGame(win) {
    showScreen('end');
    document.getElementById('val-final-score').innerText = score;
    
    let rank = "Beginner";
    if (score > 3000) rank = "Memory Master 🧠";
    else if (score > 1500) rank = "Focused Mind 👁️";
    else if (round > 5) rank = "Average Recall";
    
    document.getElementById('rank-msg').innerText = "Rank: " + rank;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 30 });
    } else {
        postMsg("GAME_OVER", { score });
    }
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
