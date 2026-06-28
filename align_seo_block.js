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

    // Match the SEO block
    const seoRegex = /(<div class="adsense-seo-block"[\s\S]*?<\/div>\s*<\/div>|<div class="adsense-seo-block"[\s\S]*?<\/div>)/;
    // Wait, the SEO block might just be one div deep. Let's look at it:
    /*
      <div class="adsense-seo-block" style="...">
        <h3 ...>...</h3>
        <p>...</p>
      </div>
    */
    // We can extract it by finding `<div class="adsense-seo-block"` until the next `</div>\n` or `</div>\r\n` or `</div>\s*<div class="max-w-\[820px\]`.
    
    // Better yet, just match the div accurately.
    const extractRegex = /<div class="adsense-seo-block"[^>]*>[\s\S]*?<\/div>/;
    const match = content.match(extractRegex);
    
    if (match) {
        const seoBlock = match[0];
        // Remove it from current position
        content = content.replace(seoBlock, '');
        
        // Find the insertion point: the closing </div> right before <div class="adsense-side-rail
        // Note: whitespace might be newlines, spaces, etc.
        const insertRegex = /(<\/div>\s*<div class="adsense-side-rail)/;
        
        if (content.match(insertRegex)) {
            // Remove any inline margin/max-width from SEO block since it's now handled by the parent
            // Actually it's fine to leave it, margin: 30px auto will just add spacing.
            // But let's fix its inline width to 100% just in case it overflows mobile.
            let modifiedSeoBlock = seoBlock.replace(/max-width:\s*800px;/, 'width: 100%;');
            
            content = content.replace(insertRegex, '\n' + modifiedSeoBlock + '\n$1');
        }
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    }
});

console.log(`Successfully aligned SEO block on ${modified} game files.`);
