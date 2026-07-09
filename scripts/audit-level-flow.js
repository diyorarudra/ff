const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, '..', 'games');
const REPORT_FILE = path.join(__dirname, '..', 'LEVEL_FLOW_AUDIT.md');

const TARGET_GAMES = [
    'daily-word-puzzle', 'word-connect', 'hindi-word-master', 'english-word-challenge',
    'daily-brain-training', 'bollywood-quiz-battle', 'cricket-quiz-league', 'gk-quiz-india',
    'logo-guess-game', 'guess-the-city', 'crossword-mini', 'letter-hunt', 'emoji-movie-guess',
    'wood-block-puzzle', 'hexa-block-puzzle', 'match-3-gems', 'merge-numbers', 'merge-cars',
    'merge-animals', 'idle-shop-manager', 'idle-restaurant-tycoon', 'idle-farm-tycoon',
    'parking-master', 'traffic-control', 'bus-driver-route', 'bike-stunt-challenge',
    'cricket-batting-challenge', 'penalty-shootout', 'archery-master', 'color-sort-puzzle',
    'nonogram-picture-puzzle', 'water-sort-puzzle', 'ball-sort-puzzle', 'escape-room-mini',
    'hidden-object-rooms', 'number-memory-challenge', 'reaction-speed-test', 'find-the-difference'
];

let report = `# Level-Flow Audit Report\n\nDate: ${new Date().toISOString()}\n\n`;
report += `| Game Slug | Has LEVEL_COMPLETE | Has GAME_COMPLETE | Has Next Btn | Type/Risk | Recommendation |\n`;
report += `|-----------|--------------------|-------------------|--------------|-----------|----------------|\n`;

TARGET_GAMES.forEach(slug => {
    const scriptPath = path.join(GAMES_DIR, slug, 'script.js');
    const htmlPath = path.join(GAMES_DIR, slug, 'index.html');
    
    if (!fs.existsSync(scriptPath) || !fs.existsSync(htmlPath)) {
        report += `| ${slug} | MISSING | MISSING | MISSING | HIGH | Check folder |\n`;
        return;
    }

    const script = fs.readFileSync(scriptPath, 'utf8');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const hasLevelComplete = script.includes('LEVEL_COMPLETE');
    const hasGameComplete = script.includes('GAME_COMPLETE');
    const hasNextBtn = html.toLowerCase().includes('next level') || script.toLowerCase().includes('nextlevel');
    const isIdle = slug.includes('idle') || slug.includes('merge');

    let risk = "MEDIUM";
    let rec = "Standard Modal Injection";

    if (isIdle) {
        risk = "LOW";
        rec = "Leave alone (Idle/Endless milestones)";
    } else if (hasLevelComplete && hasNextBtn) {
        risk = "LOW";
        rec = "Already has flow, maybe just UI tweak";
    } else if (!hasLevelComplete && !hasGameComplete) {
        risk = "HIGH";
        rec = "Manual rewrite needed (No events)";
    } else if (!hasLevelComplete && hasGameComplete) {
        risk = "MEDIUM";
        rec = "Single-level game, needs multi-round wrapper manually";
    } else if (hasLevelComplete && !hasNextBtn) {
        risk = "MEDIUM";
        rec = "Auto-loads next round. Needs Pause Modal injection.";
    }

    report += `| ${slug} | ${hasLevelComplete ? '✅' : '❌'} | ${hasGameComplete ? '✅' : '❌'} | ${hasNextBtn ? '✅' : '❌'} | ${risk} | ${rec} |\n`;
});

fs.writeFileSync(REPORT_FILE, report, 'utf8');
console.log("Audit complete. See LEVEL_FLOW_AUDIT.md");
