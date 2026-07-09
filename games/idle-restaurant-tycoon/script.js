const slug = "idle-restaurant-tycoon";

let state = {
    cash: 0,
    baseIncome: 1,
    costs: {
        kitchen: 20,
        chef: 100,
        table: 500
    },
    milestones: {
        first1k: false,
        first10k: false,
        premium: false
    }
};

let gameLoop = null;
let isBoosted = false;
let boostTimer = 0;
let lastTickTime = Date.now();

function postMsg(type, extra = {}) {
    window.parent.postMessage({ type, gameSlug: slug, ...extra }, "*");
}

function loadState() {
    const saved = localStorage.getItem(`ff_${slug}_state`);
    if (saved) {
        state = JSON.parse(saved);
        if (!state.milestones) {
            state.milestones = { first1k: false, first10k: false, premium: false };
        }
    }
}

function saveState() {
    localStorage.setItem(`ff_${slug}_state`, JSON.stringify(state));
}

function initGame() {
    loadState();
    postMsg("GAME_START");
    updateUI();
    
    lastTickTime = Date.now();
    cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(tick);
}

function tick() {
    let now = Date.now();
    let dt = (now - lastTickTime) / 1000;
    lastTickTime = now;
    
    let currentIncome = state.baseIncome;
    if (isBoosted) {
        currentIncome *= 2;
        boostTimer -= dt;
        if (boostTimer <= 0) {
            isBoosted = false;
            document.getElementById('status-text').innerText = "Open for business!";
            document.getElementById('btn-boost').disabled = false;
            document.querySelector('#btn-boost .upg-cost').innerText = "Ready!";
        } else {
            document.querySelector('#btn-boost .upg-cost').innerText = Math.ceil(boostTimer) + "s";
        }
    }
    
    state.cash += currentIncome * dt;
    
    checkMilestones();
    updateUI();
    
    if (Math.random() < 0.02) saveState();
    
    gameLoop = requestAnimationFrame(tick);
}

function updateUI() {
    document.getElementById('val-cash').innerText = Math.floor(state.cash).toLocaleString();
    
    let currentIncome = state.baseIncome;
    if (isBoosted) currentIncome *= 2;
    document.getElementById('val-income').innerText = currentIncome.toLocaleString();
    
    document.getElementById('cost-kitchen').innerText = state.costs.kitchen.toLocaleString();
    document.getElementById('cost-chef').innerText = state.costs.chef.toLocaleString();
    document.getElementById('cost-table').innerText = state.costs.table.toLocaleString();
    
    document.getElementById('btn-upg-kitchen').disabled = state.cash < state.costs.kitchen;
    document.getElementById('btn-upg-chef').disabled = state.cash < state.costs.chef;
    document.getElementById('btn-upg-table').disabled = state.cash < state.costs.table;
}

document.getElementById('btn-upg-kitchen').addEventListener('click', () => {
    if (state.cash >= state.costs.kitchen) {
        state.cash -= state.costs.kitchen;
        state.baseIncome += 3;
        state.costs.kitchen = Math.floor(state.costs.kitchen * 1.6);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome });
    }
});

document.getElementById('btn-upg-chef').addEventListener('click', () => {
    if (state.cash >= state.costs.chef) {
        state.cash -= state.costs.chef;
        state.baseIncome += 15;
        state.costs.chef = Math.floor(state.costs.chef * 1.6);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome });
    }
});

document.getElementById('btn-upg-table').addEventListener('click', () => {
    if (state.cash >= state.costs.table) {
        state.cash -= state.costs.table;
        state.baseIncome += 80;
        state.costs.table = Math.floor(state.costs.table * 1.6);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome });
    }
});

document.getElementById('btn-boost').addEventListener('click', () => {
    if (!isBoosted) {
        isBoosted = true;
        boostTimer = 15;
        document.getElementById('btn-boost').disabled = true;
        document.getElementById('status-text').innerText = "🔥 COOKING FRENZY! 🔥";
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Reset your restaurant?")) {
        localStorage.removeItem(`ff_${slug}_state`);
        state = {
            cash: 0,
            baseIncome: 1,
            costs: { kitchen: 20, chef: 100, table: 500 },
            milestones: { first1k: false, first10k: false, premium: false }
        };
        isBoosted = false;
        document.getElementById('btn-boost').disabled = false;
        document.querySelector('#btn-boost .upg-cost').innerText = "Ready!";
        document.getElementById('status-text').innerText = "Open for business!";
        saveState();
        updateUI();
    }
});

function checkMilestones() {
    if (state.cash >= 1000 && !state.milestones.first1k) {
        state.milestones.first1k = true;
        triggerMilestone("Earned ₹1,000!");
        postMsg("LEVEL_COMPLETE", { score: state.baseIncome, coins: 20 });
    }
    if (state.cash >= 10000 && !state.milestones.first10k) {
        state.milestones.first10k = true;
        triggerMilestone("Earned ₹10,000!");
        postMsg("LEVEL_COMPLETE", { score: state.baseIncome, coins: 50 });
    }
    if (state.baseIncome >= 1000 && !state.milestones.premium) {
        state.milestones.premium = true;
        document.querySelector('.shop-name').innerText = "Premium Restaurant";
        triggerMilestone("Premium Restaurant Unlocked!");
        postMsg("GAME_COMPLETE", { score: state.baseIncome, coins: 100 });
    }
}

function triggerMilestone(name) {
    document.getElementById('milestone-name').innerText = name;
    document.getElementById('milestone-overlay').classList.remove('hidden');
    saveState();
}

document.getElementById('btn-close-milestone').addEventListener('click', () => {
    document.getElementById('milestone-overlay').classList.add('hidden');
});

initGame();
