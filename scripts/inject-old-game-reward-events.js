const fs = require('fs');
const path = require('path');

const helperCode = `
// --- INJECTED REWARD BRIDGE ---
let ffRewardSentForCurrentRound = false;
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
// ------------------------------
`;

// Parse markdown
const mdPath = path.join(__dirname, '../OLD_GAME_REWARD_EVENT_AUDIT.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');
const lines = mdContent.split('\n');

let patchedCount = 0;
let skippedCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('| low | yes |')) {
        const parts = line.split('|').map(s => s.trim());
        const slug = parts[1];
        const winFuncs = parts[3].split(', ');
        const recommendation = parts[5]; // LEVEL_COMPLETE or GAME_COMPLETE
        
        let patched = false;
        let skipReason = '';

        const gameDir = path.join(__dirname, '../games', slug);
        if (!fs.existsSync(gameDir)) {
            skippedCount++;
            continue;
        }

        const files = fs.readdirSync(gameDir).filter(f => f.endsWith('.js') || f.endsWith('.html'));

        // Prefer patching the main script file first, then fallback to html
        const targetFiles = files.filter(f => f.endsWith('.js')).concat(files.filter(f => f.endsWith('.html')));

        for (const file of targetFiles) {
            const filePath = path.join(gameDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            if (content.includes('ffTriggerRewardEvent')) {
                // already patched
                patched = true;
                break;
            }

            let foundWinPoint = false;
            let modifiedContent = content;

            // Target 1: Overlay display (most common in old games)
            // e.g. gameWonOverlay.style.opacity = '1';
            const overlayRegex = /([a-zA-Z0-9_]+(?:Won|Win|Complete|Victory|Success)Overlay\.style\.opacity\s*=\s*['"]1['"];)/gi;
            
            // Target 2: State assignment
            // e.g. state = 'WON'; or isWin = true;
            const stateRegex = /(state\s*=\s*['"](?:WON|WIN|COMPLETE)['"];|isWin\s*=\s*true;)/gi;

            // Target 3: Fallback function declaration from the audit
            const funcRegexes = winFuncs.filter(w => w).map(winFunc => {
                return new RegExp(`(function\\s+${winFunc}\\s*\\([^)]*\\)\\s*\\{|const\\s+${winFunc}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{|let\\s+${winFunc}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{|var\\s+${winFunc}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{|${winFunc}\\s*:\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`);
            });

            const triggerCode = `\n    if (typeof ffRewardSentForCurrentRound !== 'undefined' && !ffRewardSentForCurrentRound) { ffRewardSentForCurrentRound = true; ffTriggerRewardEvent('${recommendation}'); }\n`;

            if (overlayRegex.test(modifiedContent)) {
                modifiedContent = modifiedContent.replace(overlayRegex, `${triggerCode}$1`);
                foundWinPoint = true;
            } else if (stateRegex.test(modifiedContent)) {
                modifiedContent = modifiedContent.replace(stateRegex, `${triggerCode}$1`);
                foundWinPoint = true;
            } else {
                for (const reg of funcRegexes) {
                    if (reg.test(modifiedContent)) {
                        modifiedContent = modifiedContent.replace(reg, `$1${triggerCode}`);
                        foundWinPoint = true;
                        break;
                    }
                }
            }

            if (foundWinPoint) {
                // Inject helper at top of script block or file
                if (file.endsWith('.html')) {
                    modifiedContent = modifiedContent.replace(/<script>/, `<script>\n${helperCode}`);
                } else {
                    modifiedContent = helperCode + modifiedContent;
                }

                // Inject resets
                ['initGame', 'startGame', 'restartGame', 'resetGame', 'reset', 'init'].forEach(initFunc => {
                    const regexes = [
                        new RegExp(`(function\\s+${initFunc}\\s*\\([^)]*\\)\\s*\\{)`),
                        new RegExp(`(const\\s+${initFunc}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`),
                        new RegExp(`(let\\s+${initFunc}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`),
                        new RegExp(`(var\\s+${initFunc}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`),
                        new RegExp(`(${initFunc}\\s*:\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`)
                    ];
                    for (const reg of regexes) {
                        if (reg.test(modifiedContent)) {
                            modifiedContent = modifiedContent.replace(reg, `$1\n    if (typeof ffRewardSentForCurrentRound !== 'undefined') ffRewardSentForCurrentRound = false;\n`);
                        }
                    }
                });

                fs.writeFileSync(filePath, modifiedContent, 'utf8');
                patched = true;
                patchedCount++;
                break;
            }
        }

        if (!patched) {
            skippedCount++;
            // Update markdown to show skipped
            lines[i] = line.replace('| low | yes |', '| low | skipped |');
        } else {
            lines[i] = line.replace('| low | yes |', '| low | patched |');
        }
    }
}

fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');

console.log(`Patched: ${patchedCount}`);
console.log(`Skipped: ${skippedCount}`);
