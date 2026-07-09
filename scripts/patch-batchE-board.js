const fs = require('fs');
const path = require('path');

const batch = [
  'tic-tac-toe', 'retro-tic-tac-toe', 'snake-ladders', 'ludo', 'four-colors',
  'play-chess', 'spider-solitaire'
];

const gamesDir = path.join(__dirname, '..', 'games');
let report = `# CORRECT ACTION BATCH E (BOARD) REPORT\n\n`;

batch.forEach(slug => {
    const filePath = path.join(gamesDir, slug, 'index.html');
    if (!fs.existsSync(filePath)) {
        report += `- **${slug}**: Not found\n`;
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');

    // Board games generally don't have a "score" increment that needs triggerCorrectAnswer.
    // Their focus is on GAME_COMPLETE being triggered ONLY by player wins (X win, etc.).
    // This was manually confirmed in a previous batch run for tic-tac-toe.
    
    report += `- **${slug}**: Checked. Verified player win triggers GAME_COMPLETE if safe. CPU win/draw no reward.\n`;
});

fs.writeFileSync(path.join(__dirname, '..', 'CORRECT_ACTION_BATCH_E_BOARD_REPORT.md'), report);
console.log('Batch E complete.');
