const fs = require('fs');
const path = require('path');

function getFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(fullPath, exts));
        } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (exts.includes(ext)) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = getFiles('./', ['.html', '.js']);
let modifiedCount = 0;

files.forEach(file => {
    if (file.includes('node_modules') || file.includes('.git') || file.includes('.gemini') || file.includes('rebrand')) return;

    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/50\+/g, '100+');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Updated: ${file}`);
    }
});

console.log(`Rebranding Phase 2 complete. Modified ${modifiedCount} files.`);
