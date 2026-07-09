const fs = require('fs');
const path = require('path');

const helperCode = `
// --- INJECTED MILESTONE BRIDGE (BATCH 2) ---
let ffRewardSentForCurrentRound = false;
let ffLastRewardMilestone = 0;

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

function ffCheckScoreMilestone(scoreValue, milestoneSize = 1000) {
  const milestone = Math.floor(Number(scoreValue || 0) / milestoneSize);
  if (milestone > ffLastRewardMilestone && scoreValue >= milestoneSize) {
    ffLastRewardMilestone = milestone;
    ffTriggerRewardEvent("LEVEL_COMPLETE", {
      level: milestone,
      score: scoreValue,
      coins: 10
    });
  }
}
// ---------------------------------
`;

const mdPath = path.join(__dirname, '../OLD_GAME_REWARD_EVENT_AUDIT.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');
const lines = mdContent.split('\n');

const targets = [
    'asteroids', 'lip-sync-match', 'pac-chase', 'fruit-slicer', 'cookie-tycoon', 
    'hex-connect', 'color-jump', 'auto-rickshaw-weaver', 'millionaire-quiz', 'tic-tac-toe'
];

let patchedCount = 0;
let skippedCount = 0;
let report = `# Legacy Reward Phase 6 Batch 2 Report\n\n| Slug | Patched | Event Type | Milestone Condition | Function Patched | Guard Added | Test Status | Skip Reason |\n|---|---|---|---|---|---|---|---|\n`;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    let isTarget = false;
    let targetSlug = '';
    for (const t of targets) {
        if (line.includes(`| ${t} |`)) {
            isTarget = true;
            targetSlug = t;
            break;
        }
    }
    
    if (isTarget) {
        const gameDir = path.join(__dirname, '../games', targetSlug);
        if (!fs.existsSync(gameDir)) {
            skippedCount++;
            continue;
        }

        let patched = false;
        let eventType = '-';
        let condition = '-';
        let funcPatched = '-';
        let skipReason = '';

        const files = fs.readdirSync(gameDir).filter(f => f.endsWith('.js') || f.endsWith('.html'));
        const searchFiles = files.filter(f => f.endsWith('.js')).concat(files.filter(f => f.endsWith('.html')));

        for (const file of searchFiles) {
            const filePath = path.join(gameDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            
            if (content.includes('ffCheckScoreMilestone')) {
                patched = true;
                eventType = 'EXISTING';
                funcPatched = 'Already Patched';
                break;
            }

            let foundPoint = false;
            let modifiedContent = content;
            
            if (targetSlug === 'tic-tac-toe') {
                const messageRegex = /(message\.textContent\s*=\s*['"](?:X|O) Wins!['"];|winnerMessage\.style\.display\s*=\s*['"]block['"];|showWinScreen\(\);)/;
                if (messageRegex.test(modifiedContent)) {
                    modifiedContent = modifiedContent.replace(messageRegex, `\n    if (typeof ffRewardSentForCurrentRound !== 'undefined' && !ffRewardSentForCurrentRound) { ffRewardSentForCurrentRound = true; ffTriggerRewardEvent('GAME_COMPLETE'); }\n    $1`);
                    foundPoint = true;
                    eventType = 'GAME_COMPLETE';
                    condition = 'Match Win';
                    funcPatched = 'Win Message Block';
                }
            } else {
                // Score milestone
                const scoreUpdateRegex = /(score\s*\+=\s*[0-9a-zA-Z_]+;|points\s*\+=\s*[0-9a-zA-Z_]+;)/gi;
                if (scoreUpdateRegex.test(modifiedContent)) {
                    let size = 1000;
                    if (targetSlug === 'cookie-tycoon' || targetSlug === 'millionaire-quiz') size = 5000;
                    
                    // Need to capture the actual variable name (score or points)
                    modifiedContent = modifiedContent.replace(/(score|points)(\s*\+=\s*[0-9a-zA-Z_]+;)/gi, `$1$2\n    if (typeof ffCheckScoreMilestone !== 'undefined') ffCheckScoreMilestone($1, ${size});\n`);
                    foundPoint = true;
                    eventType = 'LEVEL_COMPLETE';
                    condition = `Score Milestone (${size})`;
                    funcPatched = 'Score Update Statement';
                }
            }

            if (foundPoint) {
                if (file.endsWith('.html')) {
                    modifiedContent = modifiedContent.replace(/<script>/, `<script>\n${helperCode}`);
                } else {
                    modifiedContent = helperCode + modifiedContent;
                }

                ['initGame', 'startGame', 'restartGame', 'resetGame', 'reset', 'init', 'start'].forEach(initFunc => {
                    const regexes = [
                        new RegExp(`(function\\s+${initFunc}\\s*\\([^)]*\\)\\s*\\{)`),
                        new RegExp(`(const\\s+${initFunc}\\s*=\\s*(?:function)?\\s*\\([^)]*\\)\\s*(?:=>)?\\s*\\{)`)
                    ];
                    for (const reg of regexes) {
                        if (reg.test(modifiedContent)) {
                            modifiedContent = modifiedContent.replace(reg, `$1\n    if (typeof ffRewardSentForCurrentRound !== 'undefined') { ffRewardSentForCurrentRound = false; ffLastRewardMilestone = 0; }\n`);
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
            skipReason = 'Injection vector missing';
            lines[i] = line.replace(/\| high \|.*?\|/, '| high | Phase 6 Batch 2 skipped |');
            report += `| ${targetSlug} | No | - | - | - | No | Untested | ${skipReason} |\n`;
        } else {
            lines[i] = line.replace(/\| high \|.*?\|/, '| high | Phase 6 Batch 2 patched |');
            report += `| ${targetSlug} | Yes | ${eventType} | ${condition} | ${funcPatched} | Yes | Pending | - |\n`;
        }
    }
}

fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../LEGACY_REWARD_PHASE6_BATCH2_REPORT.md'), report, 'utf8');

console.log(`Batch 2 Patched: ${patchedCount}`);
console.log(`Batch 2 Skipped: ${skippedCount}`);
