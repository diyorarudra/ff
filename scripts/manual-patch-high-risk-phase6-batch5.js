const fs = require('fs');
const path = require('path');

const helperCode = `
// --- INJECTED MILESTONE BRIDGE (BATCH 5) ---
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
  const numericScore = Number(scoreValue || 0);
  const milestone = Math.floor(numericScore / milestoneSize);
  if (milestone > ffLastRewardMilestone && numericScore >= milestoneSize) {
    ffLastRewardMilestone = milestone;
    ffTriggerRewardEvent("LEVEL_COMPLETE", { level: milestone, score: numericScore, coins: 10 });
  }
}
// ---------------------------------
`;

const mdPath = path.join(__dirname, '../OLD_GAME_REWARD_EVENT_AUDIT.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');
const lines = mdContent.split('\n');

let patchedCount = 0;
let skippedCount = 0;
let report = `# Legacy Reward Phase 6 Batch 5 Report\n\n| Slug | Patched | Event Type | Milestone Condition | Function Patched | Guard Added | Test Status | Skip Reason |\n|---|---|---|---|---|---|---|---|\n`;

function getGameFiles(slug) {
    const gameDir = path.join(__dirname, '../games', slug);
    if (!fs.existsSync(gameDir)) return null;
    const files = fs.readdirSync(gameDir).filter(f => f.endsWith('.js') || f.endsWith('.html'));
    return files.map(f => ({
        name: f,
        path: path.join(gameDir, f),
        content: fs.readFileSync(path.join(gameDir, f), 'utf8')
    }));
}

function saveGameFile(filePath, modifiedContent) {
    if (filePath.endsWith('.html')) {
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
}

function applyScorePlusPlusMilestonePatch(slug, milestoneSize) {
    let patched = false;
    const files = getGameFiles(slug);
    if (!files) return false;

    for (const file of files) {
        if (file.content.includes('ffCheckScoreMilestone')) return true;

        const scoreRegex = /(score\s*\+\+;)/gi;
        if (scoreRegex.test(file.content)) {
            const modified = file.content.replace(scoreRegex, `$1\n    if (typeof ffCheckScoreMilestone !== 'undefined') ffCheckScoreMilestone(score, ${milestoneSize});\n`);
            saveGameFile(file.path, modified);
            patched = true;
            report += `| ${slug} | Yes | LEVEL_COMPLETE | Score Milestone (${milestoneSize}) | Score++ Update | Yes | Pending | - |\n`;
            break;
        }
    }
    return patched;
}

function applyScoreMilestonePatch(slug, milestoneSize) {
    let patched = false;
    const files = getGameFiles(slug);
    if (!files) return false;

    for (const file of files) {
        if (file.content.includes('ffCheckScoreMilestone')) return true;

        const scoreRegex = /(score\s*\+=\s*[0-9a-zA-Z_]+;)/gi;
        if (scoreRegex.test(file.content)) {
            const modified = file.content.replace(scoreRegex, `$1\n    if (typeof ffCheckScoreMilestone !== 'undefined') ffCheckScoreMilestone(score, ${milestoneSize});\n`);
            saveGameFile(file.path, modified);
            patched = true;
            report += `| ${slug} | Yes | LEVEL_COMPLETE | Score Milestone (${milestoneSize}) | Score Update | Yes | Pending | - |\n`;
            break;
        }
    }
    return patched;
}

function patchGuessTheSong() { return applyScoreMilestonePatch('guess-the-song', 500); }
function patchSolveMathEx() { return applyScoreMilestonePatch('solve-math-ex', 100); }
function patch3DCarRun() { return applyScoreMilestonePatch('3d-car-run', 50); }
function patchSubwayRun5() { return applyScoreMilestonePatch('subway-run-5', 500); }
function patchCityBuilder() { return applyScoreMilestonePatch('city-builder', 1000); }
function patchClassicBowling() { return applyScoreMilestonePatch('classic-bowling', 100); }

function patchSnakeClassic() { return applyScorePlusPlusMilestonePatch('snake-classic', 10); }
function patchVirtualDrum() { return applyScorePlusPlusMilestonePatch('virtual-drum', 50); }
function patchVirtualPiano() { return applyScorePlusPlusMilestonePatch('virtual-piano', 50); }
function patchGuessNumber() { return applyScorePlusPlusMilestonePatch('guess-number', 10); }
function patchHackerChallenge() { return applyScorePlusPlusMilestonePatch('hacker-challenge', 10); }

const targetPatchers = {
    'guess-the-song': patchGuessTheSong,
    'solve-math-ex': patchSolveMathEx,
    '3d-car-run': patch3DCarRun,
    'subway-run-5': patchSubwayRun5,
    'city-builder': patchCityBuilder,
    'classic-bowling': patchClassicBowling,
    'snake-classic': patchSnakeClassic,
    'virtual-drum': patchVirtualDrum,
    'virtual-piano': patchVirtualPiano,
    'guess-number': patchGuessNumber,
    'hacker-challenge': patchHackerChallenge
};

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    let isTarget = false;
    let targetSlug = '';
    for (const t of Object.keys(targetPatchers)) {
        if (line.includes(`| ${t} |`)) {
            isTarget = true;
            targetSlug = t;
            break;
        }
    }
    
    if (isTarget) {
        const success = targetPatchers[targetSlug]();
        
        if (!success) {
            skippedCount++;
            lines[i] = line.replace(/\| high \|.*?\|/, '| high | Phase 6 Batch 5 skipped |');
            if (!report.includes(`| ${targetSlug} | Yes`)) {
                report += `| ${targetSlug} | No | - | - | - | No | Untested | Exact signature not found |\n`;
            }
        } else {
            patchedCount++;
            lines[i] = line.replace(/\| high \|.*?\|/, '| high | Phase 6 Batch 5 patched |');
        }
    }
}

fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
fs.writeFileSync(path.join(__dirname, '../LEGACY_REWARD_PHASE6_BATCH5_REPORT.md'), report, 'utf8');

console.log(`Batch 5 Patched: ${patchedCount}`);
console.log(`Batch 5 Skipped: ${skippedCount}`);
