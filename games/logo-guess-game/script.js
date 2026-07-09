const slug = "logo-guess-game";

// Fictional brands based on simple emojis/colors rendered via CSS
const allLogos = [
    { name: "NovaMart", icon: "🛒", color: "#ef4444" },
    { name: "PixelPay", icon: "💳", color: "#3b82f6" },
    { name: "SkyBite", icon: "🍔", color: "#f59e0b" },
    { name: "GreenKart", icon: "🥬", color: "#10b981" },
    { name: "QuickZap", icon: "⚡", color: "#eab308" },
    { name: "TravelBee", icon: "🐝", color: "#f97316" },
    { name: "CodeCup", icon: "☕", color: "#6366f1" },
    { name: "MusicFox", icon: "🦊", color: "#ec4899" },
    { name: "FoodNest", icon: "🥚", color: "#8b5cf6" },
    { name: "StarRide", icon: "⭐", color: "#14b8a6" },
    { name: "CloudSync", icon: "☁️", color: "#0ea5e9" },
    { name: "FireChat", icon: "🔥", color: "#f43f5e" }
];

let roundLogos = [];
let currentRoundIdx = 0;
let score = 0;
let timeLeft = 15;
let timer = null;
let currentLogo = null;

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
    roundLogos = [...allLogos].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentRoundIdx = 0;
    score = 0;
    postMsg("GAME_START");
    loadRound();
    showScreen('game');
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 15;
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

function generateOptions(correctLogo) {
    let wrongOptions = allLogos.filter(l => l.name !== correctLogo.name);
    wrongOptions.sort(() => 0.5 - Math.random());
    let opts = [correctLogo.name, wrongOptions[0].name, wrongOptions[1].name, wrongOptions[2].name];
    opts.sort(() => 0.5 - Math.random());
    return opts;
}

function loadRound() {
    document.getElementById('val-round').innerText = currentRoundIdx + 1;
    document.getElementById('val-score').innerText = score;
    
    currentLogo = roundLogos[currentRoundIdx];
    const display = document.getElementById('logo-display');
    display.innerText = currentLogo.icon;
    display.style.color = currentLogo.color;
    
    const options = generateOptions(currentLogo);
    
    const cont = document.getElementById('options-container');
    cont.innerHTML = options.map(opt => 
        `<button class="opt-btn" onclick="checkAnswer('${opt}', this)">${opt}</button>`
    ).join('');
    
    startTimer();
}

function handleTimeout() {
    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach(b => b.disabled = true);
    
    // Highlight correct
    btns.forEach(b => {
        if (b.innerText === currentLogo.name) b.classList.add('correct');
    });
    
    setTimeout(nextRound, 1500);
}

function checkAnswer(selected, btnEl) {
    clearInterval(timer);
    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach(b => b.disabled = true);
    
    if (selected === currentLogo.name) {
        btnEl.classList.add('correct');
        score += 10;
        postMsg("SCORE_UPDATE", { score });
    } else {
        btnEl.classList.add('wrong');
        btns.forEach(b => {
            if (b.innerText === currentLogo.name) b.classList.add('correct');
        });
    }
    
    document.getElementById('val-score').innerText = score;
    
    setTimeout(nextRound, 1500);
}

function nextRound() {
    currentRoundIdx++;
    if (currentRoundIdx >= 10) {
        endGame();
    } else {
        postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                showLevelCompleteModal(() => {
                    loadRound();
                });
    }
}

function endGame() {
    showScreen('end');
    document.getElementById('val-final-score').innerText = score;
    postMsg("GAME_COMPLETE", { score, coins: 20 });
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
