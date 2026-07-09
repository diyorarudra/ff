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
    const file = 'games/froggy-jump/index.html';
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject helper
    content = content.replace('const canvas = document.getElementById(\'gameCanvas_94\');', helper + '\n        const canvas = document.getElementById(\'gameCanvas_94\');');
    
    // Reset guard
    content = content.replace("function init() { px=canvas.width/2; py=canvas.height-100; vx=0; vy=-10; score=0; camY=0; plats=[{x:canvas.width/2, y:canvas.height-20}]; isOver=false; updateScoreUI(0); for(let i=0;i<10;i++) spawnPlat(); loop(); }", "function init() { px=canvas.width/2; py=canvas.height-100; vx=0; vy=-10; score=0; camY=0; plats=[{x:canvas.width/2, y:canvas.height-20}]; isOver=false; window.ffLastMilestone = 0; updateScoreUI(0); for(let i=0;i<10;i++) spawnPlat(); loop(); }");
    
    // Trigger on milestone
    const target = 'if(py < canvas.height/2) { camY = canvas.height/2 - py; score = Math.max(score, Math.floor(camY)); updateScoreUI(score); } else camY = 0;';
    const replacement = 'if(py < canvas.height/2) { camY = canvas.height/2 - py; score = Math.max(score, Math.floor(camY)); updateScoreUI(score); let currentMilestone = Math.floor(score / 1000); if(currentMilestone > window.ffLastMilestone && currentMilestone > 0) { window.ffLastMilestone = currentMilestone; ffTriggerRewardEvent("LEVEL_COMPLETE", {score: score}); } } else { camY = 0; }';
    content = content.replace(target, replacement);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('patched froggy-jump');
}

patch();
