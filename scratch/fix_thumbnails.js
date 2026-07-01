const fs = require('fs');
const path = require('path');

// Extract GAMES array from main.js
const mainJsPath = path.join(__dirname, '..', 'js', 'main.js');
const mainJsCode = fs.readFileSync(mainJsPath, 'utf8');

// We'll use a regex to extract the GAMES array definition
const gamesMatch = mainJsCode.match(/const GAMES = (\[[\s\S]*?\]);\s*\/\//);
let games = [];
if (gamesMatch) {
  // It's a JS object, not valid JSON (has single quotes, unquoted keys).
  // We can evaluate it safely in this script context.
  try {
    games = eval(gamesMatch[1]);
  } catch (e) {
    console.error("Failed to parse GAMES:", e);
    process.exit(1);
  }
} else {
  console.error("Could not find GAMES array");
  process.exit(1);
}

// Map of gameId -> {icon, color}
const gameMap = {};
games.forEach(g => {
  gameMap[g.id] = g;
});

const gamesDir = path.join(__dirname, '..', 'games');
const dirs = fs.readdirSync(gamesDir);

let count = 0;
dirs.forEach(dir => {
  const indexPath = path.join(gamesDir, dir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Replace <img> tags that are inside the Related Games section.
    // The easiest way is to match <img> tags with src="/assets/thumbnails/gameX.jpg"
    const imgRegex = /<img[^>]*src="\/assets\/thumbnails\/game(\d+)\.jpg\?v=6"[^>]*>/g;
    
    const newHtml = html.replace(imgRegex, (match, gameId) => {
      const g = gameMap[parseInt(gameId)];
      if (!g) return match; // Fallback if not found
      
      return `<div class="w-full h-28 relative overflow-hidden flex items-center justify-center transition-transform duration-500 hover:scale-110" style="background:${g.color}15"><div class="text-7xl opacity-90 drop-shadow-md select-none">${g.icon}</div></div>`;
    });
    
    if (newHtml !== html) {
      fs.writeFileSync(indexPath, newHtml);
      count++;
    }
  }
});

console.log(`Updated related games thumbnails in ${count} files.`);
