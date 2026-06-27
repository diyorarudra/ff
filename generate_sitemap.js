const fs = require('fs');
const path = require('path');

const domain = 'https://www.gamiday.com';
const today = new Date().toISOString().split('T')[0];

function getFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.gemini')) {
                results = results.concat(getFiles(fullPath, exts));
            }
        } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (exts.includes(ext)) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const htmlFiles = getFiles(__dirname, ['.html']);

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

htmlFiles.forEach(file => {
    let relativePath = path.relative(__dirname, file).replace(/\\/g, '/');
    
    let priority = '0.5';
    if (relativePath === 'index.html') {
        priority = '1.0';
        relativePath = ''; // Root URL
    } else if (relativePath.startsWith('games/')) {
        priority = '0.8';
    } else if (relativePath.startsWith('blog/')) {
        priority = '0.7';
    } else if (relativePath.includes('privacy') || relativePath.includes('terms') || relativePath.includes('compliance')) {
        priority = '0.5';
    }

    const url = relativePath === '' ? domain + '/' : domain + '/' + relativePath;

    sitemap += `  <url>\n`;
    sitemap += `    <loc>${url}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <priority>${priority}</priority>\n`;
    sitemap += `  </url>\n`;
});

sitemap += `</urlset>`;

// Ensure UTF-8 without BOM by writing as a standard buffer string (Node.js default is UTF-8 w/o BOM)
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap, 'utf8');

console.log(`Successfully generated sitemap.xml with ${htmlFiles.length} URLs logged.`);
