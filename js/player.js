/* player.js - Unified Player Logic */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('game');
    
    // Ensure GAMES array is available from main.js
    if (typeof GAMES === 'undefined') {
        console.error("GAMES array not loaded.");
        return;
    }

    const game = GAMES.find(g => g.slug === slug);
    const errorEl = document.getElementById('player-error');
    const uiEl = document.getElementById('player-ui');
    
    if (!game) {
        document.getElementById('error-title').innerText = "Choose a Game to Play";
        document.getElementById('error-desc').innerText = "Select from our collection of free online games below.";
        errorEl.classList.remove('hidden');
        renderRecommendedGames();
        return;
    }
    
    uiEl.classList.remove('hidden');
    
    // Translations
    const T = typeof window.T === 'function' ? window.T : (k) => k;

    // Hydrate UI
    document.title = `${game.title} - Play Free on FF Live Play`;
    document.getElementById('game-title').innerText = game.title;
    document.getElementById('game-category').innerText = T(game.category);
    document.getElementById('game-desc').innerText = game.desc;
    document.getElementById('game-reward-coins').innerText = game.rewardCoins || 10;
    
    // Buttons translation
    document.getElementById('start-game-btn').innerText = T('Play Now');
    document.getElementById('txt-fav').innerText = T('Favorite');
    document.getElementById('txt-share').innerText = T('Share');
    document.getElementById('txt-fullscreen').innerText = T('Fullscreen');
    
    const overlay = document.getElementById('play-overlay');
    overlay.style.backgroundImage = `url(assets/thumbnails/${game.slug}.png)`;
    
    // Favorite Button Status
    const favBtn = document.getElementById('btn-fav');
    if (pfState && pfState.favorites && pfState.favorites.includes(game.slug)) {
        favBtn.classList.add('active');
    }
    
    favBtn.addEventListener('click', (e) => {
        if (typeof window.toggleFavorite === 'function') {
            window.toggleFavorite(e, game.slug);
            favBtn.classList.toggle('active', pfState.favorites.includes(game.slug));
        }
    });
    
    // Start Game logic
    document.getElementById('start-game-btn').addEventListener('click', () => {
        console.log(`[Player] Selected slug: ${slug}`);
        console.log(`[Player] Matched game object:`, game);
        
        overlay.style.display = 'none';
        const iframe = document.getElementById('game-iframe');
        iframe.style.display = 'block';
        iframe.style.pointerEvents = 'auto';
        iframe.style.zIndex = '5';
        
        const srcPath = `games/${game.slug}/index.html`;
        console.log(`[Player] Loading iframe src: ${srcPath}`);
        
        iframe.onload = () => {
            console.log(`[Player] Iframe load success for ${game.slug}`);
        };
        
        iframe.onerror = () => {
            console.error(`[Player] Iframe load error for ${game.slug}`);
            iframe.outerHTML = `<div style="padding: 3rem; color: white; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
                <p class="mb-4">Unable to load game.</p>
                <a href="games/${game.slug}/index.html" class="px-6 py-2 bg-[#7361F2] text-white rounded-full font-bold mx-auto" target="_blank">Open direct game</a>
            </div>`;
        };
        
        iframe.src = srcPath;
        
        // Tracking & XP
        if (typeof window.trackGameStart === 'function') {
            window.trackGameStart(game.slug, game.category);
        }
        
        startRewardTimer(game.slug);
    });
    
    // Fullscreen logic
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
        const container = document.getElementById('iframe-container');
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
    });
    
    // Share logic
    document.getElementById('btn-share').addEventListener('click', async () => {
        const shareData = {
            title: game.title,
            text: `Play ${game.title} for free on FF Live Play!`,
            url: window.location.href
        };
        
        // Challenge tracking hook
        const trackShareChallenge = () => {
            if (pfState && pfState.challenges) {
                const sChallenge = pfState.challenges.find(c => c.type === 'share' || c.title.includes('Share'));
                if (sChallenge && sChallenge.progress < sChallenge.goal) {
                    sChallenge.progress++;
                    window.saveState();
                }
            }
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                trackShareChallenge();
                showToast("Thanks for sharing!");
            } catch (err) {
                console.log("Share cancelled");
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            trackShareChallenge();
            showToast("Link copied to clipboard!");
        }
    });
    
    // Render Related Games
    renderRelatedGames(game);
});

function renderRelatedGames(currentGame) {
    const container = document.getElementById('related-games');
    if (!container) return;
    
    const related = GAMES.filter(g => g.category === currentGame.category && g.slug !== currentGame.slug)
                         .sort(() => 0.5 - Math.random())
                         .slice(0, 8);
                         
    container.innerHTML = related.map(g => `
        <a href="games/${g.slug}/index.html" class="game-card bg-white rounded-xl border-0 hover:-translate-y-1 transition-all flex flex-col overflow-hidden shadow-sm hover:shadow-md group">
            <div class="w-full h-24 flex items-center justify-center transition-transform group-hover:scale-110" style="background:${g.color}15">
                <div class="text-4xl opacity-90 drop-shadow-md">${g.icon}</div>
            </div>
            <div class="p-3 text-center bg-white flex-grow flex flex-col justify-center">
                <h3 class="font-bold text-gray-800 text-[13px] line-clamp-2">${g.title}</h3>
            </div>
        </a>
    `).join('');
}

function renderRecommendedGames() {
    const container = document.getElementById('error-recommended-games');
    if (!container) return;
    
    let html = '';
    
    // New Games
    const newGames = GAMES.filter(g => g.isNewAddedGame);
    if (newGames.length > 0) {
        html += `<h3 class="text-xl font-bold font-heading mb-4 mt-6 text-white text-left">✨ New Games Added</h3>`;
        html += `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">`;
        html += newGames.map(g => generateGameCardHtml(g)).join('');
        html += `</div>`;
    }

    // Popular Games
    const popular = GAMES.filter(g => g.isTrending);
    if (popular.length > 0) {
        html += `<h3 class="text-xl font-bold font-heading mb-4 mt-10 text-white text-left">🔥 Popular Games</h3>`;
        html += `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">`;
        html += popular.map(g => generateGameCardHtml(g)).join('');
        html += `</div>`;
    }
    
    container.innerHTML = html;
}

function generateGameCardHtml(g) {
    return `
    <a href="games/${g.slug}/index.html" class="game-card bg-white rounded-xl border-0 hover:-translate-y-1 transition-all flex flex-col overflow-hidden shadow-sm hover:shadow-md group relative">
        <div class="w-full h-28 flex items-center justify-center transition-transform group-hover:scale-110" style="background:${g.color}15">
            <div class="text-5xl opacity-90 drop-shadow-md">${g.icon}</div>
        </div>
        <div class="p-3 text-center bg-white flex-grow flex flex-col justify-center">
            <span class="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">${g.category}</span>
            <h3 class="font-bold text-gray-800 text-[13px] line-clamp-1">${g.title}</h3>
        </div>
    </a>`;
}

function startRewardTimer(slug) {
    // 2-minute timer logic
    setTimeout(() => {
        const cooldowns = JSON.parse(localStorage.getItem('ffliveplay_reward_cooldowns') || '{}');
        const now = Date.now();
        const lastReward = cooldowns[slug] || 0;
        
        // 30-minute cooldown (1800000 ms)
        if (now - lastReward > 1800000) {
            pfState.coins += 10;
            pfState.xp += 10;
            cooldowns[slug] = now;
            localStorage.setItem('ffliveplay_reward_cooldowns', JSON.stringify(cooldowns));
            window.saveState();
            showToast("You earned 10 coins for playing!");
        }
    }, 120000); // 120,000 ms = 2 minutes
}

function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        if(toast.parentNode) toast.remove();
    }, 3500);
}
