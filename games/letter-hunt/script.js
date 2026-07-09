const slug = "letter-hunt";

let currentRound = 1;
let score = 0;
let lives = 3;
let timeLeft = 20;
let timer = null;

let targetChars = [];
let foundCount = 0;
let combo = 0;
let lastHitTime = 0;

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
    currentRound = 1;
    score = 0;
    lives = 3;
    postMsg("GAME_START");
    loadRound();
    showScreen('game');
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 20;
    document.getElementById('val-timer').innerText = timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('val-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function getRandomLetter() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return chars.charAt(Math.floor(Math.random() * chars.length));
}

function loadRound() {
    document.getElementById('val-round').innerText = currentRound;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-lives').innerText = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    document.getElementById('combo-display').classList.add('hidden');
    
    combo = 0;
    foundCount = 0;
    
    // Determine target (either single letter 3 times, or a 3-4 letter word)
    const words = ["DOG", "CAT", "SUN", "MOON", "STAR", "FIRE", "PLAY", "BIRD"];
    let isWord = Math.random() > 0.5;
    
    let targetLetters = [];
    if (isWord) {
        let w = words[Math.floor(Math.random() * words.length)];
        targetLetters = w.split('');
        document.getElementById('target-text').innerText = w;
        targetChars = [...targetLetters]; // needs to find these exactly once each
    } else {
        let l = getRandomLetter();
        targetLetters = [l, l, l];
        document.getElementById('target-text').innerText = "3 x " + l;
        targetChars = [l, l, l]; // needs to find 3 instances
    }
    
    // Fill grid (6x6 = 36 cells)
    let gridData = Array(36).fill("");
    
    // Place targets randomly
    let placed = 0;
    while(placed < targetLetters.length) {
        let r = Math.floor(Math.random() * 36);
        if (gridData[r] === "") {
            gridData[r] = targetLetters[placed];
            placed++;
        }
    }
    
    // Fill rest with randoms (avoiding targets to not create accidental extras)
    for(let i=0; i<36; i++) {
        if(gridData[i] === "") {
            let l = getRandomLetter();
            while(targetLetters.includes(l)) l = getRandomLetter(); // avoid extra targets
            gridData[i] = l;
        }
    }
    
    const gridEl = document.getElementById('letter-grid');
    gridEl.innerHTML = gridData.map((letter, idx) => 
        `<div class="l-cell" id="c_${idx}" onclick="tapCell(${idx}, '${letter}')">${letter}</div>`
    ).join('');
    
    startTimer();
}

function tapCell(idx, letter) {
    const cell = document.getElementById(`c_${idx}`);
    if (cell.classList.contains('correct') || cell.classList.contains('wrong')) return;
    
    let foundIdx = targetChars.indexOf(letter);
    if (foundIdx > -1) {
        // Correct tap
        cell.classList.add('correct');
        targetChars.splice(foundIdx, 1); // remove from array
        foundCount++;
        
        let now = Date.now();
        if (now - lastHitTime < 1500 && lastHitTime !== 0) {
            combo++;
            let cDisplay = document.getElementById('combo-display');
            cDisplay.innerText = `Combo x${combo + 1}!`;
            cDisplay.classList.remove('hidden');
        } else {
            combo = 0;
            document.getElementById('combo-display').classList.add('hidden');
        }
        lastHitTime = now;
        
        let pts = 10 + (combo * 5);
        score += pts;
        document.getElementById('val-score').innerText = score;
        postMsg("SCORE_UPDATE", { score });
        
        if (targetChars.length === 0) {
            clearInterval(timer);
            setTimeout(nextRound, 800);
        }
    } else {
        // Wrong tap
        cell.classList.add('wrong');
        combo = 0;
        document.getElementById('combo-display').classList.add('hidden');
        score = Math.max(0, score - 5);
        lives--;
        document.getElementById('val-score').innerText = score;
        document.getElementById('val-lives').innerText = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
        
        if (lives <= 0) {
            clearInterval(timer);
            setTimeout(() => endGame(false), 800);
        } else {
            setTimeout(() => cell.classList.remove('wrong'), 500);
        }
    }
}

function handleTimeout() {
    lives--;
    if (lives <= 0) {
        endGame(false);
    } else {
        nextRound();
    }
}

function nextRound() {
    currentRound++;
    if (currentRound > 10) {
        endGame(true);
    } else {
        postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                showLevelCompleteModal(() => {
                    loadRound();
                });
    }
}

function endGame(win) {
    clearInterval(timer);
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'Hunt Complete!' : 'Game Over';
    document.getElementById('val-final-score').innerText = score;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 20 });
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
