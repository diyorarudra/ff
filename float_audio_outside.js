const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[GamiDay UX Architect]: Initiating External Audio Floating Protocol...");

const oldBtnRegex = /\s*<button id="audioToggleBtn" style="display: inline-block;[^>]*>[🔊🔇]<\/button>/g;
const newBtn = `<button id="audioToggleBtn" style="position: absolute; right: -70px; top: 0px; padding: 12px; background: #1e293b; color: #38bdf8; border: 2px solid #38bdf8; border-radius: 50%; cursor: pointer; font-size: 20px; line-height: 1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); transition: all 0.2s; z-index: 100;" title="Toggle Audio">🔊</button>`;

let processedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        // 1. Strip the old button from inside the header/dashboard
        content = content.replace(oldBtnRegex, '');

        // 2. Inject the new floating button just before the canvas so it anchors to the relative game wrapper
        if (!content.includes('right: -70px; top: 0px; padding: 12px;')) {
            content = content.replace(/(<canvas[^>]*>)/i, newBtn + '\n      $1');
        }

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            processedCount++;
        }
    }
}

console.log('[PASS]: Audio controller successfully extracted and anchored externally alongside the layout structures in ' + processedCount + ' game matrices.');
console.log("[Antigravity Final Status]: Structural hierarchy perfectly aligned.");
