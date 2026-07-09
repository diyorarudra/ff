const slug = "merge-animals";

const ANIMALS = [
    { lvl: 1, icon: "🐰", name: "Rabbit", income: 1 },
    { lvl: 2, icon: "🐱", name: "Cat", income: 3 },
    { lvl: 3, icon: "🐶", name: "Dog", income: 8 },
    { lvl: 4, icon: "🦊", name: "Fox", income: 20 },
    { lvl: 5, icon: "🐼", name: "Panda", income: 55 },
    { lvl: 6, icon: "🦁", name: "Lion", income: 150 },
    { lvl: 7, icon: "🐉", name: "Dragon", income: 500 }
];

let state = {
    score: 0,
    buyCost: 10,
    habitat: Array(12).fill(0), // 0 means empty, else lvl
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
    renderHabitat();
    updateUI();
    
    clearInterval(incomeInterval);
    incomeInterval = setInterval(() => {
        let income = getIncome();
        if (income > 0) {
            state.score += income;
            updateUI();
            saveState();
        }
    }, 1000);
}

function getIncome() {
    let total = 0;
    state.habitat.forEach(lvl => {
        if (lvl > 0) {
            total += ANIMALS[lvl-1].income;
        }
    });
    return total;
}

function renderHabitat() {
    const grid = document.getElementById('habitat-grid');
    grid.innerHTML = '';
    
    state.habitat.forEach((lvl, idx) => {
        const spot = document.createElement('div');
        spot.className = 'spot';
        spot.id = `spot-${idx}`;
        
        if (lvl > 0) {
            const anim = ANIMALS[lvl-1];
            spot.innerHTML = `<div class="anim-icon lvl${lvl}">${anim.icon}</div>`;
        }
        
        if (idx === selectedSpotIdx) {
            spot.classList.add('selected');
        }
        
        spot.onclick = () => handleSpotClick(idx);
        grid.appendChild(spot);
    });
}

function handleSpotClick(idx) {
    let lvl = state.habitat[idx];
    
    if (selectedSpotIdx === -1) {
        // Select if there's an animal
        if (lvl > 0) {
            selectedSpotIdx = idx;
            renderHabitat();
        }
    } else {
        if (selectedSpotIdx === idx) {
            // Deselect
            selectedSpotIdx = -1;
            renderHabitat();
            return;
        }
        
        let selLvl = state.habitat[selectedSpotIdx];
        
        if (lvl === 0) {
            // Move
            state.habitat[idx] = selLvl;
            state.habitat[selectedSpotIdx] = 0;
            selectedSpotIdx = -1;
            saveState();
            renderHabitat();
        } else if (lvl === selLvl) {
            // Merge!
            if (lvl < ANIMALS.length) {
                state.habitat[idx] = lvl + 1;
                state.habitat[selectedSpotIdx] = 0;
                selectedSpotIdx = -1;
                
                let newlyUnlocked = false;
                if (lvl + 1 > state.maxLvlReached) {
                    state.maxLvlReached = lvl + 1;
                    newlyUnlocked = true;
                }
                
                saveState();
                renderHabitat();
                updateUI();
                
                if (newlyUnlocked) {
                    showCelebration(lvl + 1);
                }
            } else {
                selectedSpotIdx = -1;
                renderHabitat();
            }
        } else {
            // Different level, select new one
            selectedSpotIdx = idx;
            renderHabitat();
        }
    }
}

function updateUI() {
    document.getElementById('val-score').innerText = Math.floor(state.score);
    document.getElementById('val-income').innerText = getIncome();
    document.getElementById('val-cost').innerText = state.buyCost;
    
    document.getElementById('btn-spawn').disabled = state.score < state.buyCost || !state.habitat.includes(0);
    
    // Progress bar logic
    if (state.maxLvlReached < ANIMALS.length) {
        document.getElementById('val-next').innerText = ANIMALS[state.maxLvlReached].name;
        let progress = (state.maxLvlReached / ANIMALS.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    } else {
        document.getElementById('val-next').innerText = "Max Evolution Reached!";
        document.getElementById('progress-fill').style.width = `100%`;
    }
}

document.getElementById('btn-spawn').addEventListener('click', () => {
    if (state.score >= state.buyCost) {
        let emptyIdx = state.habitat.indexOf(0);
        if (emptyIdx !== -1) {
            state.score -= state.buyCost;
            state.habitat[emptyIdx] = 1;
            state.buyCost = Math.floor(state.buyCost * 1.2); // cost scaling
            saveState();
            renderHabitat();
            updateUI();
            
            postMsg("SCORE_UPDATE", { score: state.score });
        }
    }
});

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Reset habitat?")) {
        localStorage.removeItem(`ff_${slug}_state`);
        state = {
            score: 0,
            buyCost: 10,
            habitat: Array(12).fill(0),
            maxLvlReached: 1
        };
        selectedSpotIdx = -1;
        saveState();
        renderHabitat();
        updateUI();
    }
});

function showCelebration(lvl) {
    const anim = ANIMALS[lvl-1];
    document.getElementById('new-animal-icon').innerText = anim.icon;
    document.getElementById('new-animal-name').innerText = anim.name;
    document.getElementById('celebration-overlay').classList.remove('hidden');
    
    if (lvl === Math.floor(ANIMALS.length / 2)) {
        postMsg("LEVEL_COMPLETE", { score: state.score, coins: 20 });
    } else if (lvl === ANIMALS.length) {
        postMsg("GAME_COMPLETE", { score: state.score, coins: 50 });
    }
}

document.getElementById('btn-close-celeb').addEventListener('click', () => {
    document.getElementById('celebration-overlay').classList.add('hidden');
});

initGame();
