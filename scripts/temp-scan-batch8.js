const fs = require('fs');
const games = [
    'tic-tac-toe', 'antidote-mixer', 'face-swap-memory', 'lip-sync-editor', 'draw-pixels', 
    'snake-ladders', 'ludo', 'play-chess', 'spider-solitaire', 'four-colors', 
    'fruit-merge', 'jo-jo-run', 'froggy-jump'
];
games.forEach(g => {
    let content = '';
    try { content += fs.readFileSync('games/' + g + '/index.html', 'utf8'); } catch(e){}
    try { content += fs.readFileSync('games/' + g + '/script.js', 'utf8'); } catch(e){}
    
    let match = content.match(/score\s*\+=\s*[0-9a-zA-Z_]+/i);
    if (!match) match = content.match(/score\+\+/i);
    if (!match) match = content.match(/win\(\)/i);
    if (!match) match = content.match(/winner\s*=/i);
    if (!match) match = content.match(/alert\(['"](?:You Win|Level Complete)['"]\)/i);
    if (!match) match = content.match(/message\s*=\s*['"](?:Player|Red|Blue).*?Wins!['"]/i);
    if (!match) match = content.match(/gameOver\(\)/i);
    if (!match) match = content.match(/finishGame\(\)/i);
    console.log(g, '=>', match ? match[0] : 'Not Found');
});
