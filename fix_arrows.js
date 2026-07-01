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
            
            // Add text-white if missing
            const oldClass = 'flex items-center justify-center text-2xl active:bg-white/20';
            const newClass = 'flex items-center justify-center text-2xl text-white active:bg-white/20';
            
            if (content.includes(oldClass)) {
                content = content.replaceAll(oldClass, newClass);
                updated = true;
            }
            
            // Some might have slightly different classes, let's just do a regex replace
            // looking for <button id="btn... class="..."
            const regex = /(<button id="btn(?:Left|Right|Up|Down|A|B)" class="[^"]*text-2xl)(?!.*text-white)([^"]*)(">\s*&(?:larr|rarr|uarr|darr);|A|B\s*<\/button>)/gi;
            
            content = content.replace(regex, (match, p1, p2, p3) => {
                updated = true;
                return `${p1} text-white${p2}${p3}`;
            });

            if (updated) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated', fullPath);
            }
        }
    }
}

processDir(gamesDir);
console.log('Done.');
