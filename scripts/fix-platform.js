const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../js/platform.js');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\\`/g, '\`').replace(/\\\$/g, '$');
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed platform.js backticks!');
