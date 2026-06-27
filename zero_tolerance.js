const fs = require('fs');
const path = require('path');

const dirs = ['.', './games', './blog', './compliance', './css', './js'];
let modifiedFiles = 0;
let totalFiles = 0;

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') walkDir(fullPath);
      continue;
    }
    if (!file.match(/\.(html|css|js)$/)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    if (file.endsWith('.html')) {
        content = content.replace(/<meta\s+charset=["']UTF-8["']\s*\/?>/gi, '');
        content = content.replace(/(<head>)/i, '$1\n  <meta charset="UTF-8">');
    }

    // Target specifically identified artifacts
    content = content.replace(//g, '');
    content = content.replace(//g, '');
    content = content.replace(//g, '');
    content = content.replace(//g, '');
    
    content = content.replace(/ž‾\s*Our Mission/g, 'Our Mission');
    content = content.replace(/•¹\s*50\+\s*Handcrafted Browser Games/g, '100+ Handcrafted Browser Games');
    content = content.replace(/”\s*In-Depth Blog & Resources/g, 'In-Depth Blog & Resources');
    
    content = content.replace(/Delete/g, 'Delete');
    // Also catch the literal unicode for backspace if they meant that
    content = content.replace(/Delete/g, 'Delete');

    // Mangled Dashes
    content = content.replace(/&mdash;/g, '&mdash;');
    content = content.replace(/&mdash;(?!œ| )/g, '&mdash;'); // Replaces â€ but not if it's â€œ or â€  (smart quotes)

    // Fix "NO GLYPH" missing icon blocks next to SVGs
    // Strips any non-ASCII characters immediately adjacent to an <svg> tag
    content = content.replace(/([^\x00-\x7F]+)\s*(<svg[^>]*>)/gi, '$2');
    content = content.replace(/(<\/svg>)\s*([^\x00-\x7F]+)(?=\s*<)/gi, '$1');

    if (content !== originalContent) {
      totalFiles++;
      fs.writeFileSync(fullPath, content, 'utf8');
      modifiedFiles++;
    }
  }
}

dirs.forEach(walkDir);
console.log(`Processed ${totalFiles} modified files. Total modified: ${modifiedFiles}`);
