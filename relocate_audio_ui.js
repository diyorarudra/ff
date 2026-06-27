const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[GamiDay UI Engineer]: Initiating Audio UI Relocation Protocol...");

const oldButtonRegex = /<button id="audioToggleBtn"[^>]*>🔊 Music: ON<\/button>\s*/g;
const newButtonTemplate = `<button id="audioToggleBtn" style="position: relative; display: block; margin: 15px auto 0 auto; width: fit-content; padding: 10px 16px; background: #1e293b; color: #38bdf8; border: 1px solid #38bdf8; border-radius: 50%; cursor: pointer; font-size: 18px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: all 0.2s;">🔊</button>`;

let processedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        // 1. Remove the old absolute button
        content = content.replace(oldButtonRegex, '');

        // 2. Inject the new relative button just before the SEO block
        if (!content.includes('style="position: relative; display: block; margin: 15px auto 0 auto;')) {
            const seoBlockRegex = /(<div class="adsense-seo-block")/i;
            if (seoBlockRegex.test(content)) {
                content = content.replace(seoBlockRegex, newButtonTemplate + '\n      $1');
            } else {
                content = content.replace(/(<\/canvas>)/i, '$1\n      ' + newButtonTemplate);
            }
        }

        // 3. Update the JavaScript strings to pure emojis using string replacement
        const oldJsString = "audioBtn.textContent = isMuted ? '🔇 Music: OFF' : '🔊 Music: ON';";
        const newJsString = "audioBtn.textContent = isMuted ? '🔇' : '🔊';";
        
        // Split the content and replace to maintain string safety
        content = content.split(oldJsString).join(newJsString);

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            processedCount++;
        }
    }
}

console.log('[PASS]: Audio UI controls successfully stripped of text, converted to emojis, and relocated in ' + processedCount + ' layout matrices.');
console.log("[Antigravity Final Status]: Interface rendering and collision clearance completed.");
