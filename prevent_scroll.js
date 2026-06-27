const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');
const preventScrollCode = `\nwindow.addEventListener("keydown", function(e) { if([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault(); });\n`;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game'+i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        
        // Prevent double injection
        if (!content.includes('preventDefault()')) {
            const scriptEnd = '</script>';
            const endIdx = content.lastIndexOf(scriptEnd);
            
            if (endIdx !== -1) {
                const newContent = content.substring(0, endIdx) + preventScrollCode + content.substring(endIdx);
                fs.writeFileSync(fileLoc, newContent, 'utf8');
                console.log("Injected scroll lock into game" + i);
            }
        }
    }
}
console.log("Global scroll lock applied to all games.");
