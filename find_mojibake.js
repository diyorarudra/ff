const fs = require('fs');
const path = require('path');

const dirs = ['.', './games', './blog', './compliance', './css', './js'];

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
    // find any characters above U+007F except common safe ones (e.g., standard curly quotes, dashes, etc.)
    // Let's just find exactly what mojibake remains like , , , , \uFFFD
    const matches = content.match(/[]/g);
    if (matches && matches.length > 0) {
      console.log(`Found ${matches.length} mojibake chars in ${fullPath}`);
    }
  }
}

dirs.forEach(walkDir);
