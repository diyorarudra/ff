const slug = "daily-brain-training";

let currentRound = 1;
let score = 0;
let timeLeft = 10;
let timerInterval = null;
let currentTask = null; // 'math', 'odd', 'reaction', 'memory'
let taskState = {};

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
    currentRound = 1;
    score = 0;
    postMsg("GAME_START");
    loadRound();
    showScreen('game');
}

function startTimer(seconds) {
    clearInterval(timerInterval);
    timeLeft = seconds;
    document.getElementById('val-timer').innerText = timeLeft;
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('val-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function loadRound() {
    document.getElementById('val-round').innerText = currentRound;
    document.getElementById('val-score').innerText = score;
    document.getElementById('feedback').innerText = '';
    
    const tasks = ['math', 'odd', 'reaction', 'memory'];
    currentTask = tasks[Math.floor(Math.random() * tasks.length)];
    
    if (currentTask === 'math') setupMath();
    else if (currentTask === 'odd') setupOdd();
    else if (currentTask === 'reaction') setupReaction();
    else if (currentTask === 'memory') setupMemory();
}

/* ============ TASKS ============ */

function setupMath() {
    document.getElementById('task-title').innerText = "Solve the Math";
    const ops = ['+', '-'];
    const op = ops[Math.floor(Math.random()*ops.length)];
    let a, b, ans;
    if (op === '+') { a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; ans = a+b; }
    else { a = Math.floor(Math.random()*20)+10; b = Math.floor(Math.random()*a); ans = a-b; }
    
    let options = [ans, ans+1, ans-1, ans+2].sort(() => Math.random() - 0.5);
    
    const c = document.getElementById('task-container');
    c.innerHTML = `
        <div class="math-eq">${a} ${op} ${b} = ?</div>
        <div class="math-options">
            ${options.map(o => `<button class="opt-btn" onclick="checkAnswer(${o === ans})">${o}</button>`).join('')}
        </div>
    `;
    startTimer(10);
}

function setupOdd() {
    document.getElementById('task-title').innerText = "Find the Odd One Out";
    const sets = [
        ['🍎', '🍎', '🍎', '🍅'],
        ['🚗', '🚗', '🚙', '🚗'],
        ['🐶', '🐱', '🐶', '🐶'],
        ['⚽', '🏀', '⚽', '⚽']
    ];
    const set = sets[Math.floor(Math.random()*sets.length)].sort(() => Math.random() - 0.5);
    
    // Find unique
    let counts = {};
    set.forEach(x => counts[x] = (counts[x] || 0) + 1);
    let odd = Object.keys(counts).find(k => counts[k] === 1);
    
    const c = document.getElementById('task-container');
    c.innerHTML = `
        <div class="odd-options">
            ${set.map(x => `<button class="emoji-btn" onclick="checkAnswer(${x === odd})">${x}</button>`).join('')}
        </div>
    `;
    startTimer(8);
}

function setupReaction() {
    document.getElementById('task-title').innerText = "Wait for GREEN, then tap!";
    const c = document.getElementById('task-container');
    c.innerHTML = `<button id="react-btn" class="reaction-btn" onclick="checkReaction(false)">WAIT</button>`;
    
    taskState.reactTimer = setTimeout(() => {
        const btn = document.getElementById('react-btn');
        if (btn) {
            btn.classList.add('ready');
            btn.innerText = "TAP NOW!";
            btn.onclick = () => checkReaction(true);
            taskState.reactStartTime = Date.now();
        }
    }, 1500 + Math.random() * 2000);
    
    startTimer(10);
}

function checkReaction(isValid) {
    clearTimeout(taskState.reactTimer);
    if (!isValid) {
        checkAnswer(false);
    } else {
        const timeTook = Date.now() - taskState.reactStartTime;
        let pts = 100;
        if (timeTook > 400) pts = 50;
        if (timeTook > 800) pts = 20;
        checkAnswer(true, pts);
    }
}

function setupMemory() {
    document.getElementById('task-title').innerText = "Remember the pattern";
    const c = document.getElementById('task-container');
    c.innerHTML = `<div class="mem-grid" id="mem-grid">
        ${Array.from({length:9}).map((_,i) => `<button class="mem-cell" id="mc-${i}"></button>`).join('')}
    </div>`;
    
    taskState.seq = [];
    taskState.idx = 0;
    while(taskState.seq.length < 3) {
        let r = Math.floor(Math.random()*9);
        if (!taskState.seq.includes(r)) taskState.seq.push(r);
    }
    
    // Show pattern
    let t = 0;
    taskState.seq.forEach((sq, i) => {
        setTimeout(() => document.getElementById(`mc-${sq}`).classList.add('active'), t);
        t += 400;
        setTimeout(() => document.getElementById(`mc-${sq}`).classList.remove('active'), t);
        t += 200;
    });
    
    setTimeout(() => {
        document.getElementById('task-title').innerText = "Repeat the pattern!";
        Array.from({length:9}).forEach((_,i) => {
            document.getElementById(`mc-${i}`).onclick = () => checkMemory(i);
        });
        startTimer(10);
    }, t);
}

function checkMemory(cellIdx) {
    const target = taskState.seq[taskState.idx];
    if (cellIdx === target) {
        document.getElementById(`mc-${cellIdx}`).classList.add('active');
        taskState.idx++;
        if (taskState.idx >= taskState.seq.length) {
            checkAnswer(true, 100);
        }
    } else {
        checkAnswer(false);
    }
}

/* ============ GAME FLOW ============ */

function handleTimeout() {
    checkAnswer(false);
}

function checkAnswer(isCorrect, pts = 100) {
    clearInterval(timerInterval);
    const fb = document.getElementById('feedback');
    document.getElementById('task-container').style.pointerEvents = 'none'; // disable clicks
    
    if (isCorrect) {
        score += pts;
        fb.className = 'feedback-text success';
        fb.innerText = 'Correct!';
        postMsg("SCORE_UPDATE", { score });
    } else {
        fb.className = 'feedback-text error';
        fb.innerText = 'Wrong or Too Late!';
    }
    
    document.getElementById('val-score').innerText = score;
    
    setTimeout(() => {
        currentRound++;
        if (currentRound > 10) {
            endGame();
        } else {
            postMsg("LEVEL_COMPLETE", { score, coins: 10 });
            loadRound();
        }
    }, 1000);
}

function endGame() {
    showScreen('end');
    document.getElementById('val-final-score').innerText = score;
    
    let rating = "Beginner";
    if (score > 600) rating = "Sharp Mind";
    if (score > 900) rating = "Brain Master";
    document.getElementById('val-rating').innerText = rating;
    
    postMsg("GAME_COMPLETE", { score, coins: 25 });
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
