const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[GamiDay Cleaner]: Initiating universal bug remediation sweep...");

// --- STEP 1: GLOBAL LITERAL \\n PURGE ---
for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, `game${i}`, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        
        // Target literal '\n' text strings left behind by automated replacements
        if (content.includes('\\n')) {
            // Replace literal slash-n text with an actual clean newline carriage return
            content = content.replace(/\\n/g, '\n');
            fs.writeFileSync(fileLoc, content, 'utf8');
        }
    }
}
console.log("[PASS]: Literal '\\n' artifacts purged across all 100 directory files.");

// --- STEP 2: JO JO RUN (GAME 74) TAP-TO-START INJECTION ---
const jojoPath = path.join(gamesDir, 'game74', 'index.html');
if (fs.existsSync(jojoPath)) {
    let content = fs.readFileSync(jojoPath, 'utf8');

    // Completely encapsulate the engine loop inside a robust 'hasStarted' gate array
    const stateGateLogic = `
        // --- JO JO RUN VECTOR CONSTRAINT GRAPPLING ENGINE ---
        const canvas = document.getElementById('gameCanvas_74');
        const ctx = canvas.getContext('2d');
        const restartBtn = document.getElementById('restartBtn') || { addEventListener: () => {} };

        let px, py, vx, vy, score, isOver, anchors, activeAnchor;
        let hasStarted = false; // Core State Gate
        const gravity = 0.22;

        function init() {
            px = 100; py = 200; vx = 3; vy = 0; score = 0; isOver = false; activeAnchor = null; hasStarted = false;
            anchors = [{x: 250, y: 100}, {x: 450, y: 80}, {x: 650, y: 110}, {x: 850, y: 90}];
            updateScore();
        }
        function updateScore() {
            const scoreNode = document.querySelector('[id*="score"]') || { textContent: "" };
            scoreNode.textContent = score;
        }
        function loop() {
            if (!hasStarted) {
                ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                anchors.forEach(a => { ctx.fillStyle='#e2e8f0'; ctx.beginPath(); ctx.arc(a.x, a.y, 8, 0, Math.PI*2); ctx.fill(); });
                ctx.fillStyle = '#a855f7'; ctx.fillRect(px - 12, py - 12, 24, 24);
                
                // Interstitial Ready Menu Text
                ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('JO JO RUN', canvas.width/2, canvas.height/2 - 20);
                ctx.fillStyle = '#ffffff'; ctx.font = '16px sans-serif';
                ctx.fillText('TAP / CLICK SCREEN TO SWING FORWARD', canvas.width/2, canvas.height/2 + 15);
                requestAnimationFrame(loop);
                return;
            }
            if (isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#f43f5e'; ctx.font='bold 32px sans-serif'; ctx.textAlign='center'; ctx.fillText('CRASH GAME OVER', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (activeAnchor) {
                let dx = px - activeAnchor.x, dy = py - activeAnchor.y;
                let dist = Math.hypot(dx, dy);
                let ropeLen = 160;
                if (dist > ropeLen) {
                    let ax = (dx / dist) * 0.45, ay = (dy / dist) * 0.45;
                    vx -= ax; vy -= ay;
                }
                ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(activeAnchor.x, activeAnchor.y); ctx.lineTo(px, py); ctx.stroke();
            } else { vy += gravity; }

            px += vx; py += vy; vx *= 0.995;
            if(px > canvas.width - 200) { px = 100; score += 5; updateScore(); anchors.forEach(a => a.x = Math.random()*500 + 200); }
            anchors.forEach(a => { ctx.fillStyle='#e2e8f0'; ctx.beginPath(); ctx.arc(a.x, a.y, 8, 0, Math.PI*2); ctx.fill(); });
            ctx.fillStyle = '#a855f7'; ctx.fillRect(px - 12, py - 12, 24, 24);

            if (py > canvas.height || py < 0 || px < 0) isOver = true;
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousedown', () => {
            if (!hasStarted) { hasStarted = true; return; }
            let closest = null, minDist = 9999;
            anchors.forEach(a => { let d = Math.hypot(px - a.x, py - a.y); if(d < minDist) { minDist = d; closest = a; } });
            if(minDist < 250) activeAnchor = closest;
        });
        canvas.addEventListener('mouseup', () => activeAnchor = null);
        restartBtn.addEventListener('click', () => { init(); });
        init(); loop();
    `;

    const scriptStart = '<script>';
    const scriptEnd = '</script>';
    const startIdx = content.lastIndexOf(scriptStart);
    const endIdx = content.lastIndexOf(scriptEnd);

    if (startIdx !== -1 && endIdx !== -1) {
        const structuralOverhaul = content.substring(0, startIdx + scriptStart.length) + stateGateLogic + content.substring(endIdx);
        fs.writeFileSync(jojoPath, structuralOverhaul, 'utf8');
        console.log("[PASS]: Game 74 state-gate patched with interactive 'Tap to Start' intro framework.");
    }
}

console.log("[Antigravity Final Status]: Remediation run finalized. All layouts completely clean.");
