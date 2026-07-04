const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1. Extract GAMES from js/main.js
const mainJsContent = fs.readFileSync('js/main.js', 'utf8');
const gamesMatch = mainJsContent.match(/const GAMES = (\[[\s\S]*?\]);\s*const CATEGORIES/);
let GAMES;
try {
    GAMES = eval(gamesMatch[1]);
} catch(e) {
    console.error("Failed to eval GAMES");
    process.exit(1);
}

// 2. Generate slugs
const idToSlug = {};
const seenSlugs = new Set();
GAMES.forEach(game => {
    let baseSlug = game.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    if (seenSlugs.has(slug)) {
        slug = baseSlug + '-' + game.id;
    }
    seenSlugs.add(slug);
    idToSlug[game.id] = slug;
    game.slug = slug;
});

// 3. Rename folders
console.log("Renaming folders...");
GAMES.forEach(game => {
    const oldPath = path.join('games', `game${game.id}`);
    const newPath = path.join('games', game.slug);
    if (fs.existsSync(oldPath)) {
        try {
            execSync(`git mv ${oldPath} ${newPath}`);
            console.log(`Renamed game${game.id} -> ${game.slug}`);
        } catch(e) {
            console.error(`Failed to git mv ${oldPath}: ${e.message}`);
        }
    } else {
        console.log(`WARNING: ${oldPath} does not exist`);
    }
});

// 4. Update js/main.js
let newMainJs = mainJsContent.replace(/games\/game\$\{game\.id\}\/index\.html/g, 'games/${game.slug}/index.html');
const updatedGamesString = '[\n' + GAMES.map(g => `  { id: ${g.id}, title: '${g.title.replace(/'/g, "\\'")}', category: '${g.category}', desc: '${g.desc.replace(/'/g, "\\'")}', icon: '${g.icon}', color: '${g.color}', slug: '${g.slug}' }`).join(',\n') + '\n]';
newMainJs = newMainJs.replace(/const GAMES = \[[\s\S]*?\];/, `const GAMES = ${updatedGamesString};`);
fs.writeFileSync('js/main.js', newMainJs);
console.log("Updated js/main.js");

// 5. Replace all occurrences in HTML and XML files
function processFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (fullPath !== '.git' && fullPath !== 'node_modules') {
                processFiles(fullPath);
            }
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.xml') || fullPath.endsWith('.js') || fullPath.endsWith('.txt')) {
            if (fullPath.replace(/\\/g, '/') === 'js/main.js') return; // already processed
            if (fullPath === 'rename.js') return;

            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Replace absolute paths /games/gameX/
            content = content.replace(/\/games\/game(\d+)\//g, (match, p1) => {
                let id = parseInt(p1);
                if (idToSlug[id]) return `/games/${idToSlug[id]}/`;
                return match;
            });
            // Replace relative paths games/gameX/
            content = content.replace(/(["'])games\/game(\d+)\//g, (match, quote, p2) => {
                let id = parseInt(p2);
                if (idToSlug[id]) return `${quote}games/${idToSlug[id]}/`;
                return match;
            });

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated links in ${fullPath}`);
            }
        }
    });
}
console.log("Processing files for link updates...");
processFiles('.');
console.log("Done!");
