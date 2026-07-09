const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            // skip node_modules and .git
            if (f !== 'node_modules' && f !== '.git') {
                walkDir(dirPath, callback);
            }
        } else {
            callback(path.join(dir, f));
        }
    });
}

walkDir('.', function(filePath) {
    if (filePath.endsWith('.html')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace CDN script with absolute css link
        if (content.includes('https://cdn.tailwindcss.com')) {
            content = content.replace(/<script[^>]*src="https:\/\/cdn\.tailwindcss\.com"[^>]*><\/script>/gi, '<link rel="stylesheet" href="/css/tailwind.css">');
            modified = true;
        }

        // Remove tailwind.config inline script block or just the config object
        // Sometimes it's inside a script block that has other things, so we should just remove the tailwind.config assignment
        const tailwindConfigRegex = /tailwind\.config\s*=\s*\{[\s\S]*?colors:\s*\{[^}]*\}\s*\}\s*\}\s*\}/g;
        
        if (tailwindConfigRegex.test(content)) {
            content = content.replace(tailwindConfigRegex, '');
            modified = true;
        }
        
        // Also clean up any empty script tags created by this
        content = content.replace(/<script>\s*<\/script>/g, '');

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Processed:', filePath);
        }
    }
});
