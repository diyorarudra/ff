const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');
const brokenGames = [2, 5, 6, 7, 13, 21, 22, 31, 32, 34, 44, 74];

console.log("[ArcadeNexus Recovery]: Restoring corrupted engine files...");

brokenGames.forEach(id => {
    const fileRel = `games/game${id}/index.html`;
    const fileLoc = path.join(__dirname, fileRel);
    
    // 1. Checkout from HEAD~1 to restore valid syntax
    try {
        execSync(`git checkout HEAD~1 -- ${fileRel}`, { cwd: __dirname });
        console.log(`[PASS]: Restored ${fileRel} from HEAD~1`);
        
        // 2. Remove the global polyfill to prevent double-firing
        let content = fs.readFileSync(fileLoc, 'utf8');
        
        // Regex to match the entire Mobile Touch-to-Mouse Polyfill block
        const polyfillRegex = /\/\/ Mobile Touch-to-Mouse Polyfill[\s\S]*?\}\)\(\);\s*/g;
        if (polyfillRegex.test(content)) {
            content = content.replace(polyfillRegex, '');
            fs.writeFileSync(fileLoc, content, 'utf8');
            console.log(`[PASS]: Stripped polyfill from ${fileRel}`);
        } else {
            console.log(`[WARN]: Polyfill not found in ${fileRel}`);
        }
    } catch (e) {
        console.log(`[ERROR]: Failed to recover ${fileRel} - ${e.message}`);
    }
});

console.log("[ArcadeNexus Final Status]: Recovery pass complete.");
