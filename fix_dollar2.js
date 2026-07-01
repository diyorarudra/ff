const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processDir(fullPath);
        } else if (entry.isFile() && entry.name === 'index.html') {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = false;
            
            // Check for $2 before </html>
            if (content.includes('$2\n</html>')) {
                content = content.replace('$2\n</html>', '</html>');
                updated = true;
            } else if (content.includes('$2\r\n</html>')) {
                content = content.replace('$2\r\n</html>', '</html>');
                updated = true;
            } else if (content.includes('$2')) {
                // More robust check
                const regex = /\$2\s*<\/html>/g;
                if (regex.test(content)) {
                    content = content.replace(regex, '</html>');
                    updated = true;
                }
            }

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Removed $2 from', fullPath);
            }
        }
    }
}

processDir(gamesDir);
console.log('Done.');
