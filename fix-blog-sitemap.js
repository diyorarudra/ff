const fs = require('fs');
const { execSync } = require('child_process');

// Get git diff to find rename mappings
const diffOutput = execSync('git diff --name-status HEAD~1').toString();
const lines = diffOutput.split('\n');
const idToSlug = {};

lines.forEach(line => {
    // format: R100    blog/post1.html    blog/the-evolution-of.html
    if (line.startsWith('R') && line.includes('blog/post')) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
            const oldPath = parts[1];
            const newPath = parts[2];
            const match = oldPath.match(/blog\/post(\d+)\.html/);
            if (match) {
                const id = match[1];
                const newSlug = newPath.replace('blog/', '').replace('.html', '');
                idToSlug[id] = newSlug;
            }
        }
    }
});

let sitemap = fs.readFileSync('sitemap.xml', 'utf8');

sitemap = sitemap.replace(/\/blog\/post(\d+)</g, (match, p1) => {
    let id = p1;
    if (idToSlug[id]) return `/blog/${idToSlug[id]}<`;
    return match;
});

fs.writeFileSync('sitemap.xml', sitemap);
console.log('Fixed blog entries in sitemap.xml');
