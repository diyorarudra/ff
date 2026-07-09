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
    const file = 'games/snake-ladders/index.html';
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject helper
    content = content.replace('const canvas = document.getElementById(\'gameCanvas_57\'); const ctx = canvas.getContext(\'2d\');', helper + '\n        const canvas = document.getElementById(\'gameCanvas_57\'); const ctx = canvas.getContext(\'2d\');');
    
    // Reset guard
    content = content.replace("function init() { pos=0; aiPos=0; isOver=false; message=\"Click to Roll Dice!\"; updateScoreUI(0); draw(); }", "function init() { pos=0; aiPos=0; isOver=false; message=\"Click to Roll Dice!\"; window.ffRoundRewardGiven=false; updateScoreUI(0); draw(); }");
    
    // Trigger on human win
    const target = 'if(pos>=100){pos=100; message="You Win!"; isOver=true; updateScoreUI(100);}';
    const replacement = 'if(pos>=100){pos=100; message="You Win!"; isOver=true; updateScoreUI(100); if(!window.ffRoundRewardGiven){window.ffRoundRewardGiven=true; ffTriggerRewardEvent("GAME_COMPLETE", {score: 100});}}';
    content = content.replace(target, replacement);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('patched snake-ladders');
}

patch();
