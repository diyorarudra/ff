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
    const file = 'games/ludo/index.html';
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject helper
    content = content.replace('const canvas = document.getElementById(\'gameCanvas_58\'); const ctx = canvas.getContext(\'2d\');', helper + '\n        const canvas = document.getElementById(\'gameCanvas_58\'); const ctx = canvas.getContext(\'2d\');');
    
    // Reset guard
    content = content.replace("function init() { p=0; ai=0; isOver=false; msg=\"Click to Roll!\"; updateScoreUI(0); draw(); }", "function init() { p=0; ai=0; isOver=false; msg=\"Click to Roll!\"; window.ffRoundRewardGiven=false; updateScoreUI(0); draw(); }");
    
    // Trigger on human win
    const target = 'if(player) { p+=dice; if(p>=40){p=40; isOver=true; msg="You Win!"; updateScoreUI(100);} else { msg="You:"+dice+". AI turn."; draw(); setTimeout(()=>play(false), 700); return;} }';
    const replacement = 'if(player) { p+=dice; if(p>=40){p=40; isOver=true; msg="You Win!"; updateScoreUI(100); if(!window.ffRoundRewardGiven){window.ffRoundRewardGiven=true; ffTriggerRewardEvent("GAME_COMPLETE", {score: 100});}} else { msg="You:"+dice+". AI turn."; draw(); setTimeout(()=>play(false), 700); return;} }';
    content = content.replace(target, replacement);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('patched ludo');
}

patch();
