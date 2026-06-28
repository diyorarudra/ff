const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

function findHtmlFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        if (filePath.includes('.git') || filePath.includes('node_modules')) return;
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findHtmlFiles(filePath));
        } else if (filePath.endsWith('index.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const htmlFiles = findHtmlFiles(gamesDir);
let modified = 0;

const leftRailHtml = `
  <div class="adsense-side-rail left-rail hidden lg:flex bg-nexus-elevated border border-white/5 rounded-xl items-center justify-center text-gray-500 text-xs tracking-widest uppercase relative overflow-hidden" style="min-width: 160px; min-height: 600px; margin-right: 1rem; position: sticky; top: 100px;">
     <ins class="adsbygoogle"
          style="display:inline-block;width:160px;height:600px"
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="3333333333"></ins>
     <script>try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.warn('AdSense payload dropped securely:', e); }</script>
  </div>
`;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // The insertion point: just after `<div class="flex flex-col lg:flex-row justify-center items-start w-full max-w-7xl mx-auto px-4">`
    const targetTagRegex = /(<div class="flex flex-col lg:flex-row justify-center items-start w-full max-w-7xl mx-auto px-4">)/;

    // Prevent double injection if the script is run multiple times
    if (content.match(targetTagRegex) && !content.includes('class="adsense-side-rail left-rail')) {
        content = content.replace(targetTagRegex, '$1\n' + leftRailHtml);
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
    }
});

console.log(`Successfully injected left advertisement rail on ${modified} game files.`);
