const slug = "cricket-batting-challenge";

let score = 0;
let ballsLeft = 20;
let wickets = 0;
const target = 60;

let ballState = { active: false, y: 40, speed: 0 };
let gameLoop = null;

const PITCH_START_Y = 40;
const PITCH_END_Y = 320;
const PERFECT_Y = 300; // Perfect hit zone y
const HIT_TOLERANCE = 25; // pixels

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
    score = 0;
    ballsLeft = 20;
    wickets = 0;
    ballState.active = false;
    
    updateUI();
    postMsg("GAME_START");
    showScreen('game');
    
    setTimeout(bowlBall, 1000);
}

function updateUI() {
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-balls').innerText = ballsLeft;
    document.getElementById('val-wickets').innerText = wickets;
}

function bowlBall() {
    if (ballsLeft <= 0 || wickets >= 3 || score >= target) {
        endGame();
        return;
    }
    
    // reset visual
    const ballEl = document.getElementById('ball');
    ballEl.style.transition = 'none';
    ballEl.style.top = PITCH_START_Y + 'px';
    ballEl.classList.remove('hidden');
    
    document.getElementById('hit-zone').classList.remove('active');
    
    ballState.y = PITCH_START_Y;
    ballState.active = true;
    // random speed between 4 and 8 pixels per frame (~60fps) -> approx 1 to 2 seconds to reach batsman
    ballState.speed = 4 + Math.random() * 4; 
    
    cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(animateBall);
}

function animateBall() {
    if (!ballState.active) return;
    
    ballState.y += ballState.speed;
    const ballEl = document.getElementById('ball');
    ballEl.style.top = ballState.y + 'px';
    
    // highlight hit zone if in range
    const dist = Math.abs(ballState.y - PERFECT_Y);
    if (dist < HIT_TOLERANCE + 10) {
        document.getElementById('hit-zone').classList.add('active');
    } else {
        document.getElementById('hit-zone').classList.remove('active');
    }
    
    // Missed completely
    if (ballState.y > PITCH_END_Y + 20) {
        ballState.active = false;
        ballEl.classList.add('hidden');
        handleResult("MISS");
        return;
    }
    
    gameLoop = requestAnimationFrame(animateBall);
}

document.getElementById('btn-swing').addEventListener('mousedown', swingBat);
document.getElementById('btn-swing').addEventListener('touchstart', (e) => { e.preventDefault(); swingBat(); });

// allow keyboard spacebar
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && screens.game.classList.contains('active')) {
        swingBat();
    }
});

function swingBat() {
    if (!ballState.active) return;
    
    // Animate batsman
    const batEl = document.getElementById('batsman');
    batEl.classList.add('swing');
    setTimeout(() => batEl.classList.remove('swing'), 200);
    
    ballState.active = false; // stop ball
    const ballEl = document.getElementById('ball');
    
    let dist = Math.abs(ballState.y - PERFECT_Y);
    let result = "";
    
    if (dist < 10) {
        result = "SIX";
        score += 6;
        animateBallHit(true); // hit away
    } else if (dist < 20) {
        result = "FOUR";
        score += 4;
        animateBallHit(true);
    } else if (dist < HIT_TOLERANCE) {
        result = "SINGLE";
        score += 1;
        animateBallHit(true);
    } else {
        result = "WICKET";
        wickets++;
        ballEl.classList.add('hidden'); // bowled out
    }
    
    handleResult(result);
}

function animateBallHit(hit) {
    const ballEl = document.getElementById('ball');
    ballEl.style.transition = 'top 0.5s ease-out, left 0.5s ease-out';
    ballEl.style.top = '-50px';
    // random direction
    ballEl.style.left = (Math.random() * 200) + 'px';
}

function handleResult(resultText) {
    if (resultText === "MISS") {
        resultText = "WICKET";
        wickets++;
    }
    
    ballsLeft--;
    updateUI();
    
    // Show text
    const resEl = document.getElementById('shot-result');
    resEl.innerText = resultText;
    if(resultText === "SIX" || resultText === "FOUR") resEl.style.color = "#fcd34d"; // Gold
    else if(resultText === "WICKET") resEl.style.color = "#ef4444"; // Red
    else resEl.style.color = "#fff";
    
    resEl.classList.add('show');
    
    setTimeout(() => {
        resEl.classList.remove('show');
        if (ballsLeft <= 0 || wickets >= 3 || score >= target) {
            endGame();
        } else {
            bowlBall(); // next ball
        }
    }, 1200);
}

function endGame() {
    cancelAnimationFrame(gameLoop);
    showScreen('end');
    
    document.getElementById('val-final-score').innerText = score;
    const msgEl = document.getElementById('end-msg');
    
    let win = false;
    if (score >= target) {
        win = true;
        msgEl.innerText = "🏆 Target Reached! You Win!";
        msgEl.style.color = "var(--success)";
    } else if (wickets >= 3) {
        msgEl.innerText = "❌ All Out!";
        msgEl.style.color = "var(--danger)";
    } else {
        msgEl.innerText = "⏰ Out of balls!";
        msgEl.style.color = "var(--danger)";
    }
    
    if (win) {
        postMsg("GAME_COMPLETE", { score, coins: 50 });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
