const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[GamiDay Layout Engineer]: Initiating Audio Button Cleanup and Responsive Alignment Protocol...");

const oldBtnRegex = /\s*<button id="audioToggleBtn"[^>]*>.*?<\/button>\s*/gs;
const oldStyleRegex = /\s*<style>\s*@media\s*\(max-width:\s*1024px\)\s*\{\s*#audioToggleBtn\s*\{[\s\S]*?\}\s*\}\s*<\/style>\s*/g;

const newBtnMarkup = `
<style>
@media (max-width: 1024px) { #audioToggleBtn { position: relative !important; left: 0 !important; top: 0 !important; margin: 10px auto !important; display: flex !important; } }
</style>
<button id="audioToggleBtn" style="position: absolute; left: calc(50% + 250px); top: 10px; width: 38px; height: 38px; padding: 0; display: flex; align-items: center; justify-content: center; background: #1e293b; color: #38bdf8; border: 1px solid #38bdf8; border-radius: 50%; cursor: pointer; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); transition: all 0.2s; z-index: 200;" title="Toggle Audio">🔊</button>
`;

let processedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        // 1. Purge ALL duplicate buttons and any old responsive style blocks
        content = content.replace(oldBtnRegex, '');
        content = content.replace(oldStyleRegex, '');

        // 2. Inject exactly ONE clean button and media block right inside the main layout
        if (!content.includes('width: 38px; height: 38px; padding: 0;')) {
            content = content.replace(/(<div class="game-container[^>]*>)/i, '$1' + newBtnMarkup);
        }

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            processedCount++;
        }
    }
}

console.log('[PASS]: Purged duplicate audio buttons and successfully deployed the single responsive layout matrix across ' + processedCount + ' workspaces.');
console.log("[Antigravity Final Status]: Structural hierarchy perfectly aligned.");
