const fs = require('fs');
const path = require('path');

const dirs = ['.', './compliance'];
function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      continue;
    }
    if (!file.match(/\.(html)$/)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    // Just dump lines that have interesting stuff to see how they look
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.match(/(Our Mission|50\+ Handcrafted|In-Depth Blog|Bug Reports|Partnerships|Innovation|Accessibility|Quality|Community)/i)) {
            console.log(`${fullPath}:${i+1}: ${line.trim()}`);
        }
    });
  }
}

dirs.forEach(walkDir);
