const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[ArcadeNexus Architect]: Initiating Input Architecture Sweep...");

let clickPatches = 0;
let doubleFirePatches = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, `game${i}`, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        // Ensure we only modify within the script boundaries to protect structural coherence
        const scriptStart = '<script>';
        const scriptEnd = '</script>';
        
        const firstScriptStartIdx = content.indexOf(scriptStart);
        const lastScriptEndIdx = content.lastIndexOf(scriptEnd);
        
        if (firstScriptStartIdx !== -1 && lastScriptEndIdx !== -1) {
            const preScript = content.substring(0, firstScriptStartIdx);
            let scriptsBlock = content.substring(firstScriptStartIdx, lastScriptEndIdx + scriptEnd.length);
            const postScript = content.substring(lastScriptEndIdx + scriptEnd.length);

            // 1. REMEDIATE CLICK INTERCEPTION LOOPS
            if (scriptsBlock.includes("canvas.addEventListener('click'") || scriptsBlock.includes('canvas.addEventListener("click"')) {
                scriptsBlock = scriptsBlock.replace(/canvas\.addEventListener\(['"]click['"]/g, "canvas.addEventListener('mousedown'");
                clickPatches++;
            }

            // 2. PURGE REDUNDANT NATIVE TOUCH ATTACHMENTS
            if (scriptsBlock.includes("canvas.addEventListener('touchstart'") || scriptsBlock.includes('canvas.addEventListener("touchstart"')) {
                // Regex to match the entire line containing the native touch listener and remove it
                scriptsBlock = scriptsBlock.replace(/.*canvas\.addEventListener\(['"]touchstart['"].*\n?/g, '');
                scriptsBlock = scriptsBlock.replace(/.*canvas\.addEventListener\(['"]touchmove['"].*\n?/g, '');
                scriptsBlock = scriptsBlock.replace(/.*canvas\.addEventListener\(['"]touchend['"].*\n?/g, '');
                doubleFirePatches++;
            }

            content = preScript + scriptsBlock + postScript;
        }

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
        }
    }
}

console.log(`[PASS]: Click interception loops converted to mousedown instances in ${clickPatches} engine matrices.`);
console.log(`[PASS]: Redundant double-firing touch bounds purged from ${doubleFirePatches} engine matrices.`);
console.log("[Antigravity Final Status]: Input architecture sweep complete. Unified polyfill coherence achieved.");
