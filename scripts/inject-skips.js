const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, '..', 'games');

const skipGames = [
  'color-sort-puzzle', 'water-sort-puzzle', 'ball-sort-puzzle', 
  'nonogram-picture-puzzle', 'escape-room-mini', 'find-the-difference'
];

skipGames.forEach(slug => {
    let jsPath = path.join(gamesDir, slug, 'script.js');
    if (!fs.existsSync(jsPath)) return;
    
    let code = fs.readFileSync(jsPath, 'utf8');
    if (code.includes('btn-ff-skip')) {
        console.log(`Already patched skip: ${slug}`);
        return;
    }

    const injectScript = `
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
                                    loadRoom(currentRoom + 1);
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
`;

    // specific fix for escape-room-mini logic
    if (slug === 'escape-room-mini') {
        code += injectScript.replace("loadRoom(currentRoom + 1);", "if (typeof currentRoom !== 'undefined') currentRoom++; loadRoom();");
    } else {
        code += "\n" + injectScript;
    }

    fs.writeFileSync(jsPath, code, 'utf8');
    console.log(`Patched skip for: ${slug}`);
});
