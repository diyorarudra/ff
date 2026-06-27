const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, 'games');

let needsMousedownPatch = []; // uses click on canvas
let needsDoubleFirePatch = []; // uses both mousedown and touchstart natively on canvas

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, `game${i}`, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        
        let hasCanvasClick = content.includes("canvas.addEventListener('click'") || content.includes('canvas.addEventListener("click"');
        let hasCanvasMousedown = content.includes("canvas.addEventListener('mousedown'") || content.includes('canvas.addEventListener("mousedown"');
        let hasCanvasTouchstart = content.includes("canvas.addEventListener('touchstart'") || content.includes('canvas.addEventListener("touchstart"');
        
        if (hasCanvasClick && !hasCanvasTouchstart && !hasCanvasMousedown) {
            needsMousedownPatch.push(i);
        } else if (hasCanvasClick && hasCanvasMousedown) {
            // Might need attention
            needsMousedownPatch.push(i);
        }

        if (hasCanvasMousedown && hasCanvasTouchstart) {
            // Has both, likely fires twice due to polyfill
            needsDoubleFirePatch.push(i);
        }
    }
}

console.log("Games relying on click (need mousedown conversion):", needsMousedownPatch.join(', '));
console.log("Games with native touch AND mousedown (double firing):", needsDoubleFirePatch.join(', '));
