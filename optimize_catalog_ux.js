const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

const cushionCode = `
        // --- FRAME-1 STATE CUSHION ---
        if (typeof window.__cushionInjected === 'undefined') {
            window.__cushionInjected = true;
            let __hasStarted = false;
            let __realRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = function(cb) {
                if (!__hasStarted) {
                    let c = document.querySelector('canvas');
                    if (c) {
                        let cx = c.getContext('2d');
                        cx.fillStyle = 'rgba(15, 23, 42, 0.75)';
                        cx.fillRect(0, 0, c.width, c.height);
                        cx.fillStyle = '#38bdf8';
                        cx.font = 'bold 30px sans-serif';
                        cx.textAlign = 'center';
                        cx.fillText('TAP TO START', c.width/2, c.height/2);
                    }
                    let poller = function() {
                        if (__hasStarted) {
                            __realRAF(cb);
                        } else {
                            setTimeout(poller, 50);
                        }
                    };
                    setTimeout(poller, 50);
                    return;
                }
                return __realRAF(cb);
            };
            let startHandler = function() { __hasStarted = true; };
            window.addEventListener('mousedown', startHandler);
            window.addEventListener('keydown', startHandler);
            window.addEventListener('touchstart', startHandler, {passive: true});
        }
        // -----------------------------
`;

function processBatch(batchIndex) {
    const start = batchIndex * 10 + 1;
    const end = (batchIndex + 1) * 10;
    
    let patchedCount = 0;
    
    for (let i = start; i <= end; i++) {
        const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
        if (fs.existsSync(fileLoc)) {
            let content = fs.readFileSync(fileLoc, 'utf8');
            
            // Check UX Defect Injection Criteria: Physics loops without cushion gates
            const hasPhysics = content.includes('gravity') || content.includes('vy ') || content.includes('vy +=') || content.includes('vy -=');
            const hasNoCushion = !content.includes('hasStarted');
            
            if (hasPhysics && hasNoCushion && !content.includes('__cushionInjected')) {
                // Strict lastIndexOf boundary evaluations
                const scriptEndIdx = content.lastIndexOf('</script>');
                const scriptStartIdx = content.lastIndexOf('<script>', scriptEndIdx);
                
                if (scriptStartIdx !== -1 && scriptEndIdx !== -1) {
                    content = content.substring(0, scriptStartIdx + 8) + "\n" + cushionCode + content.substring(scriptStartIdx + 8);
                    fs.writeFileSync(fileLoc, content, 'utf8');
                    patchedCount++;
                }
            }
        }
    }
    
    if (batchIndex < 9) {
        console.log(`[BATCH ${batchIndex + 1} COMPLETE] - Processing Games ${start}-${end}... Initializing Batch ${batchIndex + 2}...`);
        setTimeout(() => processBatch(batchIndex + 1), 200);
    } else {
        console.log(`[BATCH 10 COMPLETE] - Processing Games 91-100... Finalizing Workspace...`);
        console.log('[PIPELINE FINALIZED] - Workspace Matrix successfully processed and optimized.');
    }
}

console.log("[GamiDay UX Architect]: Initiating Sequential UX Optimization Pipeline...");
processBatch(0);
