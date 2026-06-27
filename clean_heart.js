const fs = require('fs');
const path = require('path');

const dirs = ['.', './games', './blog', './compliance'];
let modifiedFiles = 0;

const svgHeart = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 4px;vertical-align:middle;color:#ef4444"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) continue;
    if (!file.endsWith('.html') && !file.endsWith('.js') && !file.endsWith('.css')) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    content = content.replace(/Built with [^a-zA-Z0-9<>]* using HTML5/g, `Built with ${svgHeart} using HTML5`);

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      modifiedFiles++;
    }
  }
}

dirs.forEach(walkDir);
console.log(`Total modified files: ${modifiedFiles}`);
