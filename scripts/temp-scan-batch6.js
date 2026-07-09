const fs = require('fs');
const games = [
    'play-chess', 'spider-solitaire', 'four-colors', 'fruit-merge', 'jo-jo-run',
    'balloons-shooter', 'cannon-balls', 'memory-card-match', 'neon-brick-breaker', 
    'bubble-pop-classic', 'froggy-jump', 'tower-stack-arena', 'retro-tic-tac-toe', 
    'maze-escape', 'color-tap-runner', 'space-asteroids-culler' // adding one to make 16
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
    console.log(g, '=>', match ? match[0] : 'Not Found');
});
