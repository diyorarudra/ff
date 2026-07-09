const slug = "cricket-quiz-league";

const allQuestions = [
    { q: "Who is known as the 'God of Cricket'?", o: ["Sachin Tendulkar", "Virat Kohli", "MS Dhoni", "Ricky Ponting"], a: 0 },
    { q: "How many balls are in a standard over?", o: ["6", "5", "8", "4"], a: 0 },
    { q: "Which country won the first ICC Men's T20 World Cup in 2007?", o: ["India", "Pakistan", "Australia", "England"], a: 0 },
    { q: "What does LBW stand for?", o: ["Leg Before Wicket", "Long Ball Wide", "Left Bat Wicket", "Leg Behind Wicket"], a: 0 },
    { q: "Who holds the record for the highest individual score in ODIs?", o: ["Rohit Sharma", "Martin Guptill", "Virender Sehwag", "Chris Gayle"], a: 0 },
    { q: "The 'Ashes' is a test series played between which two countries?", o: ["England and Australia", "India and Pakistan", "South Africa and New Zealand", "West Indies and England"], a: 0 },
    { q: "Which bowler has taken the most wickets in Test cricket history?", o: ["Muttiah Muralitharan", "Shane Warne", "James Anderson", "Anil Kumble"], a: 0 },
    { q: "What is the maximum number of players on the field for the fielding team?", o: ["11", "10", "12", "9"], a: 0 },
    { q: "In which year did India win its first Cricket World Cup?", o: ["1983", "2011", "2007", "1979"], a: 0 },
    { q: "Who is known as 'Captain Cool'?", o: ["MS Dhoni", "Kane Williamson", "Eoin Morgan", "Sourav Ganguly"], a: 0 },
    { q: "What is the length of a standard cricket pitch?", o: ["22 yards", "20 yards", "24 yards", "18 yards"], a: 0 },
    { q: "Which of these is NOT a fielding position?", o: ["Shortstop", "Gully", "Slip", "Cover"], a: 0 }
];

let questions = [];
let currentQIdx = 0;
let score = 0;
let strikes = 0;
let currentStreak = 0;
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
    questions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQIdx = 0;
    score = 0;
    strikes = 0;
    currentStreak = 0;
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
    
    if (currentStreak >= 3) {
        document.getElementById('streak-indicator').classList.remove('hidden');
    } else {
        document.getElementById('streak-indicator').classList.add('hidden');
    }
    
    const q = questions[currentQIdx];
    document.getElementById('question-text').innerText = q.q;
    
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
    currentStreak = 0;
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
        currentStreak++;
        let points = 10;
        if (currentStreak >= 3) points += 5; // Streak bonus
        score += points;
        postMsg("SCORE_UPDATE", { score });
    } else {
        btnEl.classList.add('wrong');
        strikes++;
        currentStreak = 0;
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
        loadQuestion();
    }
}

function endGame(completed) {
    clearInterval(timer);
    showScreen('end');
    document.getElementById('end-title').innerText = completed ? 'Match Won!' : 'Out!';
    document.getElementById('val-final-score').innerText = score;
    
    let rank = "Rookie";
    if (score > 60) rank = "All-Rounder";
    if (score >= 100) rank = "Cricket Champion";
    document.getElementById('val-rank').innerText = rank;
    
    if (completed) {
        postMsg("GAME_COMPLETE", { score, coins: 20 });
    } else {
        postMsg("GAME_OVER", { score });
    }
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
