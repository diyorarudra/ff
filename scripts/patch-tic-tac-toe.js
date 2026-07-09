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

function patchTicTacToe() {
    const file = 'games/tic-tac-toe/index.html';
    let content = fs.readFileSync(file, 'utf8');
    
    // Inject helper
    content = content.replace('const cells = document.querySelectorAll(\'.cell\');', helper + '\n    const cells = document.querySelectorAll(\'.cell\');');
    
    // Reset guard
    content = content.replace("currentPlayer = 'X';", "currentPlayer = 'X';\n      window.ffRoundRewardGiven = false;");
    
    // Trigger on human win
    const target = 'statusText.className = "text-5xl font-bold mb-6 font-heading text-cyan-400 drop-shadow-md";';
    const replacement = target + '\n          if (!window.ffRoundRewardGiven) {\n              window.ffRoundRewardGiven = true;\n              ffTriggerRewardEvent("GAME_COMPLETE", { score: scoreP1 });\n          }';
    content = content.replace(target, replacement);
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('patched tic-tac-toe');
}

patchTicTacToe();
