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
let report = `# Legacy Reward Phase 5 Report\n\n| Slug | Patched | Event Added | Trigger Location | Duplicate Guard | Test Status | Reason |\n|---|---|---|---|---|---|---|\n`;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Target 34 skipped low-risk OR 15 medium-risk
    if (line.includes('| low | skipped |') || line.includes('| medium |')) {
        const parts = line.split('|').map(s => s.trim());
        const slug = parts[1];
        const winFuncStr = parts[3] !== '-' ? parts[3] : '';
        const overFuncStr = parts[4] !== '-' ? parts[4] : '';
        const recommendation = parts[5]; // LEVEL_COMPLETE or GAME_COMPLETE
        const risk = parts[6];

        let patched = false;
        let skipReason = '';
        let eventAdded = '-';
        let triggerLoc = '-';

        const gameDir = path.join(__dirname, '../games', slug);
        if (!fs.existsSync(gameDir)) {
            skippedCount++;
            continue;
        }

        const files = fs.readdirSync(gameDir).filter(f => f.endsWith('.js') || f.endsWith('.html'));
        const targetFiles = files.filter(f => f.endsWith('.js')).concat(files.filter(f => f.endsWith('.html')));

        for (const file of targetFiles) {
            const filePath = path.join(gameDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            if (content.includes('ffTriggerRewardEvent')) {
                patched = true;
                eventAdded = recommendation;
                triggerLoc = 'Already Patched';
                break;
            }

            let foundWinPoint = false;
            let modifiedContent = content;
            
            // Combine all possible targets from audit
            let targets = [];
            if (winFuncStr) targets = targets.concat(winFuncStr.split(', '));
            if (overFuncStr && risk === 'medium') targets = targets.concat(overFuncStr.split(', '));
            
            // Default common fallbacks
            targets = targets.concat(['gameOver', 'endGame', 'showGameOver', 'winGame']);
            
            // Broad overlay search
            const overlayRegex = /([a-zA-Z0-9_]+(?:Over|End|Lose)Overlay\.style\.opacity\s*=\s*['"]1['"];|[a-zA-Z0-9_]+(?:Menu|Screen)\.classList\.remove\(['"]hidden['"]\);)/gi;
            // State assignment search
            const stateRegex = /(state\s*=\s*['"](?:GAMEOVER|OVER|END|DONE)['"];|isGameOver\s*=\s*true;)/gi;
            
            const triggerCode = `\n    if (typeof ffRewardSentForCurrentRound !== 'undefined' && !ffRewardSentForCurrentRound) { ffRewardSentForCurrentRound = true; ffTriggerRewardEvent('${recommendation}'); }\n`;

            if (overlayRegex.test(modifiedContent)) {
                modifiedContent = modifiedContent.replace(overlayRegex, `${triggerCode}$1`);
                foundWinPoint = true;
                triggerLoc = 'Overlay/Class modification';
            } else if (stateRegex.test(modifiedContent)) {
                modifiedContent = modifiedContent.replace(stateRegex, `${triggerCode}$1`);
                foundWinPoint = true;
                triggerLoc = 'State assignment';
            } else {
                for (const t of targets) {
                    if (!t) continue;
                    const regexes = [
                        new RegExp(`(function\\s+${t}\\s*\\([^)]*\\)\\s*\\{)`),
                        new RegExp(`(const\\s+${t}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`),
                        new RegExp(`(let\\s+${t}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`),
                        new RegExp(`(var\\s+${t}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`),
                        new RegExp(`(${t}\\s*:\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`)
                    ];
                    for (const reg of regexes) {
                        if (reg.test(modifiedContent)) {
                            modifiedContent = modifiedContent.replace(reg, `$1${triggerCode}`);
                            foundWinPoint = true;
                            triggerLoc = `Function: ${t}`;
                            break;
                        }
                    }
                    if (foundWinPoint) break;
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
                eventAdded = recommendation;
                break;
            }
        }

        if (!patched) {
            skippedCount++;
            skipReason = 'No standard trigger signature found';
            if (line.includes('| low | skipped |')) {
                lines[i] = line.replace('| low | skipped |', '| low | Phase 5 skipped |');
            } else {
                lines[i] = line.replace('| medium | no |', '| medium | Phase 5 skipped |');
            }
            report += `| ${slug} | No | - | - | No | Untested | ${skipReason} |\n`;
        } else {
            if (line.includes('| low | skipped |')) {
                lines[i] = line.replace('| low | skipped |', '| low | Phase 5 patched |');
            } else {
                lines[i] = line.replace('| medium | no |', '| medium | Phase 5 patched |');
            }
            report += `| ${slug} | Yes | ${eventAdded} | ${triggerLoc} | Yes | Pending | - |\n`;
        }
    } else if (line.includes('| high |')) {
        lines[i] = line.replace('| high | no |', '| high | still pending high-risk |');
    }
}

fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../LEGACY_REWARD_PHASE5_REPORT.md'), report, 'utf8');

console.log(`Phase 5 Patched: ${patchedCount}`);
console.log(`Phase 5 Skipped: ${skippedCount}`);
