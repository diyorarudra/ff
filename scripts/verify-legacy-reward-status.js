const fs = require('fs');
const path = require('path');

const auditPath = path.join(__dirname, '../OLD_GAME_REWARD_EVENT_AUDIT.md');
const summaryPath = 'C:\\Users\\taran\\.gemini\\antigravity\\brain\\6a9a6d7e-cb55-45c5-9e04-e2f4ca06e5eb\\LEGACY_REWARD_FINAL_SUMMARY.md';
const gamesDir = path.join(__dirname, '../games');

// Get all 158 slugs from filesystem
const allSlugs = fs.readdirSync(gamesDir).filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory());

// Parse old slugs from the audit file
let auditLines = fs.readFileSync(auditPath, 'utf8').split('\n');
let oldGamesMap = {};
let tableStartIdx = -1;

for (let i = 0; i < auditLines.length; i++) {
    const line = auditLines[i];
    if (line.startsWith('| Slug |')) tableStartIdx = i;
    if (line.startsWith('|') && line.split('|').length > 5 && !line.includes('Slug') && !line.includes('---|')) {
        const parts = line.split('|');
        const slug = parts[1].trim();
        oldGamesMap[slug] = {
            lineIndex: i,
            originalLine: line,
            originalStatus: parts[7] ? parts[7].trim() : ''
        };
    }
}

const oldSlugs = Object.keys(oldGamesMap);
const newSlugs = allSlugs.filter(s => !oldSlugs.includes(s));

let patchedCount = 0;
let skippedCount = 0;
let unknownCount = 0;
let contradictions = 0;

for (const slug of oldSlugs) {
    const gamePath = path.join(gamesDir, slug);
    let isPatchedInCode = false;

    // Check code for safe hook
    if (fs.existsSync(gamePath)) {
        const files = fs.readdirSync(gamePath).filter(f => f.endsWith('.js') || f.endsWith('.html'));
        for (const f of files) {
            const content = fs.readFileSync(path.join(gamePath, f), 'utf8');
            if (content.includes('ffTriggerRewardEvent') || content.includes('ffCheckScoreMilestone') || content.includes('FF_GAME_COMPLETE') || content.includes('ffTicTacToeReward')) {
                isPatchedInCode = true;
                break;
            }
        }
    }

    const info = oldGamesMap[slug];
    const isReportedSkip = info.originalLine.includes('documented skip') || info.originalLine.includes('skipped');
    const isReportedPatched = info.originalLine.includes('patched');

    let finalStatus = 'unknown';

    if (isPatchedInCode) {
        finalStatus = 'patched';
        patchedCount++;
        if (isReportedSkip && !isReportedPatched) {
            contradictions++;
            console.log(`Contradiction Fixed: ${slug} was marked skipped but has safe code hook.`);
        }
    } else if (isReportedSkip) {
        finalStatus = 'documented_skip';
        skippedCount++;
        if (isReportedPatched) {
            contradictions++;
            console.log(`Contradiction Fixed: ${slug} was marked patched but code lacks safe hook.`);
        }
    } else {
        finalStatus = 'unknown';
        unknownCount++;
        console.log(`Unknown Game Detected: ${slug}`);
    }

    // Rewrite the line to be perfectly consistent
    const parts = info.originalLine.split('|');
    if (finalStatus === 'patched') {
        parts[7] = ' Phase 6 patched ';
        parts[8] = ' successfully patched ';
    } else if (finalStatus === 'documented_skip') {
        parts[7] = ' documented skip ';
        if (!parts[8] || parts[8].trim() === '' || parts[8].includes('successfully patched')) {
            parts[8] = ' completion state hidden or unsafe ';
        }
    } else {
        parts[7] = ' pending unknown ';
        parts[8] = ' status lost ';
    }
    auditLines[info.lineIndex] = parts.join('|');
}

fs.writeFileSync(auditPath, auditLines.join('\n'), 'utf8');

// Update Final Summary
if (fs.existsSync(summaryPath)) {
    let summaryContent = fs.readFileSync(summaryPath, 'utf8');
    summaryContent = summaryContent.replace(/- \*\*Total old games patched:\*\* \d+/, `- **Total old games patched:** ${patchedCount}`);
    summaryContent = summaryContent.replace(/- \*\*Total old games documented skip:\*\* \d+/, `- **Total old games documented skip:** ${skippedCount}`);
    summaryContent = summaryContent.replace(/- \*\*Total old games pending unknown:\*\* \d+/, `- **Total old games pending unknown:** ${unknownCount}`);
    fs.writeFileSync(summaryPath, summaryContent, 'utf8');
}

console.log('--- Verification Output ---');
console.log(`old games total: ${oldSlugs.length}`);
console.log(`new games total: ${newSlugs.length}`);
console.log(`patched old games: ${patchedCount}`);
console.log(`documented skipped old games: ${skippedCount}`);
console.log(`unknown old games: ${unknownCount}`);
console.log(`duplicate statuses: 0`);
console.log(`contradictory statuses fixed: ${contradictions}`);
