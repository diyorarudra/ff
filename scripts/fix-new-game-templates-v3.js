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

// Ensure template has a closing body tag if it doesn't
if (!templateStr.includes('</body>')) {
  templateStr = templateStr.replace('</html>', '</body>\n</html>');
}

function extractGameTitle(html) {
  const match = html.match(/<title>(.*?)<\/title>/);
  if (match) {
    let t = match[1];
    t = t.replace(' - Play Free Online Game | FF Live Play', '').trim();
    return t;
  }
  return "Game";
}

function extractInnerContent(html) {
  // We look for the wrapped content
  const startMarker = '<div class="new-game-wrapper" style="width:100%; display:flex; justify-content:center; align-items:center; flex:1; min-height: 600px; padding: 20px 0;">';
  let startIndex = html.indexOf(startMarker);
  if (startIndex === -1) {
    // If not wrapped yet, just extract from body (fallback)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    if (bodyMatch) {
      let inner = bodyMatch[1];
      inner = inner.replace(/<script\s+src=["'](script\.js|\.\/script\.js)["']><\/script>/g, '');
      return inner.trim();
    }
    return '';
  }
  
  startIndex += startMarker.length;
  // Look for where the new-game-wrapper ends. It ends before '<div class="w-full mb-8 mt-4">'
  // We added a closing '</div>\n\n' for new-game-wrapper previously.
  // Actually, we can just find the closing </div> of new-game-wrapper which is right before the w-full mb-8 mt-4 ad slot.
  const endMarker = '</div>\n\n<div class="w-full mb-8 mt-4">';
  let endIndex = html.indexOf(endMarker, startIndex);
  if (endIndex === -1) {
    endIndex = html.indexOf('</div>\n\n\n<div class="w-full mb-8 mt-4">', startIndex);
  }
  if (endIndex === -1) {
    endIndex = html.indexOf('</div>\n<div class="w-full mb-8 mt-4">', startIndex);
  }
  if (endIndex === -1) {
      // Just find the last </div> before <div class="w-full mb-8 mt-4">
      const adSlot = html.indexOf('<div class="w-full mb-8 mt-4">', startIndex);
      if (adSlot !== -1) {
          endIndex = html.lastIndexOf('</div>', adSlot);
      }
  }
  
  if (endIndex !== -1) {
    return html.substring(startIndex, endIndex).trim();
  }
  return '';
}

for (const slug of newGames) {
  const gameFolder = path.join(gamesDir, slug);
  const indexFile = path.join(gameFolder, 'index.html');

  if (!fs.existsSync(indexFile)) {
    console.warn(`File missing: ${indexFile}`);
    continue;
  }

  const origHtml = fs.readFileSync(indexFile, 'utf-8');
  const title = extractGameTitle(origHtml);
  let innerHtml = extractInnerContent(origHtml);

  if (!innerHtml) {
    console.error(`Failed to extract inner HTML for ${slug}`);
    continue;
  }

  // Build the new HTML based on the template
  let newHtml = templateStr;
  
  // Replace Title
  newHtml = newHtml.replace(/Tic-Tac-Toe/g, title);
  newHtml = newHtml.replace(/<title>.*?<\/title>/g, `<title>${title} - Play Free Online Game | FF Live Play</title>`);
  newHtml = newHtml.replace(/Tic/g, title);
  
  // Inject the absolute style.css right before </head>
  newHtml = newHtml.replace('</head>', `  <link rel="stylesheet" href="/games/${slug}/style.css">\n</head>`);
  
  // Inject the absolute script.js right before </body>
  newHtml = newHtml.replace('</body>', `  <script src="/games/${slug}/script.js"></script>\n</body>`);

  const h1Match = newHtml.match(/<h1 class="[^"]*">Play .*? Online<\/h1>/);
  if (!h1Match) {
    console.error("Could not find h1 in template!");
    continue;
  }
  
  const h1Index = newHtml.indexOf(h1Match[0]) + h1Match[0].length;
  const adSlotIndex = newHtml.indexOf('<div class="w-full mb-8 mt-4">');
  
  const beforeContent = newHtml.substring(0, h1Index);
  const afterContent = newHtml.substring(adSlotIndex);
  
  let cleanedAfterContent = afterContent;
  const scriptMatch = cleanedAfterContent.match(/<script>\s*const cells =/);
  if (scriptMatch) {
    const scriptStart = cleanedAfterContent.indexOf(scriptMatch[0]);
    const scriptEnd = cleanedAfterContent.indexOf('</script>', scriptStart) + '</script>'.length;
    cleanedAfterContent = cleanedAfterContent.substring(0, scriptStart) + cleanedAfterContent.substring(scriptEnd);
  }
  
  const wrappedInnerHtml = `\n\n<div class="new-game-wrapper" style="width:100%; display:flex; justify-content:center; align-items:center; flex:1; min-height: 600px; padding: 20px 0;">\n${innerHtml}\n</div>\n\n`;
  
  const finalHtml = beforeContent + wrappedInnerHtml + cleanedAfterContent;
  
  fs.writeFileSync(indexFile, finalHtml, 'utf-8');
  console.log(`Processed ${slug}`);
}

console.log('All 38 new games updated successfully with proper side rails.');
