const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        if (filePath.includes('.git') || filePath.includes('node_modules')) return;
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

const vercelScript = `
  <!-- Vercel Web Analytics -->
  <script>
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  </script>
  <script defer src="/_vercel/insights/script.js"></script>
`;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    if (!content.includes('/_vercel/insights/script.js')) {
        content = content.replace(/<\/head>/i, vercelScript + '</head>');
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    }
});

console.log(`Successfully injected Vercel Analytics into ${modified} HTML files.`);
