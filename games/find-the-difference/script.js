const slug = "find-the-difference";

let level = 1;
let score = 0;
let timeLeft = 90;
let timer = null;

let foundCount = 0;
let totalDiffs = 3;
let currentDiffs = []; // array of {id, iconTop, iconBot}

const emojis = [
    "🌲","🌳","🌵","🍄","🌻","🌼","🌷","🦋","🐛","🐞",
    "☁️","☀️","🐦","🦅","🍎","🚗","🚲","🏡","🏕️","🐶","🐱","🦊"
];

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
    level = 1;
    score = 0;
    postMsg("GAME_START");
    startLevel();
    showScreen('game');
}

function startLevel() {
    timeLeft = 90;
    foundCount = 0;
    totalDiffs = Math.min(3 + Math.floor(level / 2), 7);
    currentDiffs = [];
    
    // Clear marks
    document.querySelectorAll('.circle-mark').forEach(e => e.remove());
    
    generateScenes();
    updateUI();
    
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame(false);
        }
    }, 1000);
}

function generateScenes() {
    const sTop = document.getElementById('scene-top');
    const sBot = document.getElementById('scene-bottom');
    sTop.innerHTML = '';
    sBot.innerHTML = '';
    
    // Set random background theme
    const themes = [
        "linear-gradient(to bottom, #87ceeb 50%, #4ade80 50%)", // sky grass
        "linear-gradient(to bottom, #1e1b4b 60%, #475569 40%)", // night street
        "linear-gradient(to bottom, #fcd34d 40%, #d97706 60%)", // desert
        "linear-gradient(to bottom, #0284c7 30%, #0c4a6e 70%)"  // ocean
    ];
    let bg = themes[level % themes.length];
    sTop.style.background = bg;
    sBot.style.background = bg;
    
    let numBaseObjects = 15 + level * 2;
    let objects = [];
    
    for(let i=0; i<numBaseObjects; i++) {
        objects.push({
            id: i,
            icon: emojis[Math.floor(Math.random() * emojis.length)],
            x: 5 + Math.random() * 85,
            y: 10 + Math.random() * 80,
            size: 1.5 + Math.random() * 2,
            isDiff: false
        });
    }
    
    // Select objects to be differences
    let diffIndices = [];
    while(diffIndices.length < totalDiffs) {
        let r = Math.floor(Math.random() * numBaseObjects);
        if(!diffIndices.includes(r)) diffIndices.push(r);
    }
    
    diffIndices.forEach(idx => {
        objects[idx].isDiff = true;
        // The bottom will have a different icon, or be missing, or have different color
        // Let's just change icon for simplicity
        let newIcon = emojis[Math.floor(Math.random() * emojis.length)];
        while(newIcon === objects[idx].icon) {
            newIcon = emojis[Math.floor(Math.random() * emojis.length)];
        }
        
        // 20% chance to just be completely missing in bottom
        if (Math.random() < 0.2) newIcon = ""; 
        
        currentDiffs.push({ id: idx, iconTop: objects[idx].icon, iconBot: newIcon, found: false });
    });
    
    // Render
    objects.forEach(obj => {
        // TOP
        let topEl = document.createElement('div');
        topEl.className = 'obj';
        topEl.innerText = obj.icon;
        topEl.style.left = obj.x + '%';
        topEl.style.top = obj.y + '%';
        topEl.style.fontSize = obj.size + 'rem';
        sTop.appendChild(topEl);
        
        // BOT
        let botEl = document.createElement('div');
        botEl.className = 'obj';
        botEl.id = 'bot-obj-' + obj.id;
        
        if (obj.isDiff) {
            let diffData = currentDiffs.find(d => d.id === obj.id);
            botEl.innerText = diffData.iconBot;
            
            // Allow clicking to find difference (even if missing, the div is there with padding)
            botEl.addEventListener('click', (e) => {
                e.stopPropagation();
                handleFind(obj.id, botEl);
            });
        } else {
            botEl.innerText = obj.icon;
            // Clicking normal object = wrong
            botEl.addEventListener('click', (e) => {
                e.stopPropagation();
                handleWrong();
            });
        }
        
        botEl.style.left = obj.x + '%';
        botEl.style.top = obj.y + '%';
        botEl.style.fontSize = obj.size + 'rem';
        sBot.appendChild(botEl);
    });
}

// Background click catcher
document.getElementById('scene-bg-catch').addEventListener('click', () => {
    handleWrong();
});

function handleFind(id, botEl) {
    let diff = currentDiffs.find(d => d.id === id);
    if (!diff || diff.found) return;
    
    diff.found = true;
    foundCount++;
    score += 150;
    
    // Create red circle over bot element
    let rect = botEl.getBoundingClientRect();
    let containerRect = document.getElementById('scene-bottom').getBoundingClientRect();
    
    let circle = document.createElement('div');
    circle.className = 'circle-mark';
    
    // Make circle responsive to size
    let cSize = Math.max(botEl.offsetWidth, 40);
    circle.style.width = cSize + 'px';
    circle.style.height = cSize + 'px';
    
    // position relative to scene-bottom
    circle.style.left = (rect.left - containerRect.left + (rect.width/2) - (cSize/2)) + 'px';
    circle.style.top = (rect.top - containerRect.top + (rect.height/2) - (cSize/2)) + 'px';
    
    document.getElementById('scene-bottom').appendChild(circle);
    
    showMsg("DIFFERENCE FOUND!", "var(--success)");
    updateUI();
    
    if (foundCount >= totalDiffs) {
        clearInterval(timer);
        setTimeout(() => {
            if (level >= 8) {
                endGame(true);
            } else {
                postMsg("LEVEL_COMPLETE", { score, coins: 25 });
                level++;
                startLevel();
            }
        }, 1500);
    }
}

function handleWrong() {
    score = Math.max(0, score - 20);
    showFlash("var(--danger)");
    updateUI();
}

function showFlash(color) {
    const bg1 = document.getElementById('scene-top');
    const bg2 = document.getElementById('scene-bottom');
    bg1.style.boxShadow = `inset 0 0 30px ${color}`;
    bg2.style.boxShadow = `inset 0 0 30px ${color}`;
    setTimeout(() => {
        bg1.style.boxShadow = 'none';
        bg2.style.boxShadow = 'none';
    }, 300);
}

function showMsg(text, color) {
    const msg = document.getElementById('msg-overlay');
    msg.innerText = text;
    msg.style.color = color;
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 800);
}

document.getElementById('btn-hint').addEventListener('click', () => {
    if (score >= 50) {
        score -= 50;
        updateUI();
        
        let unfound = currentDiffs.filter(d => !d.found);
        if (unfound.length > 0) {
            let targetId = unfound[0].id;
            let targetEl = document.getElementById('bot-obj-' + targetId);
            if (targetEl) {
                targetEl.classList.add('hinted');
                setTimeout(() => targetEl.classList.remove('hinted'), 2000);
            }
        }
    }
});

function updateUI() {
    document.getElementById('val-level').innerText = level;
    document.getElementById('val-time').innerText = timeLeft;
    document.getElementById('val-found').innerText = foundCount;
    document.getElementById('val-total').innerText = totalDiffs;
    document.getElementById('val-score').innerText = score;
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'Perfect Sight!' : 'Time Up!';
    document.getElementById('val-final-score').innerText = score;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: Math.floor(score/10) });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
