/**
 * FF Live Play - Universal Game Rewards System
 * Handles coins, XP, streaks, UI overlays, animations, and audio.
 */

(function() {
    // === CONFIG & STATE ===
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isTestMode = isLocalDev && new URLSearchParams(window.location.search).get('rewardTest') === '1';

    const FF_DEBUG_REWARDS = location.hostname === "localhost" || location.hostname === "127.0.0.1";

    
    const REWARDS = {
        TIME: [
            { min: 2, coins: 10, xp: 10 },
            { min: 5, coins: 20, xp: 15 },
            { min: 10, coins: 30, xp: 25 }
        ],
        POST_10_MIN_INTERVAL: 10, // every 10 min
        POST_10_MIN_REWARD: { coins: 25, xp: 20 },
        DAILY_CAP: 300,
        START_XP: 5,
        START_COOLDOWN_MS: 30 * 60 * 1000 // 30 min
    };

    let sessionStartTime = Date.now();
    let currentPlayTimeMs = 0;
    let nextRewardIndex = 0;
    let post10MinCount = 0;
    let timerInterval = null;
    let gameSlug = extractSlug(window.location.pathname);
    let audioContext = null;
    let hasInteracted = false;

    // === STORAGE WRAPPERS ===
    function getStorage(key, defaultVal) {
        try { return JSON.parse(localStorage.getItem(key)) || defaultVal; } 
        catch (e) { return defaultVal; }
    }
    function setStorage(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } 
        catch (e) {}
    }

    // === CORE DATA LOAD/SAVE ===
    let state = {
        coins: getStorage('ffliveplay_coins', 0),
        xp: getStorage('ffliveplay_xp', 0),
        level: getStorage('ffliveplay_level', 1),
        streak: getStorage('ffliveplay_streak', 1),
        lastLogin: getStorage('ffliveplay_last_login', 0),
        muted: getStorage('ffliveplay_rewards_muted', false),
        cooldowns: getStorage('ffliveplay_reward_cooldowns', {}), 
        dailyCoins: getStorage('ffliveplay_daily_play_coins', { date: '', amount: 0 }),
        recentlyPlayed: getStorage('ffliveplay_recently_played', []),
        inventory: getStorage('ffliveplay_inventory', { hint_pack: 0, revive_token: 0, skip_level: 0 }),
        xpBoostUntil: getStorage('ffliveplay_xp_boost_until', 0),
        theme: getStorage('ffliveplay_theme', 'default'),
        bonusChallengeUnlocked: getStorage('ffliveplay_bonus_challenge_unlocked', '')
    };

    // Safety checks in case user manually edits localStorage
    if (typeof state.coins !== 'number' || isNaN(state.coins) || state.coins < 0) state.coins = 0;
    if (typeof state.xp !== 'number' || isNaN(state.xp) || state.xp < 0) state.xp = 0;
    if (typeof state.inventory !== 'object' || state.inventory === null) {
        state.inventory = { hint_pack: 0, revive_token: 0, skip_level: 0 };
    }

    // Ensure streak and daily coins are updated for today
    const todayStr = new Date().toDateString();
    const lastLoginStr = new Date(state.lastLogin).toDateString();
    
    if (state.lastLogin === 0) {
        state.lastLogin = Date.now();
        setStorage('ffliveplay_last_login', state.lastLogin);
    } else if (todayStr !== lastLoginStr) {
        // Different day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLoginStr === yesterday.toDateString()) {
            state.streak += 1;
        } else {
            state.streak = 1;
        }
        state.lastLogin = Date.now();
        setStorage('ffliveplay_streak', state.streak);
        setStorage('ffliveplay_last_login', state.lastLogin);
    }

    if (state.dailyCoins.date !== todayStr) {
        state.dailyCoins = { date: todayStr, amount: 0 };
        setStorage('ffliveplay_daily_play_coins', state.dailyCoins);
    }

    // === AUDIO SYSTEM ===
    function initAudio() {
        if (!audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioContext = new AudioContext();
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function playCoinChime(type = 'coin') {
        if (state.muted || !hasInteracted || !audioContext) return;
        try {
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'coin') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                osc.start();
                osc.stop(audioContext.currentTime + 0.5);
            } else if (type === 'level') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, audioContext.currentTime);
                osc.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
                osc.start();
                osc.stop(audioContext.currentTime + 0.6);
            } else if (type === 'game') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5
                osc.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3); // G5
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.45);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                osc.start();
                osc.stop(audioContext.currentTime + 0.8);
            }
        } catch(e) {}
    }

    // === UI CREATION ===
    function createUI() {
        // HUD
        const hud = document.createElement('div');
        hud.id = 'ff-reward-hud';
        if (state.theme === 'golden') hud.classList.add('golden-theme');
        hud.innerHTML = `
            <div class="ff-hud-inner">
                <div class="ff-hud-stats">
                    <div class="ff-pill ff-coin-pill">🪙 <span id="ff-ui-coins">${state.coins}</span></div>
                    <div class="ff-pill ff-xp-pill">⭐ <span id="ff-ui-level">Lvl ${state.level}</span> - <span id="ff-ui-xp-prog">${state.xp}/100</span></div>
                    <div class="ff-pill ff-streak-pill">🔥 <span id="ff-ui-streak">${state.streak}</span></div>
                </div>
                <div class="ff-hud-bottom">
                    <div class="ff-timer" id="ff-ui-timer">⏱ Next: --:--</div>
                    <div class="ff-hud-controls">
                        <button id="ff-btn-shop" title="Coin Shop">🛒</button>
                        <button id="ff-btn-info" title="Rewards Info">❓</button>
                        <button id="ff-btn-mute" title="Toggle Sound">${state.muted ? '🔇' : '🔊'}</button>
                        <button id="ff-btn-min" title="Minimize">—</button>
                    </div>
                </div>
            </div>
            <div id="ff-hud-minimized" class="hidden">🪙 Rewards</div>
        `;
        document.body.appendChild(hud);

        // Toast Container
        const toastCont = document.createElement('div');
        toastCont.id = 'ff-toast-container';
        document.body.appendChild(toastCont);

        // Modals Container (Info, Shop, Confirm)
        const modalsCont = document.createElement('div');
        modalsCont.id = 'ff-modals-wrapper';
        modalsCont.innerHTML = `
            <!-- INFO MODAL -->
            <div id="ff-reward-modal" class="hidden ff-modal-base">
                <div class="ff-modal-overlay" class="ff-close-bg"></div>
                <div class="ff-modal-content">
                    <div class="ff-modal-header">
                        <h2>Rewards & Coins</h2>
                        <button class="ff-modal-close">✕</button>
                    </div>
                    <div class="ff-modal-body">
                        <ul>
                            <li>🪙 <b>Coins</b> are earned by playing games.</li>
                            <li>⭐ <b>XP</b> increases your level. Every 100 XP levels you up.</li>
                            <li>🔥 <b>Daily Streak</b> grows when you come back every day.</li>
                            <li>⏱ Stay and play longer to earn more rewards.</li>
                            <li>💾 Rewards are saved securely on this device.</li>
                        </ul>
                        <br/>
                        <h3>Where can I use coins?</h3>
                        <ul>
                            <li>Get hints when stuck</li>
                            <li>Revive after game over</li>
                            <li>Skip difficult levels</li>
                            <li>Unlock bonus challenges</li>
                            <li>Activate 2x XP boost</li>
                            <li>Unlock premium themes</li>
                        </ul>
                        <p style="margin-top:10px; font-size: 14px; opacity: 0.8;">Coins help you continue playing, unlock hints, revive after mistakes, and level up faster.</p>
                    </div>
                </div>
            </div>

            <!-- SHOP MODAL -->
            <div id="ff-shop-modal" class="hidden ff-modal-base">
                <div class="ff-modal-overlay" class="ff-close-bg"></div>
                <div class="ff-modal-content ff-shop-content">
                    <div class="ff-modal-header">
                        <h2>Coin Shop</h2>
                        <button class="ff-modal-close">✕</button>
                    </div>
                    <div class="ff-modal-body">
                        <div class="ff-shop-balance">Your Coins: <span id="ff-shop-coin-bal">${state.coins}</span></div>
                        <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: -10px; margin-bottom: 20px;">Coins are virtual game rewards saved on this device. They have no cash value.</p>
                        
                        <div class="ff-shop-grid">
                            <div class="ff-shop-item" style="opacity: 0.7;">
                                <h4>📺 Watch Ad</h4>
                                <p>Earn 10 coins by watching a short ad.</p>
                                <button class="ff-buy-btn" disabled style="background: #475569; cursor: not-allowed;">Rewarded Ads Coming Soon</button>
                            </div>
                            <div class="ff-shop-item">
                                <h4>💡 Hint Pack</h4>
                                <p>Use hints in supported puzzle, word, quiz, and hidden object games.</p>
                                <button class="ff-buy-btn" data-id="hint_pack" data-cost="20">Buy for 20 Coins</button>
                            </div>
                            <div class="ff-shop-item">
                                <h4>❤️ Revive Token</h4>
                                <p>Continue once after game over in supported games.</p>
                                <button class="ff-buy-btn" data-id="revive_token" data-cost="30">Buy for 30 Coins</button>
                            </div>
                            <div class="ff-shop-item">
                                <h4>⏭️ Skip Level</h4>
                                <p>Skip a difficult level in supported level games.</p>
                                <button class="ff-buy-btn" data-id="skip_level" data-cost="50">Buy for 50 Coins</button>
                            </div>
                            <div class="ff-shop-item">
                                <h4>⚡ 2x XP Boost</h4>
                                <p>Earn double XP for 10 minutes.</p>
                                <button class="ff-buy-btn" data-id="xp_boost" data-cost="100">Buy for 100 Coins</button>
                            </div>
                            <div class="ff-shop-item">
                                <h4>👑 Golden Theme</h4>
                                <p>Unlock premium golden reward HUD theme.</p>
                                <button class="ff-buy-btn" data-id="golden_theme" data-cost="150">Buy for 150 Coins</button>
                            </div>
                            <div class="ff-shop-item">
                                <h4>🎯 Bonus Challenge</h4>
                                <p>Unlock one extra daily bonus challenge.</p>
                                <button class="ff-buy-btn" data-id="bonus_challenge" data-cost="200">Buy for 200 Coins</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- CONFIRM MODAL -->
            <div id="ff-confirm-modal" class="hidden ff-modal-base">
                <div class="ff-modal-overlay"></div>
                <div class="ff-modal-content ff-confirm-content">
                    <h3 id="ff-confirm-title">Use Item?</h3>
                    <p id="ff-confirm-msg">Are you sure?</p>
                    <div class="ff-confirm-actions">
                        <button id="ff-confirm-btn-item" class="hidden">Use Item (<span id="ff-confirm-item-count">0</span>)</button>
                        <button id="ff-confirm-btn-coin">Spend <span id="ff-confirm-coin-cost">0</span> Coins</button>
                        <button id="ff-confirm-btn-cancel">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalsCont);

        // Event Listeners
        document.getElementById('ff-btn-mute').addEventListener('click', (e) => {
            state.muted = !state.muted;
            setStorage('ffliveplay_rewards_muted', state.muted);
            e.target.innerText = state.muted ? '🔇' : '🔊';
        });

        const hudInner = hud.querySelector('.ff-hud-inner');
        const hudMin = document.getElementById('ff-hud-minimized');
        
        document.getElementById('ff-btn-min').addEventListener('click', () => {
            hudInner.classList.add('hidden');
            hudMin.classList.remove('hidden');
        });
        hudMin.addEventListener('click', () => {
            hudMin.classList.add('hidden');
            hudInner.classList.remove('hidden');
        });

        if (window.innerWidth <= 768) {
            hudInner.classList.add('hidden');
            hudMin.classList.remove('hidden');
            
            // Move minimized pill to navbar for perfect mobile UX
            const navRight = document.querySelector('.navbar .flex.items-center.gap-4');
            if (navRight) {
                const hamburger = document.getElementById('hamburger');
                if (hamburger) {
                    navRight.insertBefore(hudMin, hamburger);
                } else {
                    navRight.appendChild(hudMin);
                }
            }
        }

        const infoModal = document.getElementById('ff-reward-modal');
        const shopModal = document.getElementById('ff-shop-modal');

        document.getElementById('ff-btn-info').addEventListener('click', () => infoModal.classList.remove('hidden'));
        document.getElementById('ff-btn-shop').addEventListener('click', () => {
            updateShopUI();
            shopModal.classList.remove('hidden');
        });

        // Universal close logic
        document.querySelectorAll('.ff-modal-close, .ff-close-bg').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const p = e.target.closest('.ff-modal-base');
                if (p) p.classList.add('hidden');
            });
        });

        // Shop Buy Buttons
        document.querySelectorAll('.ff-buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const cost = parseInt(e.target.dataset.cost);
                buyShopItem(id, cost);
            });
        });

        // Interaction unlocker
        const unlockAudio = () => {
            if (!hasInteracted) {
                hasInteracted = true;
                initAudio();
            }
        };
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
        document.addEventListener('keydown', unlockAudio, { once: true });
    }

    // === LOGIC ===
    function extractSlug(path) {
        const match = path.match(/\/games\/([^\/]+)/);
        return match ? match[1] : 'unknown-game';
    }

    function isXpBoostActive() {
        return Date.now() < state.xpBoostUntil;
    }

    function addXP(amount) {
        if (isXpBoostActive()) amount *= 2;
        state.xp += amount;
        setStorage('ffliveplay_xp', state.xp);
        updateUI();
        window.dispatchEvent(new Event("ffrewards:wallet-updated"));
    }

    function addCoins(amount) {
        state.coins += amount;
        setStorage('ffliveplay_coins', state.coins);
        updateUI();
        window.dispatchEvent(new Event("ffrewards:wallet-updated"));
    }
    
    function canAfford(amount) {
        return state.coins >= amount;
    }

    function spendCoins(amount, reason = "purchase") {
        if (!canAfford(amount)) {
            showToast("Not enough coins. Play more games to earn coins.");
            return false;
        }
        state.coins -= amount;
        setStorage('ffliveplay_coins', state.coins);
        updateUI();
        window.dispatchEvent(new Event("ffrewards:wallet-updated"));
        playCoinChime('coin'); // Small spend sound
        return true;
    }

    function showToast(msgHTML) {
        const cont = document.getElementById('ff-toast-container');
        if (!cont) return;
        const t = document.createElement('div');
        t.className = 'ff-toast';
        t.innerHTML = msgHTML;
        cont.appendChild(t);
        
        // Ensure layout triggered before adding show class
        void t.offsetWidth;
        t.classList.add('show');
        
        setTimeout(() => t.classList.remove('show'), 2500);
        setTimeout(() => t.remove(), 3000);
    }

    
    function createCoinRain(type = "level") {
        const count = type === "game" ? 50 : 30;
        if (FF_DEBUG_REWARDS) {
            console.log("[FFRewards] createCoinRain started", type);
            console.log("[FFRewards] coins spawned", count);
        }
        const container = document.createElement("div");
        container.className = "ff-coin-rain-layer";
        document.body.appendChild(container);

        for (let i = 0; i < count; i++) {
            const coin = document.createElement("div");
            coin.className = "ff-falling-coin";
            coin.textContent = "🪙";

            coin.style.left = Math.random() * 100 + "vw";
            coin.style.animationDelay = Math.random() * 0.5 + "s";
            coin.style.animationDuration = 1.8 + Math.random() * 1.2 + "s";
            coin.style.fontSize = 18 + Math.random() * 18 + "px";

            container.appendChild(coin);
        }

        setTimeout(() => {
            container.remove();
        }, 3500);
    }

    function grantReward(coins, xp, reason) {
        addCoins(coins);
        addXP(xp);
        
        let type = 'coin';
        let msg = `+${coins} Coins<br/>+${xp} XP`;
        let rainType = 'level';

        if (reason === 'LEVEL_COMPLETE') {
            type = 'level';
            msg = `Level Complete!<br/>+${coins} Coins<br/>+${xp} XP`;
            rainType = 'level';
        } else if (reason === 'GAME_COMPLETE' || reason === 'playtime') {
            type = 'game';
            msg = `Game Complete!<br/>+${coins} Coins<br/>+${xp} XP`;
            rainType = 'game';
        }

        playCoinChime(type);
        createCoinRain(rainType);
        showToast(msg);
    }

    function updateUI() {
        const c = document.getElementById('ff-ui-coins');
        const l = document.getElementById('ff-ui-level');
        const x = document.getElementById('ff-ui-xp-prog');
        const s = document.getElementById('ff-ui-streak');
        
        const calcLevel = Math.floor(state.xp / 100) + 1;
        const progressXP = state.xp % 100;
        
        if (c) c.innerText = state.coins;
        if (l) l.innerText = `Lvl ${calcLevel}`;
        if (x) x.innerText = `${progressXP}/100`;
        if (s) s.innerText = state.streak;
        
        updateShopUI();
    }

    // === COIN SHOP & INVENTORY LOGIC ===
    function updateShopUI() {
        const bal = document.getElementById('ff-shop-coin-bal');
        if (bal) bal.innerText = state.coins;
        
        document.querySelectorAll('.ff-buy-btn').forEach(btn => {
            const cost = parseInt(btn.dataset.cost);
            const id = btn.dataset.id;
            
            if (id === 'golden_theme' && state.theme === 'golden') {
                btn.innerText = "Unlocked";
                btn.disabled = true;
                btn.style.opacity = '0.5';
            } else if (id === 'bonus_challenge' && state.bonusChallengeUnlocked === new Date().toDateString()) {
                btn.innerText = "Unlocked Today";
                btn.disabled = true;
                btn.style.opacity = '0.5';
            } else if (state.coins < cost) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.innerText = `Need ${cost} Coins`;
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.innerText = `Buy for ${cost} Coins`;
            }
        });
    }

    function getInventory() {
        return state.inventory;
    }

    function addInventoryItem(itemId, amount = 1) {
        state.inventory[itemId] = (state.inventory[itemId] || 0) + amount;
        setStorage('ffliveplay_inventory', state.inventory);
    }

    function useInventoryItem(itemId) {
        if (state.inventory[itemId] > 0) {
            state.inventory[itemId]--;
            setStorage('ffliveplay_inventory', state.inventory);
            return true;
        }
        return false;
    }

    function buyShopItem(itemId, cost) {
        if (itemId === 'golden_theme' && state.theme === 'golden') {
            showToast("Golden Theme already unlocked");
            return;
        }
        
        if (!spendCoins(cost, `buy_${itemId}`)) return;

        if (itemId === 'hint_pack' || itemId === 'revive_token' || itemId === 'skip_level') {
            addInventoryItem(itemId);
            const names = { hint_pack: 'Hint Pack', revive_token: 'Revive Token', skip_level: 'Skip Level' };
            showToast(`Purchased: ${names[itemId]}`);
        } else if (itemId === 'xp_boost') {
            if (isXpBoostActive()) {
                state.xpBoostUntil += 10 * 60 * 1000; // extend
            } else {
                state.xpBoostUntil = Date.now() + 10 * 60 * 1000;
            }
            setStorage('ffliveplay_xp_boost_until', state.xpBoostUntil);
            showToast("Purchased: 2x XP Boost");
        } else if (itemId === 'golden_theme') {
            state.theme = 'golden';
            setStorage('ffliveplay_theme', 'golden');
            document.getElementById('ff-reward-hud').classList.add('golden-theme');
            showToast("Purchased: Golden Theme");
        } else if (itemId === 'bonus_challenge') {
            state.bonusChallengeUnlocked = new Date().toDateString();
            setStorage('ffliveplay_bonus_challenge_unlocked', state.bonusChallengeUnlocked);
            showToast("Bonus challenge saved for today.");
        }
        updateShopUI();
    }

    // === GLOBAL CONFIRM MODAL ===
    let confirmActiveResolver = null;
    function showSpendConfirm(options) {
        const modal = document.getElementById('ff-confirm-modal');
        const title = document.getElementById('ff-confirm-title');
        const msg = document.getElementById('ff-confirm-msg');
        const btnItem = document.getElementById('ff-confirm-btn-item');
        const btnCoin = document.getElementById('ff-confirm-btn-coin');
        const btnCancel = document.getElementById('ff-confirm-btn-cancel');
        
        title.innerText = options.title || "Confirm";
        msg.innerText = options.message || `Spend ${options.cost} coins?`;
        
        const count = state.inventory[options.itemId] || 0;
        if (count > 0) {
            btnItem.classList.remove('hidden');
            document.getElementById('ff-confirm-item-count').innerText = count;
        } else {
            btnItem.classList.add('hidden');
        }
        
        document.getElementById('ff-confirm-coin-cost').innerText = options.cost;

        modal.classList.remove('hidden');

        // Cleanup old listeners (replace buttons to clear them)
        const newItem = btnItem.cloneNode(true);
        const newCoin = btnCoin.cloneNode(true);
        const newCancel = btnCancel.cloneNode(true);
        btnItem.replaceWith(newItem);
        btnCoin.replaceWith(newCoin);
        btnCancel.replaceWith(newCancel);

        newItem.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (useInventoryItem(options.itemId)) {
                if (options.onConfirm) options.onConfirm(true, 'item');
            } else {
                showToast("Item not available");
                if (options.onConfirm) options.onConfirm(false);
            }
        });

        newCoin.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (spendCoins(options.cost, `use_${options.itemId}`)) {
                if (options.onConfirm) options.onConfirm(true, 'coins');
            } else {
                if (options.onConfirm) options.onConfirm(false);
            }
        });

        newCancel.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (options.onConfirm) options.onConfirm(false);
        });
    }

    // === GLOBAL EXPORT ===
    window.FFRewards = window.FFRewards || {};
    Object.assign(window.FFRewards, {
        triggerReward: function(type, payload = {}) {
            handleRewardEvent(type, payload);
        },
        triggerCorrectAnswer: function(payload = {}) {
            const { gameSlug, scoreDelta = 10, coins = 0, xp = 2, label = "Correct!" } = payload;
            if (coins > 0) addCoins(coins);
            if (xp > 0) addXP(xp);
            showToast(`${label} +${scoreDelta} Score`);
        },
        getCoins: () => state.coins,
        addCoins,
        addXP,
        spendCoins,
        canAfford,
        getInventory,
        addInventoryItem,
        useInventoryItem,
        showToast,
        playCoinChime,
        isXpBoostActive,
        showSpendConfirm,
        createCoinRain,
        updateUI
    });

    function checkStartReward() {
        const startKey = `${gameSlug}-start`;
        const lastStart = state.cooldowns[startKey] || 0;
        if (Date.now() - lastStart > REWARDS.START_COOLDOWN_MS) {
            addXP(REWARDS.START_XP);
            state.cooldowns[startKey] = Date.now();
            setStorage('ffliveplay_reward_cooldowns', state.cooldowns);
            showToast(`+${REWARDS.START_XP} XP for playing!`);
        }
        
        // Add to recently played
        let rec = state.recentlyPlayed;
        rec = rec.filter(s => s !== gameSlug);
        rec.unshift(gameSlug);
        if (rec.length > 8) rec.pop();
        state.recentlyPlayed = rec;
        setStorage('ffliveplay_recently_played', rec);
    }

    function updateTimer() {
        const timerEl = document.getElementById('ff-ui-timer');
        if (!timerEl) return;

        currentPlayTimeMs += 1000;
        const timeMultiplier = isTestMode ? 12 : 1; // Test mode 12x faster (10s = 2m)
        const effectiveSeconds = Math.floor(currentPlayTimeMs * timeMultiplier / 1000);
        
        let targetMinutes = 0;
        let reward = null;
        let milestoneKey = '';

        if (nextRewardIndex < REWARDS.TIME.length) {
            targetMinutes = REWARDS.TIME[nextRewardIndex].min;
            reward = REWARDS.TIME[nextRewardIndex];
            milestoneKey = `${gameSlug}-time-${targetMinutes}`;
        } else {
            targetMinutes = REWARDS.TIME[REWARDS.TIME.length-1].min + (post10MinCount + 1) * REWARDS.POST_10_MIN_INTERVAL;
            reward = REWARDS.POST_10_MIN_REWARD;
            milestoneKey = `${gameSlug}-time-${targetMinutes}`;
        }

        const targetSeconds = targetMinutes * 60;
        const remainingSeconds = targetSeconds - effectiveSeconds;

        if (remainingSeconds <= 0) {
            // Reward time!
            const lastRewardTime = state.cooldowns[milestoneKey] || 0;
            // Cooldown for time milestone is 12 hours
            if (Date.now() - lastRewardTime > 12 * 60 * 60 * 1000) {
                if (state.dailyCoins.amount + reward.coins <= REWARDS.DAILY_CAP) {
                    grantReward(reward.coins, reward.xp, 'playtime');
                    state.dailyCoins.amount += reward.coins;
                    setStorage('ffliveplay_daily_play_coins', state.dailyCoins);
                    state.cooldowns[milestoneKey] = Date.now();
                    setStorage('ffliveplay_reward_cooldowns', state.cooldowns);
                }
            }
            
            if (nextRewardIndex < REWARDS.TIME.length) {
                nextRewardIndex++;
            } else {
                post10MinCount++;
            }
            // Update display immediately for next target
            updateTimer(); 
            return;
        }

        const m = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const s = (remainingSeconds % 60).toString().padStart(2, '0');
        
        if (isXpBoostActive()) {
            const boostRemain = Math.floor((state.xpBoostUntil - Date.now()) / 1000);
            if (boostRemain > 0) {
                const bm = Math.floor(boostRemain / 60).toString().padStart(2, '0');
                const bs = (boostRemain % 60).toString().padStart(2, '0');
                timerEl.innerHTML = `<span style="color:#fbbf24;font-weight:bold;">⚡2x XP: ${bm}:${bs}</span>`;
            } else {
                timerEl.innerText = `⏱ Next: ${m}:${s}`;
            }
        } else {
            timerEl.innerText = `⏱ Next: ${m}:${s}`;
        }
    }

    
    function handleRewardEvent(type, payload = {}) {
        const slug = payload.gameSlug || gameSlug;
        const cooldownKey = slug + ":" + type;

        const last = state.cooldowns[cooldownKey] || 0;
        if (Date.now() - last <= 5000) {
            if (FF_DEBUG_REWARDS) console.log("[FFRewards] Cooldown blocked", cooldownKey);
            return;
        }

        if (FF_DEBUG_REWARDS) console.log("[FFRewards] GAME_COMPLETE received", payload);

        state.cooldowns[cooldownKey] = Date.now();
        setStorage('ffliveplay_reward_cooldowns', state.cooldowns);

        if (type === "LEVEL_COMPLETE") {
            const coins = payload.coins || 10;
            addCoins(coins);
            addXP(15);
            showToast(`Level Complete!<br>+${coins} Coins<br>+15 XP`);
            createCoinRain("level");
            playCoinChime("level");
            updateUI();
        } else if (type === "GAME_COMPLETE") {
            const coins = payload.coins || 20;
            addCoins(coins);
            addXP(25);
            showToast(`Game Complete!<br>+${coins} Coins<br>+25 XP`);
            createCoinRain("game");
            playCoinChime("game");
            updateUI();
        } else if (type === "GAME_OVER") {
            showToast("Game Over");
        }
    }


    
    // === EXTERNAL EVENTS ===
    window.addEventListener('message', (e) => {
        if (e.data && e.data.type) {
            handleRewardEvent(e.data.type, e.data);
        }
    });

    window.addEventListener('FF_LEVEL_COMPLETE', (e) => {
        handleRewardEvent("LEVEL_COMPLETE", e.detail || {});
    });

    window.addEventListener('FF_GAME_COMPLETE', (e) => {
        handleRewardEvent("GAME_COMPLETE", e.detail || {});
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'ffliveplay_coins') {
            state.coins = parseInt(e.newValue) || 0;
            updateUI();
        }
        if (e.key === 'ffliveplay_xp') {
            state.xp = parseInt(e.newValue) || 0;
            updateUI();
        }
    });

    // === INIT ===
    window.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('ff-reward-hud')) return; // prevent duplicate
        createUI();
        updateUI();
        checkStartReward();
        timerInterval = setInterval(updateTimer, 1000);
    });

    // Fallback if script loads late
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        if (!document.getElementById('ff-reward-hud')) {
            createUI();
            updateUI();
            checkStartReward();
            timerInterval = setInterval(updateTimer, 1000);
        }
    }

    // Hamburger menu logic for game pages
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('#hamburger');
        const menu = document.getElementById('mobile-menu');
        if (btn && menu) {
            menu.classList.toggle('open');
            btn.classList.toggle('active');
            return;
        }
        const link = e.target.closest('#mobile-menu a');
        if (link && menu) {
            const hBtn = document.getElementById('hamburger');
            menu.classList.remove('open');
            if (hBtn) hBtn.classList.remove('active');
        }
    });

})();
