const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

let count = 0;
for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(targetDir, 'game'+i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');

        // The bug is `<meta charset="UTF-8">n  ` or similar literal 'n' right after a tag due to escaped \n
        if (text.includes('<meta charset="UTF-8">n')) {
            text = text.replace(/<meta charset="UTF-8">n/g, '<meta charset="UTF-8">\n');
            fs.writeFileSync(fileLoc, text, 'utf8');
            count++;
        }
        else if (text.includes('n  \n  \n  ')) {
            // Just in case it's something else
            text = text.replace(/>n\s+/g, '>\n');
            fs.writeFileSync(fileLoc, text, 'utf8');
            count++;
        }
    }
}
console.log('Removed stray "n" from ' + count + ' games.');
