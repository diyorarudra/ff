const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '..', 'games');

const cssTag = '<link rel="stylesheet" href="/css/game-rewards.css">';
const jsTag = '<script defer src="/js/game-rewards.js"></script>';

function processGame(dir) {
    const indexPath = path.join(dir, 'index.html');
    if (!fs.existsSync(indexPath)) return;

    let content = fs.readFileSync(indexPath, 'utf-8');
    let changed = false;

    // Check for css
    if (!content.includes('/css/game-rewards.css') && !content.includes('game-rewards.css')) {
        // Insert before </head>
        content = content.replace(/<\/head>/i, `  ${cssTag}\n</head>`);
        changed = true;
    }

    // Check for js
    if (!content.includes('/js/game-rewards.js') && !content.includes('game-rewards.js')) {
        // Insert before </head>
        content = content.replace(/<\/head>/i, `  ${jsTag}\n</head>`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(indexPath, content, 'utf-8');
        console.log(`Injected global rewards HUD into ${path.basename(dir)}/index.html`);
    }
}

const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
let gamesChecked = 0;

for (let entry of entries) {
    if (entry.isDirectory()) {
        processGame(path.join(gamesDir, entry.name));
        gamesChecked++;
    }
}

console.log(`Checked ${gamesChecked} games.`);
