const slug = "bollywood-quiz-battle";

const allQuestions = [
    { q: "Who is known as the 'King of Bollywood'?", o: ["Shah Rukh Khan", "Salman Khan", "Aamir Khan", "Amitabh Bachchan"], a: 0 },
    { q: "Which movie is famous for the dialogue 'Kitne Aadmi The'?", o: ["Sholay", "Don", "Deewaar", "Mughal-e-Azam"], a: 0 },
    { q: "Who directed the movie '3 Idiots'?", o: ["Rajkumar Hirani", "Karan Johar", "Sanjay Leela Bhansali", "Zoya Akhtar"], a: 0 },
    { q: "What is the name of India's biggest film industry?", o: ["Bollywood", "Tollywood", "Kollywood", "Hollywood"], a: 0 },
    { q: "Which actor played the role of 'Munna Bhai'?", o: ["Sanjay Dutt", "Arshad Warsi", "Sunil Shetty", "Akshay Kumar"], a: 0 },
    { q: "Who is the legendary playback singer known as the 'Nightingale of India'?", o: ["Lata Mangeshkar", "Asha Bhosle", "Alka Yagnik", "Shreya Ghoshal"], a: 0 },
    { q: "Which Bollywood movie was nominated for an Oscar in 2001?", o: ["Lagaan", "Swades", "Devdas", "Rang De Basanti"], a: 0 },
    { q: "In 'Dilwale Dulhania Le Jayenge', what is the name of SRK's character?", o: ["Raj", "Rahul", "Prem", "Rohan"], a: 0 },
    { q: "Who played 'Bhallaladeva' in Baahubali?", o: ["Rana Daggubati", "Prabhas", "Sathyaraj", "Ram Charan"], a: 0 },
    { q: "Which actress made her debut in 'Om Shanti Om'?", o: ["Deepika Padukone", "Anushka Sharma", "Sonam Kapoor", "Katrina Kaif"], a: 0 },
    { q: "What is Amitabh Bachchan's famous TV show?", o: ["Kaun Banega Crorepati", "Bigg Boss", "Khatron Ke Khiladi", "Dance India Dance"], a: 0 },
    { q: "Which movie features the song 'Chaiyya Chaiyya'?", o: ["Dil Se", "Kuch Kuch Hota Hai", "Mohabbatein", "Darr"], a: 0 }
];

let questions = [];
let currentQIdx = 0;
let score = 0;
let strikes = 0;
let timeLeft = 15;
let timer = null;

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
    hasRevived = false;
    questions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQIdx = 0;
    score = 0;
    strikes = 0;
    postMsg("GAME_START");
    loadQuestion();
    showScreen('game');
}

function startTimer() {
    clearInterval(timer);
    timeLeft = 15;
    document.getElementById('val-timer').innerText = timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('val-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function loadQuestion() {
    document.getElementById('val-round').innerText = currentQIdx + 1;
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-strikes').innerText = strikes;
    
    const q = questions[currentQIdx];
    document.getElementById('question-text').innerText = q.q;
    
    // Shuffle options while keeping track of correct answer
    const opts = q.o.map((text, idx) => ({ text, isCorrect: idx === q.a }));
    opts.sort(() => 0.5 - Math.random());
    
    const cont = document.getElementById('options-container');
    cont.innerHTML = opts.map((opt, i) => 
        `<button class="opt-btn" onclick="checkAnswer(${opt.isCorrect}, this)">${opt.text}</button>`
    ).join('');
    
    startTimer();
}

function handleTimeout() {
    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach(b => b.disabled = true);
    strikes++;
    if (strikes >= 3) {
        setTimeout(() => endGame(false), 1000);
    } else {
        setTimeout(nextQuestion, 1000);
    }
}

function checkAnswer(isCorrect, btnEl) {
    clearInterval(timer);
    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach(b => b.disabled = true);
    
    if (isCorrect) {
        btnEl.classList.add('correct');
        const points = 10 + (timeLeft > 10 ? 5 : 0); // Speed bonus
        score += points;
        postMsg("SCORE_UPDATE", { score });
    } else {
        btnEl.classList.add('wrong');
        strikes++;
        // Find correct and highlight
        const q = questions[currentQIdx];
        btns.forEach(b => {
            if (b.innerText === q.o[q.a]) b.classList.add('correct');
        });
    }
    
    document.getElementById('val-score').innerText = score;
    document.getElementById('val-strikes').innerText = strikes;
    
    if (strikes >= 3) {
        setTimeout(() => endGame(false), 1500);
    } else {
        setTimeout(nextQuestion, 1500);
    }
}

function nextQuestion() {
    currentQIdx++;
    if (currentQIdx >= 10) {
        endGame(true);
    } else {
        postMsg("LEVEL_COMPLETE", { score, coins: 10 });
                showLevelCompleteModal(() => {
                    loadQuestion();
                });
    }
}

function endGame(completed) {
    clearInterval(timer);
    showScreen('end');
    document.getElementById('end-title').innerText = completed ? 'Quiz Complete!' : 'Game Over';
    document.getElementById('val-final-score').innerText = score;
    
    let rank = "Fan";
    if (score > 60) rank = "Super Fan";
    if (score >= 100) rank = "Bollywood Champion";
    document.getElementById('val-rank').innerText = rank;
    
    if (completed) {
        postMsg("GAME_COMPLETE", { score, coins: 20 });
    } else {
        postMsg("GAME_OVER", { score });
    }
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


let hasRevived = false;
function endMatch(completed) {
    if (!completed && window.FFRewards && !hasRevived) {
        window.FFRewards.showSpendConfirm({
            title: "Revive?",
            message: "Use 30 coins or a Revive Token to continue?",
            cost: 30,
            itemId: "revive_token",
            onConfirm: (success) => {
                if (success) {
                    hasRevived = true;
                    lives = 3;
                    updateUI();
                    loadQuestion();
                } else {
                    ffOriginalEndMatch(completed);
                }
            }
        });
        setTimeout(() => {
            document.getElementById('ff-confirm-btn-cancel').onclick = () => {
                document.getElementById('ff-confirm-modal').classList.add('hidden');
                ffOriginalEndMatch(completed);
            };
        }, 100);
        return;
    }
    ffOriginalEndMatch(completed);
}
