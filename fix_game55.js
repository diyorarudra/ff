const fs = require('fs');
const path = require('path');

const game56 = path.join(__dirname, 'games/game56/index.html');
const game55 = path.join(__dirname, 'games/game55/index.html');

let content = fs.readFileSync(game56, 'utf8');
content = content.replace(/game56/g, 'game55');
content = content.replace(/Game 56/g, 'Game 55');
content = content.replace(/gameCanvas_56/g, 'gameCanvas_55');

fs.writeFileSync(game55, content, 'utf8');
console.log('Game 55 restored from 56');
