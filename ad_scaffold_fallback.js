const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');
const failedGames = [13, 14, 30, 50];
let modifiedCount = 0;

failedGames.forEach(i => {
    const filePath = path.join(gamesDir, `game${i}.html`);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Ensure we don't apply it twice
        if (content.includes('class="adsense-side-rail"')) {
            return;
        }

        const regex = /(<div class="game-container[\s\S]*?)(\s*<\/div>\s*)(<script>)/;
        const replacement = `<div class="flex flex-col lg:flex-row justify-center items-start w-full max-w-7xl mx-auto px-4">\n$1$2  <div class="adsense-side-rail hidden lg:flex bg-nexus-elevated border border-white/5 rounded-xl items-center justify-center text-gray-500 text-xs tracking-widest uppercase relative overflow-hidden" style="min-width: 160px; min-height: 600px; margin-left: 1rem; position: sticky; top: 100px;">\n    <span class="opacity-50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap">Advertisement</span>\n  </div>\n</div>\n\n$3`;
        
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedCount++;
        } else {
            console.log(`Still failed to match regex in game${i}.html`);
        }
    }
});

console.log(`Successfully injected ad-unit layout shell into ${modifiedCount} remaining game files.`);
