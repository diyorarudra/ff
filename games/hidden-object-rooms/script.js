const slug = "hidden-object-rooms";

let level = 1;
let score = 0;
let timeLeft = 60;
let timer = null;

const allEmojis = [
    "🍎","🍌","🍒","🍓","🥑","🥕","🍔","🍟","🍕","🍩","☕","🍷",
    "⚽","🏀","🏈","🎾","🎱","🎮","🎲","🎸","🎺","🎨","🧸","🎈",
    "🚗","🚕","🚙","🚌","🚜","🚲","🛴","🚀","🚁","⛵","⚓","🗺️",
    "📱","💻","⌨️","⌚","📸","📺","📻","🔋","🔌","💡","🔦","🔑",
    "🔨","🛡️","🔫","💊","🧼","🧻","🧹","🧺","🧦","🧤","🧣","🎩",
    "🐶","🐱","🐭","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸"
];

let currentLevelTargets = [];
let foundTargets = 0;

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
    timeLeft = 60;
    foundTargets = 0;
    currentLevelTargets = [];
    
    generateRoom();
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

function generateRoom() {
    const scene = document.getElementById('room-scene');
    scene.innerHTML = '';
    
    // Number of targets increases with level
    let numTargets = 3 + Math.floor(level / 2);
    // Number of decoy objects increases with level
    let numDecoys = 20 + (level * 5);
    
    // Pick random subset of emojis
    let shuffled = [...allEmojis].sort(() => 0.5 - Math.random());
    currentLevelTargets = shuffled.slice(0, numTargets);
    let decoys = shuffled.slice(numTargets, numTargets + numDecoys);
    
    let allObjects = [];
    
    currentLevelTargets.forEach(icon => {
        allObjects.push({ icon: icon, isTarget: true });
    });
    decoys.forEach(icon => {
        allObjects.push({ icon: icon, isTarget: false });
    });
    
    // Shuffle placements
    allObjects.sort(() => 0.5 - Math.random());
    
    allObjects.forEach((obj, idx) => {
        let el = document.createElement('div');
        el.className = 'obj';
        el.id = 'obj-' + idx;
        el.innerText = obj.icon;
        
        // Random position, avoiding edges too closely
        let rx = 5 + Math.random() * 80;
        let ry = 5 + Math.random() * 80;
        
        // Random size and rotation to blend in
        let size = 1 + Math.random() * 2.5; // 1 to 3.5 rem
        let rot = -45 + Math.random() * 90;
        let opacity = 0.5 + Math.random() * 0.5; // some are faint
        
        el.style.left = rx + '%';
        el.style.top = ry + '%';
        el.style.fontSize = size + 'rem';
        el.style.transform = `rotate(${rot}deg)`;
        el.style.opacity = opacity;
        
        el.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent hitting background
            handleObjClick(obj, el);
        });
        
        scene.appendChild(el);
    });
    
    renderTargetList();
}

function renderTargetList() {
    const list = document.getElementById('target-list');
    list.innerHTML = '';
    currentLevelTargets.forEach((icon, i) => {
        let el = document.createElement('div');
        el.className = 'target-item';
        el.id = 'target-req-' + i;
        el.innerText = icon;
        list.appendChild(el);
    });
}

// Penalize wrong taps on background
document.getElementById('room-bg').addEventListener('click', () => {
    score = Math.max(0, score - 10);
    showFlash("var(--danger)");
    updateUI();
});

function handleObjClick(objData, el) {
    if (el.classList.contains('found-obj')) return;
    
    if (objData.isTarget) {
        // Found!
        score += 100;
        foundTargets++;
        
        // Visuals
        el.classList.add('found-obj');
        el.style.transition = 'all 0.5s';
        el.style.transform = 'scale(2) translateY(-20px)';
        el.style.opacity = '0';
        
        // Mark in list
        let reqIdx = currentLevelTargets.indexOf(objData.icon);
        if (reqIdx > -1) {
            document.getElementById('target-req-' + reqIdx).classList.add('found');
        }
        
        showMsg("FOUND!", "var(--success)");
        updateUI();
        
        if (foundTargets === currentLevelTargets.length) {
            clearInterval(timer);
            setTimeout(() => {
                if (level >= 8) {
                    endGame(true);
                } else {
                    postMsg("LEVEL_COMPLETE", { score, coins: 20 });
                    level++;
                    startLevel();
                }
            }, 1000);
        }
    } else {
        // Wrong object
        score = Math.max(0, score - 10);
        showFlash("var(--danger)");
        updateUI();
    }
}

function showFlash(color) {
    const bg = document.getElementById('room-scene');
    bg.style.boxShadow = `inset 0 0 30px ${color}`;
    setTimeout(() => bg.style.boxShadow = 'none', 300);
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
        
        // Find one unfound target element
        const scene = document.getElementById('room-scene');
        let children = Array.from(scene.children);
        let unfound = children.filter(c => !c.classList.contains('found-obj') && currentLevelTargets.includes(c.innerText));
        
        if (unfound.length > 0) {
            let targetEl = unfound[0];
            targetEl.classList.add('hinted');
            setTimeout(() => targetEl.classList.remove('hinted'), 2000);
        }
    }
});

function updateUI() {
    document.getElementById('val-level').innerText = level;
    document.getElementById('val-time').innerText = timeLeft;
    document.getElementById('val-score').innerText = score;
}

function endGame(win) {
    showScreen('end');
    document.getElementById('end-title').innerText = win ? 'Eagle Eye!' : 'Time Up!';
    document.getElementById('val-final-score').innerText = score;
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: Math.floor(score/10) });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
