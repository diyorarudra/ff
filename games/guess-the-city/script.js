const slug = "guess-the-city";

const allCities = [
    { name: "Mumbai", clues: ["Gateway of India", "Vada Pav", "Financial Capital of India", "Bollywood"] },
    { name: "Delhi", clues: ["Red Fort", "India Gate", "Capital City", "Chole Bhature"] },
    { name: "Kolkata", clues: ["Victoria Memorial", "Howrah Bridge", "Rosogolla", "City of Joy"] },
    { name: "Chennai", clues: ["Marina Beach", "Kapaleeshwarar Temple", "Idli Sambar", "Detroit of India"] },
    { name: "Bengaluru", clues: ["Silicon Valley of India", "Lalbagh Botanical Garden", "Traffic Jams", "IT Hub"] },
    { name: "Hyderabad", clues: ["Charminar", "Biryani", "City of Pearls", "Ramoji Film City"] },
    { name: "Jaipur", clues: ["Hawa Mahal", "Pink City", "Amer Fort", "Dal Baati Churma"] },
    { name: "Agra", clues: ["Taj Mahal", "Agra Fort", "Petha", "Yamuna River"] },
    { name: "Paris", clues: ["Eiffel Tower", "Louvre Museum", "City of Love", "Croissant"] },
    { name: "New York", clues: ["Statue of Liberty", "Times Square", "The Big Apple", "Central Park"] },
    { name: "Tokyo", clues: ["Shibuya Crossing", "Sushi", "Mount Fuji nearby", "Anime Capital"] },
    { name: "London", clues: ["Big Ben", "London Eye", "River Thames", "Double-decker buses"] },
    { name: "Dubai", clues: ["Burj Khalifa", "Palm Jumeirah", "Desert Safari", "Global Village"] },
    { name: "Sydney", clues: ["Opera House", "Harbour Bridge", "Bondi Beach", "Down Under"] },
    { name: "Rome", clues: ["Colosseum", "Pantheon", "Pasta & Pizza", "Eternal City"] }
];

let roundCities = [];
let currentRoundIdx = 0;
let score = 0;
let timeLeft = 20;
let timer = null;
let currentCity = null;

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
    roundCities = [...allCities].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentRoundIdx = 0;
    score = 0;
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

function generateOptions(correctCity) {
    let wrongOptions = allCities.filter(c => c.name !== correctCity.name);
    wrongOptions.sort(() => 0.5 - Math.random());
    let opts = [correctCity.name, wrongOptions[0].name, wrongOptions[1].name, wrongOptions[2].name];
    opts.sort(() => 0.5 - Math.random());
    return opts;
}

function loadRound() {
    document.getElementById('val-round').innerText = currentRoundIdx + 1;
    document.getElementById('val-score').innerText = score;
    
    currentCity = roundCities[currentRoundIdx];
    
    // Randomize order of clues to make it slightly different if they play again
    let shuffledClues = [...currentCity.clues].sort(() => 0.5 - Math.random());
    
    const clueList = document.getElementById('clue-list');
    clueList.innerHTML = shuffledClues.map(c => `<li>${c}</li>`).join('');
    
    const options = generateOptions(currentCity);
    
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
        if (b.innerText === currentCity.name) b.classList.add('correct');
    });
    
    setTimeout(nextRound, 1500);
}

function checkAnswer(selected, btnEl) {
    clearInterval(timer);
    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach(b => b.disabled = true);
    
    if (selected === currentCity.name) {
        btnEl.classList.add('correct');
        const points = 10 + (timeLeft > 10 ? 5 : 0); // Speed bonus
        score += points;
        postMsg("SCORE_UPDATE", { score });
    } else {
        btnEl.classList.add('wrong');
        btns.forEach(b => {
            if (b.innerText === currentCity.name) b.classList.add('correct');
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
