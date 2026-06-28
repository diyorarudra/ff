const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'games', 'game9', 'index.html');
let content = fs.readFileSync(targetFile, 'utf8');

const regex = /\s*<div class="adsense-side-rail hidden lg:flex[\s\S]*?<\/script>\s*<\/div>/;

if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log("[CLEANUP SUCCESS]: Empty desktop box removed for Game 9");
} else {
    console.log("Block not found.");
}
