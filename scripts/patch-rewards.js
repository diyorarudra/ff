const fs = require('fs');

let content = fs.readFileSync('js/game-rewards.js', 'utf8');

const debugLogCode = `
    const FF_DEBUG_REWARDS = location.hostname === "localhost" || location.hostname === "127.0.0.1";
`;

content = content.replace(/(const isTestMode = .*?;)/, `$1\n${debugLogCode}`);

const newHandleReward = `
    function handleRewardEvent(type, payload = {}) {
        const slug = payload.gameSlug || gameSlug;
        const cooldownKey = slug + ":" + type;

        const last = state.cooldowns[cooldownKey] || 0;
        if (Date.now() - last <= 5000) {
            if (FF_DEBUG_REWARDS) console.log("[FFRewards] Cooldown blocked", cooldownKey);
            return;
        }

        if (FF_DEBUG_REWARDS) console.log("[FFRewards] Event received", type, payload);

        state.cooldowns[cooldownKey] = Date.now();
        setStorage('ffliveplay_reward_cooldowns', state.cooldowns);

        if (type === "LEVEL_COMPLETE") {
            const coins = payload.coins || 10;
            addCoins(coins);
            addXP(15);
            showToast(\`Level Complete!<br>+\${coins} Coins<br>+15 XP\`);
            createCoinRain(1.5);
            playCoinChime("level");
            updateUI();
        } else if (type === "GAME_COMPLETE") {
            const coins = payload.coins || 20;
            addCoins(coins);
            addXP(25);
            showToast(\`Game Complete!<br>+\${coins} Coins<br>+25 XP\`);
            createCoinRain(2);
            playCoinChime("game");
            updateUI();
        } else if (type === "GAME_OVER") {
            showToast("Game Over");
        }
    }
`;

content = content.replace(/function handleRewardEvent[\s\S]*?}\n\n/m, newHandleReward + '\n\n');

const newCoinRain = `
    function createCoinRain(intensity = 1) {
        if (FF_DEBUG_REWARDS) console.log("[FFRewards] Coin rain started");
        const count = Math.floor((Math.random() * 15 + 20) * intensity);

        for (let i = 0; i < count; i++) {
            const coin = document.createElement('div');
            coin.className = 'ff-falling-coin';
            coin.innerText = '🪙';
            
            const randomX = Math.random() * window.innerWidth;
            coin.style.left = randomX + 'px';
            coin.style.top = '-50px';
            
            const tx = (Math.random() - 0.5) * 100;
            const randomDelay = Math.random() * 0.5;
            const duration = 1.8 + Math.random() * 0.7;
            
            coin.style.setProperty('--tx', \`\${tx}px\`);
            coin.style.animation = \`ff-coin-fall \${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards\`;
            coin.style.animationDelay = \`\${randomDelay}s\`;
            
            document.body.appendChild(coin);
            setTimeout(() => coin.remove(), (duration + randomDelay) * 1000 + 500);
        }
    }
`;

content = content.replace(/function createCoinRain[\s\S]*?}\n/m, newCoinRain + '\n');

const newEvents = `
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
`;

content = content.replace(/\/\/ === EXTERNAL EVENTS ===[\s\S]*?\/\/ === INIT ===/m, newEvents + '\n    // === INIT ===');

fs.writeFileSync('js/game-rewards.js', content, 'utf8');
console.log('game-rewards.js patched successfully!');
