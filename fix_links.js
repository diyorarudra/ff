const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('.git') && !file.includes('node_modules')) {
                results = results.concat(walkDir(file));
            }
        } else {
            if (file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const htmlFiles = walkDir('e:\\zip\\ffgame');
let updatedCount = 0;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // The target class is exactly what we saw: `class="underline decoration-white/40 hover:decoration-white"`
    // We will inject `text-white hover:text-white ` at the beginning of the class string.
    
    if (content.includes('class="underline decoration-white/40 hover:decoration-white"')) {
        content = content.replaceAll('class="underline decoration-white/40 hover:decoration-white"', 'class="text-white hover:text-white underline decoration-white/40 hover:decoration-white"');
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
    }
});

console.log(`Updated ${updatedCount} files.`);
