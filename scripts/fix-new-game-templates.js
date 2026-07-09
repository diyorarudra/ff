const fs = require('fs');
const path = require('path');

const newGames = [
  'daily-word-puzzle', 'word-connect', 'hindi-word-master', 'english-word-challenge',
  'daily-brain-training', 'bollywood-quiz-battle', 'cricket-quiz-league', 'gk-quiz-india',
  'logo-guess-game', 'guess-the-city', 'crossword-mini', 'letter-hunt', 'emoji-movie-guess',
  'wood-block-puzzle', 'hexa-block-puzzle', 'match-3-gems', 'merge-numbers', 'merge-cars',
  'merge-animals', 'idle-shop-manager', 'idle-restaurant-tycoon', 'idle-farm-tycoon',
  'parking-master', 'traffic-control', 'bus-driver-route', 'bike-stunt-challenge',
  'cricket-batting-challenge', 'penalty-shootout', 'archery-master', 'color-sort-puzzle',
  'nonogram-picture-puzzle', 'water-sort-puzzle', 'ball-sort-puzzle', 'escape-room-mini',
  'hidden-object-rooms', 'number-memory-challenge', 'reaction-speed-test', 'find-the-difference'
];

const gamesDir = path.join(__dirname, '..', 'games');
const templateHtmlPath = path.join(gamesDir, 'tic-tac-toe', 'index.html');

let templateStr = fs.readFileSync(templateHtmlPath, 'utf-8');

function extractGameTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/);
  if (match) {
    let t = match[1];
    t = t.replace(' - Play Free Online Game | FF Live Play', '').trim();
    return t;
  }
  return "Game";
}

function extractBodyInner(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  if (bodyMatch) {
    let inner = bodyMatch[1];
    // Remove the script.js if it exists in a relative form
    inner = inner.replace(/<script\s+src=["'](script\.js|\.\/script\.js)["']><\/script>/g, '');
    return inner.trim();
  }
  return '';
}

for (const slug of newGames) {
  const gameFolder = path.join(gamesDir, slug);
  const indexFile = path.join(gameFolder, 'index.html');
  const styleFile = path.join(gameFolder, 'style.css');

  if (!fs.existsSync(indexFile)) {
    console.warn(`File missing: ${indexFile}`);
    continue;
  }

  const origHtml = fs.readFileSync(indexFile, 'utf-8');
  
  // If it already has ffliveplay branding/nav, skip it
  if (origHtml.includes('ffliveplay') && origHtml.includes('<nav class="navbar')) {
    console.log(`Skipping ${slug}, already wrapped.`);
    continue;
  }

  const title = extractGameTitle(origHtml);
  let innerHtml = extractBodyInner(origHtml);

  // Fix CSS if it exists
  if (fs.existsSync(styleFile)) {
    let css = fs.readFileSync(styleFile, 'utf-8');
    // replace body { with .new-game-wrapper {
    // We use a regex that matches body { or body{ with possible spaces
    css = css.replace(/(^|\n|\s)body\s*\{/g, '$1.new-game-wrapper {');
    fs.writeFileSync(styleFile, css, 'utf-8');
  }

  // Build the new HTML based on the template
  let newHtml = templateStr;
  
  // 1. Replace Title in meta tags
  newHtml = newHtml.replace(/Tic-Tac-Toe/g, title);
  newHtml = newHtml.replace(/<title>.*?<\/title>/g, `<title>${title} - Play Free Online Game | FF Live Play</title>`);
  newHtml = newHtml.replace(/Tic/g, title); // For the shorter title in OG tags if any
  
  // 2. Fix CSS/JS absolute paths
  // Inject the absolute style.css right before </head>
  newHtml = newHtml.replace('</head>', `  <link rel="stylesheet" href="/games/${slug}/style.css">\n</head>`);
  
  // Inject the absolute script.js right before </body>
  newHtml = newHtml.replace('</body>', `  <script src="/games/${slug}/script.js"></script>\n</body>`);

  // 3. Replace the game area
  // In tic-tac-toe, the game area is from `<div class="game-header...` down to the end of `<div class="adsense-seo-block...`
  // A simple way is to use regex or string split. Let's find the h1 tag inside game-container.
  
  const h1Match = newHtml.match(/<h1 class="[^"]*">Play .*? Online<\/h1>/);
  if (!h1Match) {
    console.error("Could not find h1 in template!");
    continue;
  }
  
  const startIndex = newHtml.indexOf(h1Match[0]) + h1Match[0].length;
  
  // Find the end of the tic-tac-toe specific content.
  // It ends before the `<div class="w-full mb-8 mt-4">` (which contains the ad-slot-in-article)
  const adSlotIndex = newHtml.indexOf('<div class="w-full mb-8 mt-4">');
  
  const beforeContent = newHtml.substring(0, startIndex);
  const afterContent = newHtml.substring(adSlotIndex);
  
  // Also, we need to remove the tic-tac-toe specific scripts that are right before </body>
  // They start at `<script>` for tic-tac-toe logic. We can strip all scripts that deal with tic-tac-toe.
  // Let's just remove anything between `<script>` and `</script>` that contains `const cells =` or `let board =`.
  let cleanedAfterContent = afterContent.replace(/<script>[\s\S]*?const cells =[\s\S]*?<\/script>/, '');
  
  // Wrap the new game's inner HTML
  const wrappedInnerHtml = `\n\n<div class="new-game-wrapper" style="width:100%; display:flex; justify-content:center; align-items:center; flex:1; min-height: 600px; padding: 20px 0;">\n${innerHtml}\n</div>\n\n`;
  
  const finalHtml = beforeContent + wrappedInnerHtml + cleanedAfterContent;
  
  fs.writeFileSync(indexFile, finalHtml, 'utf-8');
  console.log(`Processed ${slug}`);
}

console.log('All 38 new games updated successfully.');
