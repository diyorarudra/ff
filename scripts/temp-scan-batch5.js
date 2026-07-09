const fs = require('fs');
const games = [
    'play-chess', 'spider-solitaire', 'four-colors', 'virtual-drum', 'virtual-piano', 
    'guess-the-song', 'fruit-merge', 'jo-jo-run', 'solve-math-ex', 'guess-number', 
    'hacker-challenge', '3d-car-run'
];
games.forEach(g => {
    let content = '';
    try { content += fs.readFileSync('games/' + g + '/index.html', 'utf8'); } catch(e){}
    try { content += fs.readFileSync('games/' + g + '/script.js', 'utf8'); } catch(e){}
    
    let match = content.match(/score\s*\+=\s*[0-9a-zA-Z_]+|points\s*\+=\s*[0-9a-zA-Z_]+|coins\s*\+=\s*[0-9a-zA-Z_]+|win\(\)|gameOver\(\)|state\s*=\s*['"](?:WIN|WON)['"]/i);
    console.log(g, '=>', match ? match[0] : 'Not Found');
});
