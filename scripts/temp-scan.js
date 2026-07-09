const fs = require('fs');
const games = ['cube-move', 'play-chess', 'faster-or-slower', 'quiz-game-2', 'four-colors', 'car-rush', 'fruit-merge', 'fill-the-water', 'chibi-hero', 'jo-jo-run'];
games.forEach(g => {
    let content = '';
    try { content += fs.readFileSync('games/' + g + '/index.html', 'utf8'); } catch(e){}
    try { content += fs.readFileSync('games/' + g + '/script.js', 'utf8'); } catch(e){}
    
    let match = content.match(/score\s*\+=\s*[0-9a-zA-Z_]+|points\s*\+=\s*[0-9a-zA-Z_]+|win\(\)|gameOver\(\)|state\s*=\s*['"](?:WIN|WON)['"]/i);
    console.log(g, '=>', match ? match[0] : 'Not Found');
});
