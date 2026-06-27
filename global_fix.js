const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file === 'index.html') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Fix __cushionInjected logic to allow the first frame to render
            if (content.includes('typeof window.__cushionInjected === \'undefined\'') && !content.includes('__cushionFrames')) {
                content = content.replace(
                    /let __hasStarted = false;\s*let __realRAF = window\.requestAnimationFrame;\s*window\.requestAnimationFrame = function\(cb\) {\s*if \(!__hasStarted\) {/g,
                    `let __hasStarted = false;\n            let __cushionFrames = 0;\n            let __realRAF = window.requestAnimationFrame;\n            window.requestAnimationFrame = function(cb) {\n                if (!__hasStarted && __cushionFrames++ > 0) {`
                );
                modified = true;
            }

            // Fix duplicate audioCtx declaration if it exists in the same script or across scripts (like Game 18/20)
            // Wait, we already fixed Game 18 and 20 manually, but just in case:
            if (content.includes('let audioCtx;') && content.includes('let audioCtx = null;')) {
                content = content.replace(/let audioCtx;\s*/g, '');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed:', fullPath);
            }
        }
    }
}

processDirectory(gamesDir);
console.log('Global fix complete.');
