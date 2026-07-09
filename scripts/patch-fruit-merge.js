const fs = require('fs');
const path = require('path');

const helper = `
    function ffTriggerRewardEvent(type, payload = {}) {
      try {
        const parts = location.pathname.split("/").filter(Boolean);
        const slugIndex = parts.indexOf("games") + 1;
        const detectedSlug = slugIndex > 0 ? parts[slugIndex] : "unknown-game";
        const detail = {
          type,
          gameSlug: payload.gameSlug || window.GAME_SLUG || detectedSlug,
          level: payload.level || window.currentLevel || window.level || window.currentRound || 1,
          score: payload.score || window.score || 0,
          coins: type === "GAME_COMPLETE" ? 20 : 10
        };
        window.dispatchEvent(new CustomEvent(
          type === "GAME_COMPLETE" ? "FF_GAME_COMPLETE" : "FF_LEVEL_COMPLETE",
          { detail }
        ));
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(detail, "*");
        }
      } catch (e) {
        console.warn("FF reward event failed safely", e);
      }
    }
`;

function patch() {
    const file = 'games/fruit-merge/index.html';
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject helper
    content = content.replace('const canvas = document.getElementById(\'gameCanvas_71\');', helper + '\n        const canvas = document.getElementById(\'gameCanvas_71\');');
    
    // Reset guard
    content = content.replace("function init() {\n            fruitList = []; score = 0; isOver = false; updateUI();\n        }", "function init() {\n            fruitList = []; score = 0; isOver = false; window.ffRoundRewardGiven=false; updateUI();\n        }");
    
    // Trigger on human win (merging to max tier)
    const target = 'score += (f1.tier + 1)*10; updateUI();';
    const replacement = 'score += (f1.tier + 1)*10; updateUI();\n                            if(f1.tier + 1 === fruitTiers.length - 1 && !window.ffRoundRewardGiven) { window.ffRoundRewardGiven = true; ffTriggerRewardEvent("LEVEL_COMPLETE", {score: score}); }';
    content = content.replace(target, replacement);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('patched fruit-merge');
}

patch();
