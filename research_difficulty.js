const fs = require('fs');
const path = require('path');

const files = ['upgrade_batch_1.js', 'upgrade_batch_2.js', 'upgrade_batch_3.js', 'upgrade_batch_4.js', 'upgrade_6_games.js'];
let out = '';

files.forEach(f => {
    let p = path.join(__dirname, f);
    if(fs.existsSync(p)) {
        let lines = fs.readFileSync(p, 'utf8').split('\n');
        out += `\n=== ${f} ===\n`;
        lines.forEach(l => {
            if(l.includes('let speed') || l.includes('speed =') || l.includes('vx =') || l.includes('setInterval') || l.includes('timer =')) {
                out += l.trim() + '\n';
            }
        });
    }
});
fs.writeFileSync(path.join(__dirname, 'diff_research.txt'), out);
console.log("Research complete.");
