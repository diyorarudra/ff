const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findHtmlFiles(filePath));
        } else if (filePath.endsWith('index.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const htmlFiles = findHtmlFiles(gamesDir);

let modified = 0;
htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Find <div class="game-container ...">
    content = content.replace(/(class="game-container[^"]*)"/g, (match, p1) => {
        // Clean existing lg:max-w-* rules to prevent conflicts
        let cleaned = p1.replace(/\s*lg:max-w-[^\s"]+/g, '');
        // Also remove if it literally says max-w-[800px] or max-w-4xl which is 896px
        cleaned = cleaned.replace(/\s*max-w-\[800px\]/g, ' max-w-[500px]');
        cleaned = cleaned.replace(/\s*max-w-4xl/g, ' max-w-[500px]');
        
        // Add lg:max-w-[800px]
        // Ensure there is a space
        if (!cleaned.endsWith(' ')) {
            cleaned += ' ';
        }
        return cleaned + 'lg:max-w-[800px]"';
    });

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    }
});

console.log(`Successfully forced lg:max-w-[800px] on ${modified} game files.`);
