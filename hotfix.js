const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game'+i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        
        let modified = false;
        if (content.includes('<script>\\n')) {
            content = content.replace(/<script>\\n/g, '<script>\n');
            modified = true;
        }
        if (content.includes('\\n</script>')) {
            content = content.replace(/\\n<\/script>/g, '\n</script>');
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            console.log("Fixed syntax error in game" + i);
        }
    }
}
console.log("All syntax errors fixed.");
