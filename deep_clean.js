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
    if (!file.match(/\.(html|css|js|md)$/)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    if (file.endsWith('.html')) {
        content = content.replace(/<meta\s+charset=["']UTF-8["']\s*\/?>/gi, '');
        content = content.replace(/(<head>)/i, '$1\n  <meta charset="UTF-8">');
    }

    // Known typographical mappings
    content = content.replace(/&mdash;/g, '&mdash;');
    content = content.replace(/&ndash;/g, '&ndash;');
    content = content.replace(/'/g, "'");
    content = content.replace(/'/g, "'");
    content = content.replace(/"/g, '"');
    content = content.replace(/"/g, '"');
    content = content.replace(/&middot;/g, '&middot;');
    content = content.replace(/\s/g, ' ');
    content = content.replace(/\xa0/g, ' ');

    // Deep clean of any remaining known broken multi-byte headers/prefixes
    content = content.replace(/[]/g, '');
    
    // Replacement char stripping
    content = content.replace(/\uFFFD/g, '');

    if (content !== originalContent) {
      totalFiles++;
      fs.writeFileSync(fullPath, content, 'utf8'); // UTF-8 without BOM natively
      modifiedFiles++;
    }
  }
}

dirs.forEach(walkDir);
console.log(`Total modified files: ${modifiedFiles}`);
