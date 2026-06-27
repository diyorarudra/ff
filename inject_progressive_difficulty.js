const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

let modifiedCount = 0;

for (let i = 51; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game'+i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        
        const scriptStart = '<script>';
        const scriptEnd = '</script>';
        const startIdx = content.lastIndexOf(scriptStart);
        const endIdx = content.lastIndexOf(scriptEnd);
        
        if (startIdx !== -1 && endIdx !== -1) {
            let scriptLogic = content.substring(startIdx + scriptStart.length, endIdx);
            let originalLogic = scriptLogic;

            // 1. Dynamic Speed Increments (e.g., pos += 4 + score/50)
            scriptLogic = scriptLogic.replace(/([a-zA-Z0-9_\[\]\.]+)\s*\+=\s*([\d\.]+)\s*\+\s*score\s*\/\s*\d+/g, (match, p1, p2) => {
                let base = parseFloat(p2) * 0.7;
                return `${p1} += ${base.toFixed(2)} * (1 + Math.log1p(score) * 0.15)`;
            });

            // 2. Fixed Speed Assignments (e.g., speed=10;)
            scriptLogic = scriptLogic.replace(/\bspeed\s*=\s*([\d\.]+)\s*;/g, (match, p1) => {
                let base = parseFloat(p1) * 0.7;
                return `speed = ${base.toFixed(2)};`;
            });
            
            // 3. Random Speed Assignments (e.g., speed=2+Math.random()*8;)
            scriptLogic = scriptLogic.replace(/\bspeed\s*=\s*([\d\.]+)\s*\+\s*Math\.random\(\)\s*\*\s*([\d\.]+)/g, (match, p1, p2) => {
                let base = parseFloat(p1) * 0.7;
                let range = parseFloat(p2) * 0.7;
                return `speed = ${base.toFixed(2)} + Math.random() * ${range.toFixed(2)}`;
            });

            // 4. Spawn Probabilities (e.g., Math.random()<0.04)
            scriptLogic = scriptLogic.replace(/Math\.random\(\)\s*<\s*(0\.0[0-9]+)/g, (match, p1) => {
                // Ensure it doesn't already have the multiplier
                if(match.includes('* (1 + score')) return match;
                return `Math.random() < ${parseFloat(p1)} * (1 + score * 0.02)`;
            });

            // 5. Gravity reductions
            scriptLogic = scriptLogic.replace(/gravity\s*=\s*([\d\.]+)/g, (match, p1) => {
                let base = parseFloat(p1) * 0.7;
                return `gravity = ${base.toFixed(3)}`;
            });
            scriptLogic = scriptLogic.replace(/vy\s*\+=\s*0\.4/g, "vy += 0.28");

            // 6. Jump Force reductions
            scriptLogic = scriptLogic.replace(/jumpForce\s*=\s*-([\d\.]+)/g, (match, p1) => {
                let base = parseFloat(p1) * 0.7;
                return `jumpForce = -${base.toFixed(2)}`;
            });
            
            // 7. General Math.random multipliers for obstacle delays (e.g., flashTimer=45)
            // Skip unless it's explicitly identifiable, to prevent breaking logic.

            if (scriptLogic !== originalLogic) {
                const newContent = content.substring(0, startIdx + scriptStart.length) + scriptLogic + content.substring(endIdx);
                fs.writeFileSync(fileLoc, newContent, { encoding: 'utf8' });
                console.log(`[PASS] Recalibrated coefficients in game${i}/index.html`);
                modifiedCount++;
            }
        }
    }
}

console.log(`[Overhaul Status] Successfully injected progressive difficulty curves into ${modifiedCount} game engines.`);
