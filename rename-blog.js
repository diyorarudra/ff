const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const blogDir = 'blog';
const idToSlug = {};
const seenSlugs = new Set();

// 1. Iterate over blog posts and determine slugs
for (let i = 1; i <= 51; i++) {
    const filePath = path.join(blogDir, `post${i}.html`);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    if (!titleMatch) {
        console.error(`No title found for post${i}`);
        continue;
    }

    let title = titleMatch[1];
    // Remove " — ffliveplay" or " | ffliveplay"
    title = title.replace(/\s*[—|-]\s*ffliveplay/i, '').trim();

    let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    if (seenSlugs.has(slug)) {
        slug = baseSlug + '-' + i;
    }
    seenSlugs.add(slug);
    idToSlug[i] = slug;
}

// 2. Rename files using git mv
console.log("Renaming blog post files...");
for (let i = 1; i <= 51; i++) {
    if (!idToSlug[i]) continue;
    const oldPath = path.join(blogDir, `post${i}.html`);
    const newPath = path.join(blogDir, `${idToSlug[i]}.html`);
    if (fs.existsSync(oldPath)) {
        try {
            execSync(`git mv ${oldPath} ${newPath}`);
            console.log(`Renamed post${i}.html -> ${idToSlug[i]}.html`);
        } catch(e) {
            console.error(`Failed to git mv ${oldPath}: ${e.message}`);
        }
    }
}

// 3. Update all links in HTML and XML files
function processFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (fullPath !== '.git' && fullPath !== 'node_modules') {
                processFiles(fullPath);
            }
        } else if (fullPath.endsWith('.html') || fullPath.endsWith('.xml') || fullPath.endsWith('.js') || fullPath.endsWith('.txt')) {
            if (fullPath === 'rename-blog.js') return;

            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Replace absolute paths /blog/postX.html
            content = content.replace(/\/blog\/post(\d+)\.html/g, (match, p1) => {
                let id = parseInt(p1);
                if (idToSlug[id]) return `/blog/${idToSlug[id]}.html`;
                return match;
            });
            // Replace relative paths blog/postX.html
            content = content.replace(/(["'])blog\/post(\d+)\.html/g, (match, quote, p2) => {
                let id = parseInt(p2);
                if (idToSlug[id]) return `${quote}blog/${idToSlug[id]}.html`;
                return match;
            });

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated links in ${fullPath}`);
            }
        }
    });
}
console.log("Processing files for link updates...");
processFiles('.');
console.log("Done!");
