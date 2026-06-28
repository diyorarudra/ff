const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

// Find all HTML files inside games
function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        if (filePath.includes('node_modules') || filePath.includes('.git')) return;
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findHtmlFiles(filePath));
        } else if (filePath.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const htmlFiles = findHtmlFiles(gamesDir);

let modified = 0;
htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const targetString1 = 'class="game-container flex-1 w-full max-w-[500px]';
    const replaceString1 = 'class="game-container flex-1 w-full lg:max-w-[800px] max-w-[500px]';
    
    // Some might not have flex-1 w-full in exact order? Just in case, let's use regex
    const regex = /class="game-container([^"]*)max-w-\[500px\]/g;
    
    if (content.match(regex)) {
        content = content.replace(regex, 'class="game-container$1lg:max-w-[800px] max-w-[500px]');
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    }
});

console.log(`Successfully expanded desktop container width in ${modified} game files.`);
