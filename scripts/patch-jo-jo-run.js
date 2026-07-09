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
    const file = 'games/jo-jo-run/index.html';
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject helper
    content = content.replace('const canvas = document.getElementById(\'gameCanvas_74\');', helper + '\n        const canvas = document.getElementById(\'gameCanvas_74\');');
    
    // Reset guard
    content = content.replace("px = 200; py = 200; vx = 5; vy = 0; score = 0; isOver = false; activeAnchor = null; hasStarted = false; camX = 0;", "px = 200; py = 200; vx = 5; vy = 0; score = 0; isOver = false; activeAnchor = null; hasStarted = false; camX = 0; window.ffLastMilestone = 0;");
    
    // Trigger on milestone
    const target = 'score = distanceScore;\n                updateScore();';
    const replacement = 'score = distanceScore;\n                updateScore();\n                let currentMilestone = Math.floor(score / 10);\n                if(currentMilestone > window.ffLastMilestone && currentMilestone > 0) {\n                    window.ffLastMilestone = currentMilestone;\n                    ffTriggerRewardEvent("LEVEL_COMPLETE", {score: Math.floor(score)});\n                }';
    content = content.replace(target, replacement);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('patched jo-jo-run');
}

patch();
