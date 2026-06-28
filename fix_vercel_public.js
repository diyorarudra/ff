const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const assetsDir = path.join(rootDir, 'assets');

// Rename public to assets to prevent Vercel from hijacking the output directory
if (fs.existsSync(publicDir)) {
    fs.renameSync(publicDir, assetsDir);
}

// Find all HTML files
function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        if (filePath.includes('node_modules') || filePath.includes('.git')) return;
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findHtmlFiles(filePath));
        } else if (filePath.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const htmlFiles = findHtmlFiles(rootDir);

let modified = 0;
htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const oldLink = '<link rel="icon" type="image/png" href="/public/favicon.png">';
    const newLink = '<link rel="icon" type="image/png" href="/assets/favicon.png">';
    
    if (content.includes(oldLink)) {
        content = content.replace(oldLink, newLink);
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    } else if (content.includes('/public/favicon.png')) {
        content = content.replace(/\/public\/favicon\.png/g, '/assets/favicon.png');
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    }
});

console.log(`Successfully renamed public to assets and updated ${modified} HTML files to fix Vercel 404.`);
