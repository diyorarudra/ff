const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

let count = 0;
for (let i = 51; i <= 100; i++) {
    const fileLoc = path.join(targetDir, 'game'+i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');

        // Regex to match the adsense-seo-block div and its contents up to the closing div
        const regex = /<div class="adsense-seo-block[\s\S]*?<\/div>/g;
        
        if (regex.test(text)) {
            text = text.replace(regex, '');
            fs.writeFileSync(fileLoc, text, 'utf8');
            count++;
        }
    }
}
console.log('Removed SEO block from ' + count + ' games.');
