const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[GamiDay Layout Engineer]: Initiating Audio Button Extraction Protocol...");

const oldBtnRegex = /\s*<button id="audioToggleBtn" style="[^>]*>[🔊🔇]<\/button>/g;
const newBtn = `<button id="audioToggleBtn" style="position: absolute; transform: translateX(340px); top: 20px; padding: 12px; background: #1e293b; color: #38bdf8; border: 2px solid #38bdf8; border-radius: 50%; cursor: pointer; font-size: 20px; line-height: 1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); transition: all 0.2s; z-index: 150;" title="Toggle Audio">🔊</button>`;

let processedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        // 1. Completely strip the old button from its trapped internal hierarchy
        content = content.replace(oldBtnRegex, '');

        // 2. Inject it as a direct sibling immediately preceding the main game wrapper
        if (!content.includes('transform: translateX(340px); top: 20px;')) {
            content = content.replace(/(<div class="game-container)/i, newBtn + '\n$1');
        }

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            processedCount++;
        }
    }
}

console.log('[PASS]: Audio toggle node successfully extracted and relocated outside the card boundaries in ' + processedCount + ' layout matrices.');
console.log("[Antigravity Final Status]: DOM structural extraction successfully committed.");
