const slug = "merge-cars";

const CARS = [
    { lvl: 1, icon: "🚗", income: 1 },
    { lvl: 2, icon: "🚕", income: 3 },
    { lvl: 3, icon: "🚙", income: 10 },
    { lvl: 4, icon: "🚌", income: 25 },
    { lvl: 5, icon: "🏎️", income: 60 },
    { lvl: 6, icon: "🚓", income: 150 },
    { lvl: 7, icon: "🚑", income: 400 },
    { lvl: 8, icon: "🚒", income: 1000 },
    { lvl: 9, icon: "🚜", income: 2500 },
    { lvl: 10, icon: "🚀", income: 6000 }
];

let state = {
    cash: 50,
    buyCost: 10,
    garage: Array(9).fill(0), // 0 means empty, else car level (1-10)
    maxLvlReached: 1
};

let incomeInterval = null;
let selectedSpotIdx = -1;

function postMsg(type, extra = {}) {
    window.parent.postMessage({ type, gameSlug: slug, ...extra }, "*");
}

function loadState() {
    const saved = localStorage.getItem(`ff_${slug}_state`);
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveState() {
    localStorage.setItem(`ff_${slug}_state`, JSON.stringify(state));
}

function initGame() {
    loadState();
    postMsg("GAME_START");
    renderGarage();
    updateUI();
    
    clearInterval(incomeInterval);
    incomeInterval = setInterval(() => {
        let income = getIncome();
        if (income > 0) {
            state.cash += income;
            updateUI();
            saveState();
        }
    }, 1000);
}

function getIncome() {
    let total = 0;
    state.garage.forEach(lvl => {
        if (lvl > 0) {
            total += CARS[lvl-1].income;
        }
    });
    return total;
}

function renderGarage() {
    const grid = document.getElementById('garage-grid');
    grid.innerHTML = '';
    
    state.garage.forEach((lvl, idx) => {
        const spot = document.createElement('div');
        spot.className = 'spot';
        spot.id = `spot-${idx}`;
        
        if (lvl > 0) {
            const car = CARS[lvl-1];
            spot.innerHTML = `<div class="car-icon">${car.icon}</div><div class="car-lvl">Lv${lvl}</div>`;
        }
        
        if (idx === selectedSpotIdx) {
            spot.classList.add('selected');
        }
        
        spot.onclick = () => handleSpotClick(idx);
        grid.appendChild(spot);
    });
}

function handleSpotClick(idx) {
    let lvl = state.garage[idx];
    
    if (selectedSpotIdx === -1) {
        // Select if there's a car
        if (lvl > 0) {
            selectedSpotIdx = idx;
            renderGarage();
            setInfo("Tap another car of the same level to merge, or tap empty spot to move.");
        }
    } else {
        if (selectedSpotIdx === idx) {
            // Deselect
            selectedSpotIdx = -1;
            renderGarage();
            setInfo("");
            return;
        }
        
        let selLvl = state.garage[selectedSpotIdx];
        
        if (lvl === 0) {
            // Move
            state.garage[idx] = selLvl;
            state.garage[selectedSpotIdx] = 0;
            selectedSpotIdx = -1;
            saveState();
            renderGarage();
            setInfo("");
        } else if (lvl === selLvl) {
            // Merge!
            if (lvl < 10) {
                state.garage[idx] = lvl + 1;
                state.garage[selectedSpotIdx] = 0;
                
                if (lvl + 1 > state.maxLvlReached) {
                    state.maxLvlReached = lvl + 1;
                    checkMilestones();
                }
                
                selectedSpotIdx = -1;
                saveState();
                renderGarage();
                setInfo("Merged successfully! Income increased.");
            } else {
                setInfo("Max level car reached!");
                selectedSpotIdx = -1;
                renderGarage();
            }
        } else {
            // Different level, just select new one
            selectedSpotIdx = idx;
            renderGarage();
            setInfo("Cars must be the same level to merge.");
        }
    }
}

function setInfo(text) {
    document.getElementById('info-text').innerText = text;
}

function updateUI() {
    document.getElementById('val-cash').innerText = Math.floor(state.cash);
    document.getElementById('val-income').innerText = getIncome();
    document.getElementById('val-cost').innerText = state.buyCost;
    
    document.getElementById('btn-buy').disabled = state.cash < state.buyCost || !state.garage.includes(0);
}

document.getElementById('btn-buy').addEventListener('click', () => {
    if (state.cash >= state.buyCost) {
        let emptyIdx = state.garage.indexOf(0);
        if (emptyIdx !== -1) {
            state.cash -= state.buyCost;
            state.garage[emptyIdx] = 1;
            state.buyCost = Math.floor(state.buyCost * 1.15); // cost scaling
            saveState();
            renderGarage();
            updateUI();
            
            // Post arbitrary score updates for platform interaction
            postMsg("SCORE_UPDATE", { score: getIncome() });
        }
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all progress?")) {
        localStorage.removeItem(`ff_${slug}_state`);
        state = {
            cash: 50,
            buyCost: 10,
            garage: Array(9).fill(0),
            maxLvlReached: 1
        };
        selectedSpotIdx = -1;
        saveState();
        renderGarage();
        updateUI();
        setInfo("Progress reset.");
    }
});

function checkMilestones() {
    // Arbitrary platform milestones for game
    if (state.maxLvlReached === 5) {
        postMsg("LEVEL_COMPLETE", { score: getIncome(), coins: 20 });
        setInfo("Milestone: Level 5 Car Unlocked!");
    } else if (state.maxLvlReached === 10) {
        postMsg("GAME_COMPLETE", { score: getIncome(), coins: 50 });
        setInfo("Milestone: Max Level Car Unlocked!");
    }
}

initGame();
