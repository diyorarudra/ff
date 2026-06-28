const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        if (filePath.includes('.git') || filePath.includes('node_modules')) return;
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
    let original = content;

    // Match the bottom ad block
    const adRegex = /(<div class="max-w-\[820px\][^>]*>[\s\S]*?<div class="ad-slot ad-slot-in-article[^>]*>[\s\S]*?<\/div>\s*<\/div>)/;
    const match = content.match(adRegex);
    
    if (match) {
        let adBlock = match[0];
        
        // Remove it from current position
        content = content.replace(adBlock, '');
        
        // Remove the redundant max-width and padding since it will inherit from game-container
        adBlock = adBlock.replace(/class="max-w-\[820px\] mx-auto w-full px-4 mb-8 mt-auto"/, 'class="w-full mb-8 mt-4"');
        
        // Find the insertion point: the closing </div> right before <div class="adsense-side-rail
        const insertRegex = /(<\/div>\s*<div class="adsense-side-rail)/;
        
        if (content.match(insertRegex)) {
            content = content.replace(insertRegex, '\n' + adBlock + '\n$1');
        }
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    }
});

console.log(`Successfully aligned AdSense block on ${modified} game files.`);
