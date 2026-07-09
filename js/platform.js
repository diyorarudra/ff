/* platform.js - Economy, UI, and Localization */

// State
let pfState = {
    streak: parseInt(localStorage.getItem('ffliveplay_streak') || '0'),
    lastLogin: localStorage.getItem('ffliveplay_last_login') || '',
    favorites: JSON.parse(localStorage.getItem('ffliveplay_favorites') || '[]'),
    recentlyPlayed: JSON.parse(localStorage.getItem('ffliveplay_recently_played') || '[]'),
    language: localStorage.getItem('ffliveplay_language') || 'en',
    challenges: JSON.parse(localStorage.getItem('ffliveplay_daily_challenges') || '[]')
};

function saveState() {
    localStorage.setItem('ffliveplay_streak', pfState.streak);
    localStorage.setItem('ffliveplay_last_login', pfState.lastLogin);
    localStorage.setItem('ffliveplay_favorites', JSON.stringify(pfState.favorites));
    localStorage.setItem('ffliveplay_recently_played', JSON.stringify(pfState.recentlyPlayed));
    localStorage.setItem('ffliveplay_language', pfState.language);
    localStorage.setItem('ffliveplay_daily_challenges', JSON.stringify(pfState.challenges));
    updateHeaderUI();
}

// Translations
const i18n = {
    en: {
        'Play Now': 'Play Now',
        'Continue Playing': 'Continue Playing',
        'Daily Challenge': 'Daily Challenge',
        'Trending Today': 'Trending Today',
        'Most Played This Week': 'Most Played This Week',
        'New Games': 'New Games',
        'Brain Games': 'Brain Games',
        'Puzzle Games': 'Puzzle Games',
        'Racing Games': 'Racing Games',
        'Cricket Games': 'Cricket Games',
        'Word Games': 'Word Games',
        'Recently Played': 'Recently Played',
        'Favorite Games': 'Favorite Games',
        'Recommended For You': 'Recommended For You',
        'Claim Reward': 'Claim Reward',
        'Advertisement': 'Advertisement'
    },
    hi: {
        'Play Now': 'अभी खेलें',
        'Continue Playing': 'खेलना जारी रखें',
        'Daily Challenge': 'दैनिक चुनौती',
        'Trending Today': 'आज ट्रेंडिंग',
        'Most Played This Week': 'इस हफ्ते सबसे ज्यादा खेले गए',
        'New Games': 'नए खेल',
        'Brain Games': 'दिमागी खेल',
        'Puzzle Games': 'पहेली खेल',
        'Racing Games': 'रेसिंग खेल',
        'Cricket Games': 'क्रिकेट खेल',
        'Word Games': 'शब्द खेल',
        'Recently Played': 'हाल ही में खेले गए',
        'Favorite Games': 'पसंदीदा खेल',
        'Recommended For You': 'आपके लिए अनुशंसित',
        'Claim Reward': 'इनाम प्राप्त करें',
        'Advertisement': 'विज्ञापन'
    },
    gu: {
        'Play Now': 'હવે રમો',
        'Continue Playing': 'રમવાનું ચાલુ રાખો',
        'Daily Challenge': 'દૈનિક પડકાર',
        'Trending Today': 'આજે ટ્રેન્ડિંગ',
        'Most Played This Week': 'આ અઠવાડિયે સૌથી વધુ રમાયેલ',
        'New Games': 'નવી રમતો',
        'Brain Games': 'મગજની રમતો',
        'Puzzle Games': 'પઝલ રમતો',
        'Racing Games': 'રેસિંગ રમતો',
        'Cricket Games': 'ક્રિકેટ રમતો',
        'Word Games': 'શબ્દ રમતો',
        'Recently Played': 'તાજેતરમાં રમાયેલ',
        'Favorite Games': 'મનપસંદ રમતો',
        'Recommended For You': 'તમારા માટે ભલામણ કરેલ',
        'Claim Reward': 'ઇનામ મેળવો',
        'Advertisement': 'જાહેરાત'
    }
};

function T(key) {
    if (i18n[pfState.language] && i18n[pfState.language][key]) {
        return i18n[pfState.language][key];
    }
    return key;
}

// Calculate Level from XP
function getLevelInfo() {
    const level = Math.floor(pfState.xp / 100) + 1;
    const currentLevelXp = pfState.xp % 100;
    return { level, currentLevelXp, nextLevelXp: 100 };
}

function updateHeaderUI() {
    const coins = parseInt(localStorage.getItem('ffliveplay_coins') || '0');
    const xp = parseInt(localStorage.getItem('ffliveplay_xp') || '0');
    const streak = parseInt(localStorage.getItem('ffliveplay_streak') || '0');

    const coinEl = document.getElementById('ui-coins');
    const xpEl = document.getElementById('ui-xp-text');
    const xpBar = document.getElementById('ui-xp-bar');
    const streakEl = document.getElementById('ui-streak');
    
    if (coinEl) coinEl.innerText = coins;
    
    const level = Math.floor(xp / 100) + 1;
    const currentLevelXp = xp % 100;
    const nextLevelXp = 100;
    if (xpEl) xpEl.innerText = `Lvl ${level} - ${currentLevelXp}/${nextLevelXp}`;
    if (xpBar) xpBar.style.width = `${(currentLevelXp / nextLevelXp) * 100}%`;
    
    if (streakEl) streakEl.innerText = `🔥 ${streak}`;
}

// Daily Login Reward
function checkDailyLogin() {
    const today = new Date().toISOString().split('T')[0];
    if (pfState.lastLogin !== today) {
        // New day!
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (pfState.lastLogin === yesterday) {
            pfState.streak += 1;
        } else if (pfState.lastLogin !== '') {
            pfState.streak = 1; // Missed a day
        } else {
            pfState.streak = 1; // First ever
        }
        
        pfState.lastLogin = today;
        saveState();
        showDailyRewardModal();
        generateDailyChallenges();
    }
}

function showDailyRewardModal() {
    const modalHtml = `
    <div id="daily-modal" class="platform-modal-overlay active">
        <div class="platform-modal">
            <div class="text-5xl mb-4">🎁</div>
            <h2 class="modal-title">Daily Reward!</h2>
            <p class="modal-desc">Day ${pfState.streak} Streak. Keep coming back for bigger rewards!</p>
            <button onclick="claimDailyReward()" class="modal-btn">${T('Claim Reward')}</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.claimDailyReward = function() {
    let reward = 50;
    if (pfState.streak === 2) reward = 75;
    if (pfState.streak >= 3) reward = 100;
    if (pfState.streak >= 7) reward = 300;
    
    const currentCoins = parseInt(localStorage.getItem('ffliveplay_coins') || '0');
    localStorage.setItem('ffliveplay_coins', currentCoins + reward);
    saveState();
    
    const modal = document.getElementById('daily-modal');
    if (modal) modal.remove();
};

function generateDailyChallenges() {
    // Generate 5 basic challenges based on existing games
    pfState.challenges = [
        { id: 1, title: 'Play 3 Puzzle Games', type: 'category', target: 'puzzle', goal: 3, progress: 0 },
        { id: 2, title: 'Play 5 different games', type: 'unique_games', goal: 5, progress: 0 },
        { id: 3, title: 'Add 1 game to favorites', type: 'favorite', goal: 1, progress: 0 }
    ];
    saveState();
}

window.toggleFavorite = function(e, slug) {
    e.preventDefault();
    e.stopPropagation();
    const idx = pfState.favorites.indexOf(slug);
    if (idx > -1) {
        pfState.favorites.splice(idx, 1);
        e.target.classList.remove('active');
    } else {
        pfState.favorites.push(slug);
        e.target.classList.add('active');
        
        // Update challenge
        const fChallenge = pfState.challenges.find(c => c.type === 'favorite');
        if (fChallenge && fChallenge.progress < fChallenge.goal) {
            fChallenge.progress++;
            saveState();
        }
    }
    saveState();
};

window.trackGameStart = function(slug, category) {
    // Add to recently played (max 10)
    pfState.recentlyPlayed = pfState.recentlyPlayed.filter(s => s !== slug);
    pfState.recentlyPlayed.unshift(slug);
    if (pfState.recentlyPlayed.length > 10) pfState.recentlyPlayed.pop();
    
    // Give 5 XP for starting
    const currentXP = parseInt(localStorage.getItem('ffliveplay_xp') || '0');
    localStorage.setItem('ffliveplay_xp', currentXP + 5);
    saveState();
};

// Render Sections
function generateGameCard(game) {
    const isFav = pfState.favorites.includes(game.slug);
    return `
    <a href="games/${game.slug}/index.html" onclick="trackGameStart('${game.slug}', '${game.category}')" class="game-card bg-white rounded-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] group relative">
      <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${game.slug}')">❤️</button>
      <div class="w-full h-36 relative overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style="background:${game.color}15">
        <div class="text-7xl opacity-90 drop-shadow-md select-none">${game.icon}</div>
      </div>
      <div class="p-4 flex flex-col flex-grow items-center text-center bg-white rounded-b-2xl">
        <span class="category-badge mb-1.5 uppercase tracking-widest font-extrabold text-[#7361F2]" style="font-size:0.65rem;">${game.category}</span>
        <h3 class="font-extrabold text-gray-800 text-[17px] mb-4 line-clamp-1" style="font-family:var(--font-heading)">${game.title}</h3>
        <button class="bg-[#ef4444] text-white rounded-xl py-2 px-6 text-sm font-bold shadow-md hover:bg-[#dc2626] hover:shadow-lg transition-all w-full mt-auto">${T('Play Now')}</button>
      </div>
    </a>`;
}

function renderSection(title, gamesArray, showAll = false) {
    if (!gamesArray || gamesArray.length === 0) return '';
    const sliceCount = showAll ? gamesArray.length : 12; // Show more games by default if not all
    const cards = gamesArray.slice(0, sliceCount).map(g => generateGameCard(g)).join('');
    
    return `
    <div class="homepage-section mb-10">
        <div class="section-header mb-6">
            <h2 class="section-title text-2xl md:text-3xl font-bold font-heading text-white">${T(title)}</h2>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            ${cards}
        </div>
    </div>
    `;
}

function renderAdPlaceholder(type) {
    const isBanner = type === 'banner';
    const hClass = isBanner ? 'h-[90px] md:h-[120px]' : 'h-[120px] md:h-[180px]';
    return `
    <div class="ad-placeholder ${type} flex items-center justify-center bg-white/5 border border-white/10 rounded-xl my-8 text-gray-500 text-sm font-bold tracking-widest uppercase ${hClass} w-full overflow-hidden">
        <span>${T('Advertisement')}</span>
    </div>
    `;
}

window.renderHomepageSections = function(container, allGames) {
    let html = '';
    
    // Continue Playing (Recently Played)
    if (pfState.recentlyPlayed.length > 0) {
        const recentGames = pfState.recentlyPlayed.map(slug => allGames.find(g => g.slug === slug)).filter(Boolean);
        html += renderSection('Continue Playing', recentGames);
    }
    
    // New Added Games (Show ALL 38 new games)
    const newAdded = allGames.filter(g => g.isNewAddedGame === true);
    if (newAdded.length > 0) {
        html += renderSection('New Games Added', newAdded, true);
    }
    
    // Top Banner Ad
    html += renderAdPlaceholder('banner');

    // Popular Games (Trending mixed)
    const trending = allGames.filter(g => g.isTrending);
    html += renderSection('Popular Games', trending);
    
    // All Games (Show ALL 158 games)
    html += renderSection('All Games', allGames, true);
    
    // Categories (just examples, e.g. Brain, Action)
    html += renderSection('Action & Arcade', allGames.filter(g => g.category === 'action' || g.category === 'arcade'));
    
    // Recommended (Randomized subset)
    const recommended = [...allGames].sort(() => 0.5 - Math.random());
    html += renderSection('Recommended For You', recommended);
    
    // Middle Ad
    html += renderAdPlaceholder('native');
    
    // Favorite Games
    if (pfState.favorites.length > 0) {
        const favGames = pfState.favorites.map(slug => allGames.find(g => g.slug === slug)).filter(Boolean);
        html += renderSection('Favorite Games', favGames);
    }

    container.innerHTML = html;
};

// message listener removed to prevent duplicate reward grants

// Listen for sync events
['storage', 'visibilitychange', 'pageshow', 'ffrewards:wallet-updated'].forEach(evt => {
    window.addEventListener(evt, () => {
        updateHeaderUI();
    });
});

// Hamburger menu logic for all pages
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#hamburger');
    const menu = document.getElementById('mobile-menu');
    
    // If clicked on hamburger
    if (btn && menu) {
        menu.classList.toggle('open');
        btn.classList.toggle('active');
        return;
    }
    
    // If clicked on a link inside mobile menu
    const link = e.target.closest('#mobile-menu a');
    if (link && menu) {
        const hBtn = document.getElementById('hamburger');
        menu.classList.remove('open');
        if (hBtn) hBtn.classList.remove('active');
    }
});

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = pfState.language;
        langSelect.addEventListener('change', (e) => {
            pfState.language = e.target.value;
            saveState();
            location.reload(); // Reload to apply translations
        });
    }
    updateHeaderUI();
    checkDailyLogin();
});
