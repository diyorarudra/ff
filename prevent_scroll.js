const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[GamiDay Input Engineer]: Initiating Scroll Prevention Sweep...");

const preventScrollScript = `
<script>
// Prevent Spacebar and Arrow keys from scrolling the page during gameplay
window.addEventListener('keydown', function(e) {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && e.target.tagName !== 'INPUT') {
        e.preventDefault();
    }
}, { passive: false });
</script>
`;

let processedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        if (!content.includes('Prevent Spacebar and Arrow keys from scrolling')) {
            content = content.replace(/(<\/body>)/i, preventScrollScript + '$1');
        }

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            processedCount++;
        }
    }
}

console.log('[PASS]: Spacebar and Arrow key scroll prevention injected into ' + processedCount + ' game matrices.');
