const slug = "gk-quiz-india";

const allQuestions = [
    { q: "What is the capital city of India?", o: ["New Delhi", "Mumbai", "Kolkata", "Chennai"], a: 0, e: "New Delhi became the capital of India in 1911, shifting from Kolkata." },
    { q: "Which is the national animal of India?", o: ["Tiger", "Lion", "Elephant", "Leopard"], a: 0, e: "The Bengal Tiger is the national animal of India, known for its grace and power." },
    { q: "Who was the first Prime Minister of independent India?", o: ["Jawaharlal Nehru", "Mahatma Gandhi", "Sardar Vallabhbhai Patel", "Dr. B.R. Ambedkar"], a: 0, e: "Jawaharlal Nehru served as the first Prime Minister of India from 1947 to 1964." },
    { q: "Which planet is known as the Red Planet?", o: ["Mars", "Venus", "Jupiter", "Saturn"], a: 0, e: "Mars is called the Red Planet because of iron oxide prevalent on its surface." },
    { q: "What is the national sport of India?", o: ["Field Hockey", "Cricket", "Kabaddi", "Football"], a: 0, e: "Field Hockey is considered the national sport of India." },
    { q: "Which Indian festival is known as the 'Festival of Lights'?", o: ["Diwali", "Holi", "Navratri", "Eid"], a: 0, e: "Diwali symbolizes the spiritual victory of light over darkness." },
    { q: "Who wrote the Indian National Anthem?", o: ["Rabindranath Tagore", "Bankim Chandra Chatterjee", "Sarojini Naidu", "Subhas Chandra Bose"], a: 0, e: "Rabindranath Tagore composed 'Jana Gana Mana'." },
    { q: "What is the longest river in India?", o: ["Ganga", "Yamuna", "Brahmaputra", "Godavari"], a: 0, e: "The Ganga is the longest river flowing entirely within India." },
    { q: "Who is known as the 'Iron Man of India'?", o: ["Sardar Vallabhbhai Patel", "Bhagat Singh", "Lal Bahadur Shastri", "Bipin Chandra Pal"], a: 0, e: "Sardar Vallabhbhai Patel played a leading role in the country's struggle for independence and guided its integration." },
    { q: "Which gas is most abundant in the Earth's atmosphere?", o: ["Nitrogen", "Oxygen", "Carbon Dioxide", "Hydrogen"], a: 0, e: "Nitrogen makes up about 78% of the Earth's atmosphere." },
    { q: "Where is the Taj Mahal located?", o: ["Agra", "Jaipur", "Delhi", "Lucknow"], a: 0, e: "The Taj Mahal is an ivory-white marble mausoleum on the right bank of the river Yamuna in Agra." },
    { q: "What is the currency of India?", o: ["Rupee", "Rupiah", "Taka", "Pound"], a: 0, e: "The Indian Rupee (INR) is the official currency." }
];

let questions = [];
let currentQIdx = 0;
let score = 0;
let timeLeft = 15;
let timer = null;
let currentQuestionObj = null;

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
    document.getElementById('explanation-box').classList.add('hidden');
    
    currentQuestionObj = questions[currentQIdx];
    document.getElementById('question-text').innerText = currentQuestionObj.q;
    
    const opts = currentQuestionObj.o.map((text, idx) => ({ text, isCorrect: idx === currentQuestionObj.a }));
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
    
    // Highlight correct
    btns.forEach(b => {
        if (b.innerText === currentQuestionObj.o[currentQuestionObj.a]) b.classList.add('correct');
    });
    
    showExplanation();
}

function checkAnswer(isCorrect, btnEl) {
    clearInterval(timer);
    const btns = document.querySelectorAll('.opt-btn');
    btns.forEach(b => b.disabled = true);
    
    if (isCorrect) {
        btnEl.classList.add('correct');
        score += 10;
        postMsg("SCORE_UPDATE", { score });
    } else {
        btnEl.classList.add('wrong');
        btns.forEach(b => {
            if (b.innerText === currentQuestionObj.o[currentQuestionObj.a]) b.classList.add('correct');
        });
    }
    
    document.getElementById('val-score').innerText = score;
    showExplanation();
}

function showExplanation() {
    document.getElementById('explanation-text').innerText = currentQuestionObj.e;
    document.getElementById('explanation-box').classList.remove('hidden');
}

document.getElementById('btn-next').addEventListener('click', () => {
    currentQIdx++;
    if (currentQIdx >= 10) {
        endGame();
    } else {
        postMsg("LEVEL_COMPLETE", { score, coins: 10 });
        loadQuestion();
    }
});

function endGame() {
    showScreen('end');
    document.getElementById('val-final-score').innerText = score;
    postMsg("GAME_COMPLETE", { score, coins: 20 });
}

document.getElementById('btn-start').addEventListener('click', initGame);
document.getElementById('btn-restart').addEventListener('click', initGame);
