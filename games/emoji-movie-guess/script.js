const slug = "emoji-movie-guess";

const allMovies = [
    { emojis: "🦁👑", title: "Lion King" },
    { emojis: "🚢💔🧊", title: "Titanic" },
    { emojis: "🕷️🧑🕸️", title: "Spider-Man" },
    { emojis: "🦇👨🌃", title: "Batman" },
    { emojis: "👽🚲🌕", title: "E.T." },
    { emojis: "🦖🦕🎢", title: "Jurassic Park" },
    { emojis: "🔎🐠", title: "Finding Nemo" },
    { emojis: "🐼🥋", title: "Kung Fu Panda" },
    { emojis: "👻🚫", title: "Ghostbusters" },
    { emojis: "🧙‍♂️💍🌋", title: "Lord of the Rings" },
    { emojis: "🧊👸⛄", title: "Frozen" },
    { emojis: "👦⚡👓", title: "Harry Potter" },
    { emojis: "🧜‍♀️🦀", title: "The Little Mermaid" },
    { emojis: "🏠🎈👴", title: "Up" },
    { emojis: "🐀👨‍🍳", title: "Ratatouille" }
];

let roundData = [];
let currentRoundIdx = 0;
let score = 0;
let strikes = 0;
let timeLeft = 20;
let timer = null;
let currentMovie = null;

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
    roundData = [...allMovies].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentRoundIdx = 0;
    score = 0;
    strikes = 0;
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

function generateOptions(correctObj) {
    let wrongOptions = allMovies.filter(m => m.title !== correctObj.title);
    wrongOptions.sort(() => 0.5 - Math.random());
    let opts = [correctObj.title, wrongOptions[0].title, wrongOptions[1].title, wrongOptions[2].title];
    opts.sort(() => 0.5 - Math.random());
    return opts;
}

function loadRound() {
    document.getElementById('val-round').innerText = currentRoundIdx + 1;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-strikes').innerText = strikes;
    
    currentMovie = roundData[currentRoundIdx];
    document.getElementById('emoji-display').innerText = currentMovie.emojis;
    
    const options = generateOptions(currentMovie);
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
        if (b.innerText === currentMovie.title) b.classList.add('correct');
    });
    
    strikes++;
    if (strikes >= 3) {
        setTimeout(() => endGame(false), 1500);
    } else {
        setTimeout(nextRound, 1500);
    }
}

function checkAnswer(selected, btnEl) {
    clearInterval(timer);
    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach(b => b.disabled = true);
    
    if (selected === currentMovie.title) {
        btnEl.classList.add('correct');
        const points = 10 + (timeLeft > 10 ? 5 : 0); // Speed bonus
        score += points;
        postMsg("SCORE_UPDATE", { score });
    } else {
        btnEl.classList.add('wrong');
        strikes++;
        btns.forEach(b => {
            if (b.innerText === currentMovie.title) b.classList.add('correct');
        });
    }
    
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-strikes').innerText = strikes;
    
    if (strikes >= 3) {
        setTimeout(() => endGame(false), 1500);
    } else {
        setTimeout(nextRound, 1500);
    }
}

function nextRound() {
    currentRoundIdx++;
    if (currentRoundIdx >= 10) {
        endGame(true);
    } else {
        postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                showLevelCompleteModal(() => {
                    
                    loadRound();
                });
    }
}

function endGame(completed) {
    showScreen('end');
    document.getElementById('end-title').innerText = completed ? 'You Win!' : 'Out of Strikes!';
    document.getElementById('val-final-score').innerText = score;
    
    if (completed) {
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
