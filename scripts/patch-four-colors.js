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
    const file = 'games/four-colors/index.html';
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject helper
    content = content.replace('const canvas = document.getElementById(\'gameCanvas_65\'); const ctx = canvas.getContext(\'2d\');', helper + '\n        const canvas = document.getElementById(\'gameCanvas_65\'); const ctx = canvas.getContext(\'2d\');');
    
    // Reset guard
    content = content.replace("function init() { hand=[]; for(let i=0; i<5; i++) hand.push({c:Math.floor(Math.random()*4), n:Math.floor(Math.random()*9)+1}); pile={c:Math.floor(Math.random()*4), n:Math.floor(Math.random()*9)+1}; isOver=false; msg=\"Match color or number!\"; updateScoreUI(5); draw(); }", "function init() { hand=[]; for(let i=0; i<5; i++) hand.push({c:Math.floor(Math.random()*4), n:Math.floor(Math.random()*9)+1}); pile={c:Math.floor(Math.random()*4), n:Math.floor(Math.random()*9)+1}; isOver=false; msg=\"Match color or number!\"; window.ffRoundRewardGiven=false; updateScoreUI(5); draw(); }");
    
    // Trigger on win
    const target = 'if(card.c===pile.c || card.n===pile.n) { pile = card; hand.splice(idx,1); updateScoreUI(hand.length); if(hand.length===0){isOver=true; msg="UNO! YOU WIN!";} }';
    const replacement = 'if(card.c===pile.c || card.n===pile.n) { pile = card; hand.splice(idx,1); updateScoreUI(hand.length); if(hand.length===0){isOver=true; msg="UNO! YOU WIN!"; if(!window.ffRoundRewardGiven){window.ffRoundRewardGiven=true; ffTriggerRewardEvent("GAME_COMPLETE", {score: 100});}} }';
    content = content.replace(target, replacement);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('patched four-colors');
}

patch();
