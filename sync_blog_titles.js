const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const indexHtml = path.join(__dirname, 'index.html');
const blogIndexHtml = path.join(__dirname, 'blog', 'index.html');

function extractMeta(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/);
    
    if (titleMatch && descMatch) {
        let title = titleMatch[1].trim();
        title = title.replace(/\s*(?:-|—)\s*ffliveplay\s*$/, '').trim();
        return {
            title: title,
            description: descMatch[1].trim()
        };
    }
    return null;
}

const postData = {};

// 1. Gather data
const files = fs.readdirSync(blogDir).filter(f => f.startsWith('post') && f.endsWith('.html'));
for (const file of files) {
    const meta = extractMeta(path.join(blogDir, file));
    if (meta) {
        postData[`/blog/${file}`] = meta;
    }
}

// 2. Update blog/index.html
console.log('Total posts found:', Object.keys(postData).length);
if (fs.existsSync(blogIndexHtml)) {
    let blogIndexContent = fs.readFileSync(blogIndexHtml, 'utf8');
    
    // We want to find:
    // <a href="/blog/postX.html" ...>
    //   <span ...>...</span>
    //   <h2 class="...">OLD_TITLE</h2>
    //   <p class="...">OLD_DESC</p>
    // </a>
    
    const regex = /(<a href="(\/blog\/post\d+\.html)"[^>]*>[\s\S]*?<h2[^>]*>)(.*?)(<\/h2>\s*<p[^>]*>)(.*?)(<\/p>)/g;
    
    blogIndexContent = blogIndexContent.replace(regex, (match, prefix, url, oldTitle, mid, oldDesc, suffix) => {
        if (postData[url]) {
            console.log(`[GAMING DATA ALIGNED]: Updated title and description strings for item ${url} (blog/index.html)`);
            return `${prefix}${postData[url].title}${mid}${postData[url].description}${suffix}`;
        }
        return match;
    });
    
    fs.writeFileSync(blogIndexHtml, blogIndexContent, 'utf8');
}

// 3. Update index.html
if (fs.existsSync(indexHtml)) {
    let rootIndexContent = fs.readFileSync(indexHtml, 'utf8');
    
    const regex = /(<a href="(\/blog\/post\d+\.html)"[^>]*>[\s\S]*?<h3[^>]*>)(.*?)(<\/h3>\s*<p[^>]*>)(.*?)(<\/p>)/g;
    
    rootIndexContent = rootIndexContent.replace(regex, (match, prefix, url, oldTitle, mid, oldDesc, suffix) => {
        if (postData[url]) {
            console.log(`[GAMING DATA ALIGNED]: Updated title and description strings for item ${url} (index.html)`);
            return `${prefix}${postData[url].title}${mid}${postData[url].description}${suffix}`;
        }
        return match;
    });
    
    fs.writeFileSync(indexHtml, rootIndexContent, 'utf8');
}

console.log('Done syncing titles and descriptions.');
