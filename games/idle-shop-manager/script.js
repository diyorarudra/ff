const slug = "idle-shop-manager";

let state = {
    coins: 0,
    baseIncome: 1,
    costs: {
        counter: 10,
        staff: 50,
        product: 300
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
        // Retrofit milestones if old save
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
    let dt = (now - lastTickTime) / 1000; // delta time in seconds
    lastTickTime = now;
    
    // Calculate income
    let currentIncome = state.baseIncome;
    if (isBoosted) {
        currentIncome *= 2;
        boostTimer -= dt;
        if (boostTimer <= 0) {
            isBoosted = false;
            document.getElementById('status-text').innerText = "Shop is open!";
            document.getElementById('btn-boost').disabled = false;
            document.querySelector('#btn-boost .upg-cost').innerText = "Ready!";
        } else {
            document.querySelector('#btn-boost .upg-cost').innerText = Math.ceil(boostTimer) + "s";
        }
    }
    
    state.coins += currentIncome * dt;
    
    checkMilestones();
    updateUI();
    
    // Auto save every roughly 5 seconds
    if (Math.random() < 0.02) saveState();
    
    gameLoop = requestAnimationFrame(tick);
}

function updateUI() {
    document.getElementById('val-coins').innerText = Math.floor(state.coins).toLocaleString();
    
    let currentIncome = state.baseIncome;
    if (isBoosted) currentIncome *= 2;
    document.getElementById('val-income').innerText = currentIncome.toLocaleString();
    
    document.getElementById('cost-counter').innerText = state.costs.counter.toLocaleString();
    document.getElementById('cost-staff').innerText = state.costs.staff.toLocaleString();
    document.getElementById('cost-product').innerText = state.costs.product.toLocaleString();
    
    document.getElementById('btn-upg-counter').disabled = state.coins < state.costs.counter;
    document.getElementById('btn-upg-staff').disabled = state.coins < state.costs.staff;
    document.getElementById('btn-upg-product').disabled = state.coins < state.costs.product;
}

document.getElementById('btn-upg-counter').addEventListener('click', () => {
    if (state.coins >= state.costs.counter) {
        state.coins -= state.costs.counter;
        state.baseIncome += 2;
        state.costs.counter = Math.floor(state.costs.counter * 1.5);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome });
    }
});

document.getElementById('btn-upg-staff').addEventListener('click', () => {
    if (state.coins >= state.costs.staff) {
        state.coins -= state.costs.staff;
        state.baseIncome += 10;
        state.costs.staff = Math.floor(state.costs.staff * 1.5);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome });
    }
});

document.getElementById('btn-upg-product').addEventListener('click', () => {
    if (state.coins >= state.costs.product) {
        state.coins -= state.costs.product;
        state.baseIncome += 50;
        state.costs.product = Math.floor(state.costs.product * 1.5);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome });
    }
});

document.getElementById('btn-boost').addEventListener('click', () => {
    if (!isBoosted) {
        isBoosted = true;
        boostTimer = 10;
        document.getElementById('btn-boost').disabled = true;
        document.getElementById('status-text').innerText = "🔥 SALES BOOST ACTIVE! 🔥";
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Reset your entire shop empire?")) {
        localStorage.removeItem(`ff_${slug}_state`);
        state = {
            coins: 0,
            baseIncome: 1,
            costs: { counter: 10, staff: 50, product: 300 },
            milestones: { first1k: false, first10k: false, premium: false }
        };
        isBoosted = false;
        document.getElementById('btn-boost').disabled = false;
        document.querySelector('#btn-boost .upg-cost').innerText = "Ready!";
        document.getElementById('status-text').innerText = "Shop is open!";
        saveState();
        updateUI();
    }
});

function checkMilestones() {
    if (state.coins >= 1000 && !state.milestones.first1k) {
        state.milestones.first1k = true;
        triggerMilestone("First ₹1,000 Earned!");
        postMsg("LEVEL_COMPLETE", { score: state.baseIncome, coins: 20 });
    }
    if (state.coins >= 10000 && !state.milestones.first10k) {
        state.milestones.first10k = true;
        triggerMilestone("First ₹10,000 Earned!");
        postMsg("LEVEL_COMPLETE", { score: state.baseIncome, coins: 50 });
    }
    if (state.baseIncome >= 500 && !state.milestones.premium) {
        state.milestones.premium = true;
        document.querySelector('.shop-name').innerText = "Premium Shop";
        triggerMilestone("Premium Shop Unlocked!");
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
