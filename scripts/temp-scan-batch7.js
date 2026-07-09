const fs = require('fs');
const games = [
    'asteroids', 'interrogation', 'lip-sync-match', 'tic-tac-toe', 'cookie-tycoon', 
    'hex-connect', 'stunt-coordinator', 'fingerprint-forensics', 'antidote-mixer', 
    'face-swap-memory', 'lip-sync-editor', 'draw-pixels', 'swipe-basketball', 
    'snake-ladders', 'ludo', 'play-chess', 'connect-the-dots', 'spider-solitaire', 
    'four-colors', 'fruit-merge', 'jo-jo-run', 'draggable-puzzle', 'froggy-jump', 
    'word-scramble-suite'
];
games.forEach(g => {
    let content = '';
    try { content += fs.readFileSync('games/' + g + '/index.html', 'utf8'); } catch(e){}
    try { content += fs.readFileSync('games/' + g + '/script.js', 'utf8'); } catch(e){}
    
    let match = content.match(/score\s*\+=\s*[0-9a-zA-Z_]+/i);
    if (!match) match = content.match(/score\+\+/i);
    if (!match) match = content.match(/points\s*\+=\s*[0-9a-zA-Z_]+/i);
    if (!match) match = content.match(/distance\s*\+=\s*[0-9a-zA-Z_]+/i);
    if (!match) match = content.match(/coins\s*\+=\s*[0-9a-zA-Z_]+/i);
    if (!match) match = content.match(/state\s*=\s*['"](?:WIN|WON|GAMEOVER)['"]/i);
    if (!match) match = content.match(/isWin\s*=\s*true/i);
    if (!match) match = content.match(/winner\s*=\s*/i);
    if (!match) match = content.match(/win\(\)/i);
    if (!match) match = content.match(/gameOver\(\)/i);
    if (!match) match = content.match(/alert\(['"](?:You Win|Level Complete)['"]/i);
    console.log(g, '=>', match ? match[0] : 'Not Found');
});
