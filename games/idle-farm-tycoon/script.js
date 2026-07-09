const slug = "idle-farm-tycoon";

const CROPS = [
    { name: "Seeds", icon: "🌱", nextCost: 5000, multi: 1 },
    { name: "Wheat", icon: "🌾", nextCost: 25000, multi: 5 },
    { name: "Corn", icon: "🌽", nextCost: 100000, multi: 20 },
    { name: "Mango Farm", icon: "🥭", nextCost: null, multi: 100 }
];

let state = {
    cash: 0,
    baseIncome: 1,
    costs: {
        field: 50,
        tractor: 250,
        farmer: 1200
    },
    cropIndex: 0,
    milestones: {
        earn50k: false
    }
};

let gameLoop = null;
let lastTickTime = Date.now();

function postMsg(type, extra = {}) {
    window.parent.postMessage({ type, gameSlug: slug, ...extra }, "*");
}

function loadState() {
    const saved = localStorage.getItem(`ff_${slug}_state`);
    if (saved) {
        state = JSON.parse(saved);
        if (!state.milestones) state.milestones = { earn50k: false };
        if (state.cropIndex === undefined) state.cropIndex = 0;
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
    
    let cropMulti = CROPS[state.cropIndex].multi;
    let currentIncome = state.baseIncome * cropMulti;
    
    state.cash += currentIncome * dt;
    
    checkMilestones();
    updateUI();
    
    if (Math.random() < 0.02) saveState();
    
    gameLoop = requestAnimationFrame(tick);
}

function updateUI() {
    document.getElementById('val-cash').innerText = Math.floor(state.cash).toLocaleString();
    
    let currentIncome = state.baseIncome * CROPS[state.cropIndex].multi;
    document.getElementById('val-income').innerText = currentIncome.toLocaleString();
    
    document.getElementById('cost-field').innerText = state.costs.field.toLocaleString();
    document.getElementById('cost-tractor').innerText = state.costs.tractor.toLocaleString();
    document.getElementById('cost-farmer').innerText = state.costs.farmer.toLocaleString();
    
    document.getElementById('btn-upg-field').disabled = state.cash < state.costs.field;
    document.getElementById('btn-upg-tractor').disabled = state.cash < state.costs.tractor;
    document.getElementById('btn-upg-farmer').disabled = state.cash < state.costs.farmer;
    
    // Crop Info
    let crop = CROPS[state.cropIndex];
    document.getElementById('farm-visual').innerText = crop.icon;
    document.getElementById('status-text').innerText = `Growing ${crop.name}...`;
    
    let nextCrop = CROPS[state.cropIndex + 1];
    const cropBtn = document.getElementById('btn-upg-crop');
    if (nextCrop) {
        document.getElementById('next-crop-name').innerText = `Unlock ${nextCrop.name}`;
        document.getElementById('cost-crop').innerText = crop.nextCost.toLocaleString();
        document.querySelector('#btn-upg-crop .upg-icon').innerText = nextCrop.icon;
        cropBtn.disabled = state.cash < crop.nextCost;
        cropBtn.style.display = 'flex';
    } else {
        cropBtn.style.display = 'none';
    }
}

document.getElementById('btn-upg-field').addEventListener('click', () => {
    if (state.cash >= state.costs.field) {
        state.cash -= state.costs.field;
        state.baseIncome += 5;
        state.costs.field = Math.floor(state.costs.field * 1.6);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome * CROPS[state.cropIndex].multi });
    }
});

document.getElementById('btn-upg-tractor').addEventListener('click', () => {
    if (state.cash >= state.costs.tractor) {
        state.cash -= state.costs.tractor;
        state.baseIncome += 25;
        state.costs.tractor = Math.floor(state.costs.tractor * 1.6);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome * CROPS[state.cropIndex].multi });
    }
});

document.getElementById('btn-upg-farmer').addEventListener('click', () => {
    if (state.cash >= state.costs.farmer) {
        state.cash -= state.costs.farmer;
        state.baseIncome += 100;
        state.costs.farmer = Math.floor(state.costs.farmer * 1.6);
        saveState();
        updateUI();
        postMsg("SCORE_UPDATE", { score: state.baseIncome * CROPS[state.cropIndex].multi });
    }
});

document.getElementById('btn-upg-crop').addEventListener('click', () => {
    let crop = CROPS[state.cropIndex];
    if (crop.nextCost && state.cash >= crop.nextCost) {
        state.cash -= crop.nextCost;
        state.cropIndex++;
        
        let newCrop = CROPS[state.cropIndex];
        triggerMilestone(`Unlocked ${newCrop.name}!`, newCrop.icon);
        
        if (state.cropIndex === CROPS.length - 1) {
            postMsg("GAME_COMPLETE", { score: state.baseIncome * CROPS[state.cropIndex].multi, coins: 100 });
        } else {
            postMsg("LEVEL_COMPLETE", { score: state.baseIncome * CROPS[state.cropIndex].multi, coins: 25 });
        }
        
        saveState();
        updateUI();
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Sell the farm and start over?")) {
        localStorage.removeItem(`ff_${slug}_state`);
        state = {
            cash: 0,
            baseIncome: 1,
            costs: { field: 50, tractor: 250, farmer: 1200 },
            cropIndex: 0,
            milestones: { earn50k: false }
        };
        saveState();
        updateUI();
    }
});

function checkMilestones() {
    if (state.cash >= 50000 && !state.milestones.earn50k) {
        state.milestones.earn50k = true;
        triggerMilestone("Earned ₹50,000!", "💰");
        postMsg("LEVEL_COMPLETE", { score: state.baseIncome * CROPS[state.cropIndex].multi, coins: 50 });
    }
}

function triggerMilestone(name, icon) {
    document.getElementById('milestone-name').innerText = name;
    document.getElementById('milestone-icon').innerText = icon;
    document.getElementById('milestone-overlay').classList.remove('hidden');
    saveState();
}

document.getElementById('btn-close-milestone').addEventListener('click', () => {
    document.getElementById('milestone-overlay').classList.add('hidden');
});

initGame();
