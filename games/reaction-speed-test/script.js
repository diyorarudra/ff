const slug = "reaction-speed-test";

let round = 1;
const MAX_ROUNDS = 10;
let times = [];
let bestTime = Infinity;

let state = 'idle'; // idle, wait, go, result
let waitTimeout = null;
let startTime = 0;

const screens = {
    start: document.getElementById('screen-start'),
    game: document.getElementById('screen-game'),
    end: document.getElementById('screen-end')
};

const zone = document.getElementById('reaction-zone');
const textMain = document.getElementById('zone-text');
const textSub = document.getElementById('zone-sub');

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

function postMsg(type, extra = {}) {
    window.parent.postMessage({ type, gameSlug: slug, ...extra }, "*");
}

function initGame() {
    round = 1;
    times = [];
    bestTime = Infinity;
    postMsg("GAME_START");
    updateUI();
    setIdle();
    showScreen('game');
}

function setIdle() {
    state = 'idle';
    zone.className = 'state-idle';
    textMain.innerText = "Click to Start";
    textSub.innerText = `Round ${round} of ${MAX_ROUNDS}`;
}

function setWait() {
    state = 'wait';
    zone.className = 'state-wait';
    textMain.innerText = "Wait...";
    textSub.innerText = "Get ready to tap!";
    
    // Random delay between 1.5s and 4.5s
    let delay = 1500 + Math.random() * 3000;
    
    waitTimeout = setTimeout(() => {
        setGo();
    }, delay);
}

function setGo() {
    state = 'go';
    zone.className = 'state-go';
    textMain.innerText = "TAP NOW!";
    textSub.innerText = "";
    startTime = Date.now();
}

function handleEarly() {
    clearTimeout(waitTimeout);
    state = 'result';
    zone.className = 'state-early';
    textMain.innerText = "Too Early!";
    textSub.innerText = "Click to try this round again.";
}

function handleResult() {
    let rt = Date.now() - startTime;
    times.push(rt);
    if (rt < bestTime) bestTime = rt;
    
    state = 'result';
    zone.className = 'state-result';
    textMain.innerText = rt + " ms";
    textSub.innerText = "Click to continue.";
    
    updateUI();
    postMsg("LEVEL_COMPLETE", { score: 1000 - rt, coins: 2 });
    
    if (times.length >= MAX_ROUNDS) {
        textSub.innerText = "Test Complete! Click to see results.";
    }
}

zone.addEventListener('mousedown', handleClick);
zone.addEventListener('touchstart', (e) => { e.preventDefault(); handleClick(); });

function handleClick() {
    if (state === 'idle') {
        setWait();
    } else if (state === 'wait') {
        handleEarly(); // False start
    } else if (state === 'go') {
        handleResult();
    } else if (state === 'result') {
        if (times.length >= MAX_ROUNDS) {
            endGame();
        } else {
            // Only advance round if it wasn't a false start
            if (textMain.innerText !== "Too Early!") {
                round++;
            }
            updateUI();
            setIdle();
        }
    }
}

function updateUI() {
    document.getElementById('val-round').innerText = Math.min(round, MAX_ROUNDS);
    
    if (times.length > 0) {
        let sum = times.reduce((a, b) => a + b, 0);
        let avg = Math.round(sum / times.length);
        document.getElementById('val-avg').innerText = avg;
    } else {
        document.getElementById('val-avg').innerText = '0';
    }
    
    document.getElementById('val-best').innerText = bestTime === Infinity ? '-' : bestTime + 'ms';
}

function endGame() {
    showScreen('end');
    
    let sum = times.reduce((a, b) => a + b, 0);
    let avg = Math.round(sum / times.length);
    document.getElementById('val-final-avg').innerText = avg;
    
    let rank = "Slow Starter 🐢";
    if (avg < 250) rank = "Lightning Reflex ⚡";
    else if (avg < 350) rank = "Quick Tapper 🐆";
    else if (avg < 500) rank = "Average Joe 🚶";
    
    document.getElementById('rank-msg').innerText = "Rank: " + rank;
    
    // Score calculation: 300ms is standard, lower is better. Max score ~5000
    let finalScore = Math.max(0, 5000 - (avg * 10));
    
    postMsg("GAME_COMPLETE", { score: finalScore, coins: 20 });
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
