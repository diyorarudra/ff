const fs = require('fs');
const games = [
    'drift-boss', 'moto-x3m', 'stickman-hook', 'slope-run', 'geometry-dash-clone',
    'flappy-bird-clone', 'snake-classic', 'retro-racing', 'neon-defender', 'zombie-survival',
    'space-invaders', 'cosmic-runner', 'play-chess', 'spider-solitaire', 'four-colors', 
    'virtual-drum', 'virtual-piano', 'fruit-merge', 'jo-jo-run', 'guess-number', 
    'hacker-challenge'
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
    console.log(g, '=>', match ? match[0] : 'Not Found');
});
