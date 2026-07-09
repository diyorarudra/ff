const fs = require('fs');
const files = [
  'games/hindi-word-master/index.html',
  'games/daily-word-puzzle/index.html',
  'games/english-word-challenge/index.html',
  'games/merge-cars/index.html'
];
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  // There is only one '<div class="relative hidden md:block">' which is the search box in the navbar.
  html = html.replace('<div class="relative hidden md:block">', '<div class="relative block">');
  fs.writeFileSync(file, html);
}
console.log('Done fixing search box.');
