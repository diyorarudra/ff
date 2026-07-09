const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '..', 'games');
const games = fs.readdirSync(gamesDir)
    .filter(d => fs.statSync(path.join(gamesDir, d)).isDirectory())
    .map(d => path.join(gamesDir, d, 'index.html'))
    .filter(f => fs.existsSync(f));

for (const file of games) {
    let html = fs.readFileSync(file, 'utf8');
    
    // Only apply to the 38 new games. The new games have `<div class="new-game-wrapper"`
    if (!html.includes('class="new-game-wrapper"')) {
        continue;
    }

    let modified = false;

    const startIdx = html.indexOf('<button id="audioToggleBtn" style="position: absolute; left: calc(50% + 250px); top: 10px;');
    if (startIdx !== -1) {
        const endIdx = html.indexOf('</button>', startIdx) + 9;
        html = html.substring(0, startIdx) + html.substring(endIdx);
        
        // 2. Insert into navbar gap-4
        const newBtn = `<button id="audioToggleBtn" style="width: 38px; height: 38px; padding: 0; display: flex; align-items: center; justify-content: center; background: #1e293b; color: #38bdf8; border: 1px solid #38bdf8; border-radius: 50%; cursor: pointer; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); transition: all 0.2s; z-index: 200; flex-shrink: 0;" title="Toggle Audio">🔊</button>`;
        
        html = html.replace('<div class="flex items-center gap-4">', '<div class="flex items-center gap-4">\n      ' + newBtn);
        modified = true;
    }

    // 3. Update the play click sound logic
    const oldLogicRegex = /if\s*\(\s*e\.target\.tagName === 'CANVAS' \|\| e\.target\.classList\.contains\('cell'\)\s*\)\s*playClickSound\(\);/g;
    const newLogic = "if(e.target.tagName === 'CANVAS' || e.target.classList.contains('cell') || e.target.closest('button') || e.target.closest('.btn') || e.target.closest('.key') || e.target.closest('.tube') || e.target.closest('.option-btn') || e.target.closest('.color-btn')) playClickSound();";
    
    if (oldLogicRegex.test(html)) {
        html = html.replace(oldLogicRegex, newLogic);
        modified = true;
    }

    // 4. Remove the @media query for audioToggleBtn
    const mediaQueryRegex = /@media[^{]+\{[^}]*#audioToggleBtn[^}]+\}[^}]+\}/is;
    if (mediaQueryRegex.test(html)) {
        html = html.replace(mediaQueryRegex, '');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, html);
        console.log(`Updated ${file}`);
    }
}
console.log('Done modifying new games.');
