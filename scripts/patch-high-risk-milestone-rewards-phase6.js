const fs = require('fs');
const path = require('path');

const helperCode = `
// --- INJECTED MILESTONE BRIDGE ---
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

function ffCheckScoreMilestone(score, milestoneSize = 1000) {
  const milestone = Math.floor(score / milestoneSize);
  if (milestone > ffLastRewardMilestone && score >= milestoneSize) {
    ffLastRewardMilestone = milestone;
    ffTriggerRewardEvent("LEVEL_COMPLETE", { level: milestone, score: score, coins: 10 });
  }
}
// ---------------------------------
`;

const mdPath = path.join(__dirname, '../OLD_GAME_REWARD_EVENT_AUDIT.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');
const lines = mdContent.split('\n');

let patchedCount = 0;
let skippedCount = 0;
let report = `# Legacy Reward Phase 6 Batch 1 Report\n\n| Slug | Patched | Event Added | Trigger Type | Test Status | Reason |\n|---|---|---|---|---|---|\n`;

// Process max 20 games
let processed = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('| high | still pending high-risk |') || line.includes('| high | no |')) {
        if (processed >= 20) break;
        processed++;

        const parts = line.split('|').map(s => s.trim());
        const slug = parts[1];
        
        let patched = false;
        let skipReason = '';
        let eventAdded = '-';
        let triggerType = '-';

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
                eventAdded = 'EXISTING';
                triggerType = 'Already Patched';
                break;
            }

            let foundPoint = false;
            let modifiedContent = content;
            
            // Signature 1: Tic Tac Toe (Match win logic)
            // Look for common win detection arrays or lines like isWin = true in board games
            if (slug.includes('tic-tac-toe')) {
                const winRegex = /(checkWin\s*\([^)]*\)\s*\{[\s\S]*?return\s+true;)|(if\s*\([^)]*checkWin[^)]*\)\s*\{)/;
                if (winRegex.test(modifiedContent)) {
                    // Inject GAME_COMPLETE near win message or state change
                    const messageRegex = /(message\.textContent\s*=\s*['"](?:X|O) Wins!['"];|winnerMessage\.style\.display\s*=\s*['"]block['"];|showWinScreen\(\);)/;
                    if (messageRegex.test(modifiedContent)) {
                        modifiedContent = modifiedContent.replace(messageRegex, `\n    if (typeof ffRewardSentForCurrentRound !== 'undefined' && !ffRewardSentForCurrentRound) { ffRewardSentForCurrentRound = true; ffTriggerRewardEvent('GAME_COMPLETE'); }\n    $1`);
                        foundPoint = true;
                        eventAdded = 'GAME_COMPLETE';
                        triggerType = 'Match Win (TicTacToe)';
                    }
                }
            } 
            // Signature 2: Arcade/Endless score update (updateScore or score += X)
            else if (slug.includes('snake') || slug.includes('flappy') || slug.includes('runner') || slug.includes('asteroids')) {
                const scoreUpdateRegex = /(score\s*\+=\s*[0-9a-zA-Z_]+;|score\+\+;)/gi;
                if (scoreUpdateRegex.test(modifiedContent)) {
                    let milestoneSize = 1000;
                    if (slug.includes('snake') || slug.includes('flappy')) milestoneSize = 10;
                    
                    modifiedContent = modifiedContent.replace(scoreUpdateRegex, `$1\n    if (typeof ffCheckScoreMilestone !== 'undefined') ffCheckScoreMilestone(score, ${milestoneSize});\n`);
                    foundPoint = true;
                    eventAdded = 'LEVEL_COMPLETE';
                    triggerType = `Score Milestone (every ${milestoneSize})`;
                }
            }

            if (foundPoint) {
                if (file.endsWith('.html')) {
                    modifiedContent = modifiedContent.replace(/<script>/, `<script>\n${helperCode}`);
                } else {
                    modifiedContent = helperCode + modifiedContent;
                }

                // Inject resets
                ['initGame', 'startGame', 'restartGame', 'resetGame', 'reset', 'init'].forEach(initFunc => {
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
            skipReason = 'Unsafe architecture for auto milestone';
            lines[i] = line.replace(/\| high \|.*?\|/, '| high | Phase 6 Batch 1 skipped |');
            report += `| ${slug} | No | - | - | Untested | ${skipReason} |\n`;
        } else {
            lines[i] = line.replace(/\| high \|.*?\|/, '| high | Phase 6 Batch 1 patched |');
            report += `| ${slug} | Yes | ${eventAdded} | ${triggerType} | Pending | - |\n`;
        }
    }
}

fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../LEGACY_REWARD_PHASE6_REPORT.md'), report, 'utf8');

console.log(`Phase 6 Batch 1 Patched: ${patchedCount}`);
console.log(`Phase 6 Batch 1 Skipped: ${skippedCount}`);
