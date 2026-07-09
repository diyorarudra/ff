const slug = "escape-room-mini";

let room = 1;
let score = 1000;
let inventory = [];
let selectedItem = null;
let currentPuzzle = null; // To track open puzzle state
let scoreInterval = null;

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
    room = 1;
    score = 1000;
    inventory = [];
    selectedItem = null;
    postMsg("GAME_START");
    startRoom();
    showScreen('game');
    
    clearInterval(scoreInterval);
    scoreInterval = setInterval(() => {
        if(score > 100) score--;
        updateUI();
    }, 2000); // lose 1 pt every 2 sec
}

// Room Definitions
const rooms = {
    1: {
        bg: "linear-gradient(180deg, #475569 60%, #334155 40%)", // Gray room
        hint: "Check the painting for a code, then use the keypad on the door.",
        objects: [
            { id: "door", x: 40, y: 30, icon: "🚪", size: 5, action: "open_puzzle", puzzleType: "keypad", puzzleAns: "724" },
            { id: "painting", x: 75, y: 35, icon: "🖼️", size: 3, action: "msg", text: "A painting of 7 apples, 2 dogs, and 4 birds." },
            { id: "plant", x: 10, y: 50, icon: "🪴", size: 3, action: "msg", text: "Just a dusty plant." }
        ]
    },
    2: {
        bg: "linear-gradient(180deg, #7c2d12 60%, #451a03 40%)", // Brown room
        hint: "The key is hidden. Maybe move something out of the way?",
        objects: [
            { id: "door", x: 40, y: 30, icon: "🚪", size: 5, action: "require_item", req: "🔑", successMsg: "Door unlocked!" },
            { id: "rug", x: 30, y: 80, icon: "🟫", size: 4, action: "move", moveX: 50, reveal: { id: "key", x: 40, y: 80, icon: "🔑", size: 2, action: "collect" } },
            { id: "bookshelf", x: 10, y: 25, icon: "📚", size: 4, action: "msg", text: "Many heavy books." }
        ]
    },
    3: {
        bg: "linear-gradient(180deg, #1e3a8a 60%, #172554 40%)", // Blue room
        hint: "Match the color code. Look at the colored books.",
        objects: [
            { id: "door", x: 40, y: 30, icon: "🚪", size: 5, action: "open_puzzle", puzzleType: "colors", puzzleAns: ["🔴", "🔵", "🟡"] },
            { id: "book1", x: 20, y: 40, icon: "📕", size: 2, action: "msg", text: "Volume 1 is Red." },
            { id: "book2", x: 75, y: 70, icon: "📘", size: 2, action: "msg", text: "Volume 2 is Blue." },
            { id: "book3", x: 15, y: 80, icon: "📒", size: 2, action: "msg", text: "Volume 3 is Yellow." }
        ]
    },
    4: {
        bg: "linear-gradient(180deg, #064e3b 60%, #022c22 40%)", // Green room
        hint: "You need a battery for the remote to open the garage door.",
        objects: [
            { id: "door", x: 40, y: 30, icon: "⛩️", size: 5, action: "msg", text: "A mechanical door. It needs a signal." },
            { id: "remote", x: 80, y: 50, icon: "📱", size: 2, action: "combine", req: "🔋", give: "📡", giveMsg: "Remote powered on!" },
            { id: "box", x: 20, y: 75, icon: "📦", size: 3, action: "collect_give", give: "🔋", text: "Found a battery inside!" },
            { id: "receiver", x: 60, y: 20, icon: "📻", size: 2, action: "require_item", req: "📡", successMsg: "Signal received!" }
        ]
    },
    5: {
        bg: "linear-gradient(180deg, #4c1d95 60%, #2e1065 40%)", // Purple room
        hint: "Follow the sequence shown on the monitor to unlock the safe.",
        objects: [
            { id: "safe", x: 40, y: 50, icon: "🗄️", size: 4, action: "open_puzzle", puzzleType: "sequence", puzzleAns: [1, 3, 2, 4] },
            { id: "monitor", x: 70, y: 30, icon: "🖥️", size: 3, action: "msg", text: "Displays: Top-Left, Bottom-Left, Top-Right, Bottom-Right" },
            { id: "door", x: 10, y: 30, icon: "🚪", size: 5, action: "require_item", req: "🏆", successMsg: "You escaped the final room!" }
        ]
    }
};

let currentRoomData = null;

function startRoom() {
    currentRoomData = JSON.parse(JSON.stringify(rooms[room])); // deep copy
    inventory = [];
    selectedItem = null;
    closePuzzle();
    updateUI();
    renderRoom();
    renderInventory();
}

function renderRoom() {
    const scene = document.getElementById('room-scene');
    scene.style.background = currentRoomData.bg;
    scene.innerHTML = '';
    
    currentRoomData.objects.forEach(obj => {
        let el = document.createElement('div');
        el.className = 'room-obj';
        el.id = 'obj-' + obj.id;
        el.innerText = obj.icon;
        el.style.left = obj.x + '%';
        el.style.top = obj.y + '%';
        el.style.fontSize = obj.size + 'rem';
        
        el.addEventListener('click', () => handleObjectClick(obj));
        scene.appendChild(el);
    });
}

function handleObjectClick(obj) {
    if (obj.action === "msg") {
        showMessage(obj.text);
    } 
    else if (obj.action === "collect") {
        inventory.push(obj.icon);
        showMessage("Collected: " + obj.icon);
        // remove from room
        currentRoomData.objects = currentRoomData.objects.filter(o => o.id !== obj.id);
        renderRoom();
        renderInventory();
    }
    else if (obj.action === "collect_give") {
        inventory.push(obj.give);
        showMessage(obj.text);
        obj.action = "msg";
        obj.text = "Empty.";
        renderInventory();
    }
    else if (obj.action === "move") {
        let el = document.getElementById('obj-' + obj.id);
        el.style.transform = `translateX(${obj.moveX}px)`;
        obj.action = "msg"; // only move once
        obj.text = "Nothing else under here.";
        // reveal new object
        if (obj.reveal) {
            currentRoomData.objects.push(obj.reveal);
            renderRoom();
            // preserve moved state visually
            document.getElementById('obj-' + obj.id).style.transform = `translateX(${obj.moveX}px)`;
        }
    }
    else if (obj.action === "require_item") {
        if (selectedItem === obj.req) {
            showMessage(obj.successMsg);
            // consume item
            inventory = inventory.filter(i => i !== selectedItem);
            selectedItem = null;
            renderInventory();
            
            // If door, progress room
            if (obj.id === "door" || obj.id === "receiver") {
                setTimeout(nextRoom, 1500);
            }
        } else {
            showMessage("It's locked or missing something.");
        }
    }
    else if (obj.action === "combine") {
        if (selectedItem === obj.req) {
            showMessage(obj.giveMsg);
            inventory = inventory.filter(i => i !== selectedItem);
            inventory.push(obj.give);
            selectedItem = null;
            obj.action = "msg";
            obj.text = "Powered on.";
            renderInventory();
        } else {
            showMessage("Needs a power source.");
        }
    }
    else if (obj.action === "open_puzzle") {
        openPuzzle(obj);
    }
}

// Puzzles
let keypadInput = "";
let seqInput = [];

function openPuzzle(obj) {
    currentPuzzle = obj;
    const overlay = document.getElementById('puzzle-overlay');
    const content = document.getElementById('puzzle-content');
    content.innerHTML = '';
    
    let title = document.createElement('div');
    title.className = "puzzle-title";
    
    if (obj.puzzleType === "keypad") {
        title.innerText = "Enter PIN code";
        content.appendChild(title);
        
        let disp = document.createElement('div');
        disp.id = "keypad-display";
        disp.innerText = "_ _ _";
        content.appendChild(disp);
        keypadInput = "";
        
        let pad = document.createElement('div');
        pad.className = "numpad";
        for(let i=1; i<=9; i++) {
            let btn = document.createElement('button');
            btn.className = "numpad-btn";
            btn.innerText = i;
            btn.onclick = () => {
                if(keypadInput.length < 3) keypadInput += i;
                disp.innerText = keypadInput.padEnd(3, '_').split('').join(' ');
                if(keypadInput.length === 3) {
                    setTimeout(() => {
                        if (keypadInput === obj.puzzleAns) puzzleSuccess(obj);
                        else { showMessage("ERROR"); keypadInput = ""; disp.innerText = "_ _ _"; score -= 10; updateUI();}
                    }, 500);
                }
            };
            pad.appendChild(btn);
        }
        content.appendChild(pad);
    }
    else if (obj.puzzleType === "colors") {
        title.innerText = "Match Colors";
        content.appendChild(title);
        
        let currentColors = ["⚪", "⚪", "⚪"];
        const options = ["🔴", "🔵", "🟡", "🟢"];
        
        let pad = document.createElement('div');
        pad.style.display = "flex"; pad.style.gap = "10px"; pad.style.justifyContent = "center";
        
        for(let i=0; i<3; i++) {
            let btn = document.createElement('button');
            btn.className = "numpad-btn";
            btn.innerText = currentColors[i];
            btn.onclick = () => {
                let currIdx = options.indexOf(currentColors[i]);
                currentColors[i] = options[(currIdx + 1) % options.length];
                btn.innerText = currentColors[i];
                
                // check
                if (currentColors.join('') === obj.puzzleAns.join('')) {
                    setTimeout(() => puzzleSuccess(obj), 500);
                }
            };
            pad.appendChild(btn);
        }
        content.appendChild(pad);
    }
    else if (obj.puzzleType === "sequence") {
        title.innerText = "Press in correct order";
        content.appendChild(title);
        seqInput = [];
        
        let grid = document.createElement('div');
        grid.style.display = "grid"; grid.style.gridTemplateColumns = "1fr 1fr"; grid.style.gap = "10px";
        
        for(let i=1; i<=4; i++) {
            let btn = document.createElement('button');
            btn.className = "seq-btn";
            btn.innerText = "🟦";
            btn.onclick = () => {
                btn.classList.add('lit');
                seqInput.push(i);
                
                // check length
                if (seqInput.length === 4) {
                    setTimeout(() => {
                        let correct = true;
                        for(let j=0; j<4; j++) if(seqInput[j] !== obj.puzzleAns[j]) correct = false;
                        if(correct) puzzleSuccess(obj);
                        else { 
                            showMessage("ERROR"); 
                            seqInput = []; 
                            document.querySelectorAll('.seq-btn').forEach(b => b.classList.remove('lit'));
                            score -= 10; updateUI();
                        }
                    }, 500);
                }
            };
            grid.appendChild(btn);
        }
        content.appendChild(grid);
    }
    
    overlay.classList.remove('hidden');
}

function closePuzzle() {
    document.getElementById('puzzle-overlay').classList.add('hidden');
    currentPuzzle = null;
}

document.getElementById('btn-close-puzzle').addEventListener('click', closePuzzle);

function puzzleSuccess(obj) {
    closePuzzle();
    showMessage("Unlocked!");
    
    if (obj.id === "door") {
        setTimeout(nextRoom, 1000);
    } else if (obj.id === "safe") {
        // give final key
        currentRoomData.objects = currentRoomData.objects.filter(o => o.id !== obj.id);
        currentRoomData.objects.push({ id: "trophy", x: 40, y: 50, icon: "🏆", size: 3, action: "collect" });
        renderRoom();
    }
}

function nextRoom() {
    if (room === 5) {
        endGame();
    } else {
        postMsg("LEVEL_COMPLETE", { score, coins: 20 });
                showLevelCompleteModal(() => {
                    room++;
                    startRoom();
                });
    }
}

function renderInventory() {
    const slots = document.getElementById('inventory-slots');
    slots.innerHTML = '';
    
    for(let i=0; i<4; i++) {
        let slot = document.createElement('div');
        slot.className = 'inv-slot';
        if (inventory[i]) {
            slot.innerText = inventory[i];
            if (selectedItem === inventory[i]) slot.classList.add('selected');
            
            slot.addEventListener('click', () => {
                if (selectedItem === inventory[i]) selectedItem = null;
                else selectedItem = inventory[i];
                renderInventory();
            });
        }
        slots.appendChild(slot);
    }
}

function showMessage(msg) {
    const banner = document.getElementById('msg-banner');
    banner.innerText = msg;
    banner.classList.remove('hidden');
    setTimeout(() => {
        banner.classList.add('hidden');
    }, 2000);
}

document.getElementById('btn-hint').addEventListener('click', () => {
    if (window.FFRewards) {
        if (typeof hints !== 'undefined' && hints > 0) {
            // let normal logic run
        } else {
            window.FFRewards.showSpendConfirm({
                title: "Use Hint?",
                message: "Use 20 coins for a hint?",
                cost: 20,
                itemId: "hint_pack",
                onConfirm: (success) => {
                    if (success) {
                        if (typeof hints !== 'undefined') hints++; 
                        ffOriginalHintLogic();
                    }
                }
            });
            return;
        }
    }
    ffOriginalHintLogic();
});

function ffOriginalHintLogic() {

    if (score >= 50) {
        score -= 50;
        updateUI();
        if (currentRoomData && currentRoomData.hint) {
            showMessage("HINT: " + currentRoomData.hint);
        }
    }

}


function updateUI() {
    document.getElementById('val-room').innerText = room;
    document.getElementById('val-score').innerText = score;
}

function endGame() {
    clearInterval(scoreInterval);
    showScreen('end');
    document.getElementById('val-final-score').innerText = score;
    postMsg("GAME_COMPLETE", { score, coins: Math.floor(score/10) });
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

// --- SKIP LEVEL INJECTION ---
window.addEventListener('DOMContentLoaded', () => {
    const actionsArea = document.querySelector('.actions-area') || document.querySelector('.header') || document.getElementById('screen-game');
    if (!actionsArea) return;
    
    const skipBtn = document.createElement('button');
    skipBtn.id = 'btn-ff-skip';
    skipBtn.className = 'btn-sm';
    skipBtn.style.backgroundColor = '#8b5cf6';
    skipBtn.style.color = '#fff';
    skipBtn.style.marginLeft = '10px';
    skipBtn.innerText = '⏭️ Skip (50)';
    
    skipBtn.addEventListener('click', () => {
        if (window.FFRewards) {
            window.FFRewards.showSpendConfirm({
                title: "Skip Level?",
                message: "Use 50 coins or a Skip Token to skip this level?",
                cost: 50,
                itemId: "skip_level",
                onConfirm: (success) => {
                    if (success) {
                        // Trigger level complete directly
                        if (typeof score !== 'undefined') score += 10;
                        postMsg("LEVEL_COMPLETE", { score: (typeof score !== 'undefined' ? score : 10), coins: 0 }); // 0 coins since they skipped
                        if (typeof showLevelCompleteModal === 'function') {
                            showLevelCompleteModal(() => {
                                // Find how this game goes to next level
                                if (typeof currentLevel !== 'undefined') currentLevel++;
                                else if (typeof level !== 'undefined') level++;
                                
                                if (typeof initGame === 'function' && slug === 'escape-room-mini') {
                                    // custom for escape-room-mini
                                    if (typeof currentRoom !== 'undefined') currentRoom++; loadRoom();
                                } else if (typeof loadRound === 'function') {
                                    loadRound();
                                } else if (typeof startLevel === 'function') {
                                    startLevel();
                                } else if (typeof initGame === 'function') {
                                    initGame();
                                }
                            });
                        }
                    }
                }
            });
        }
    });
    
    if (actionsArea.id === 'screen-game') {
        // Fallback
        actionsArea.appendChild(skipBtn);
    } else {
        actionsArea.appendChild(skipBtn);
    }
});
