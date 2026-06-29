const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === '.git' || file === 'node_modules') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceInDir(fullPath);
        } else {
            if (/\.(html|js|css|json|txt|xml|md)$/.test(file)) {
                let content = fs.readFileSync(fullPath, 'utf8');
                if (/ffliveplay/i.test(content)) {
                    content = content.replace(/ffliveplay/gi, 'ffliveplay');
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log(`Replaced in ${fullPath}`);
                }
            }
        }
    }
}

replaceInDir('c:/Users/taran/OneDrive/Desktop/ffgame');
