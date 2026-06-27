const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

const targetStr = `            audioBtn.addEventListener('touchstart', toggleAudio, {passive: false});\n        }`;

const dragCode = `            audioBtn.addEventListener('touchstart', toggleAudio, {passive: false});
            
            // --- DRAG AND DROP INJECTION ---
            let isDragging = false, startX, startY, initX, initY;
            const onMove = (e) => {
                if(!isDragging) return;
                e.preventDefault();
                const cx = e.touches ? e.touches[0].clientX : e.clientX;
                const cy = e.touches ? e.touches[0].clientY : e.clientY;
                const dx = cx - startX;
                const dy = cy - startY;
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) audioBtn.dataset.wasDragged = 'true';
                audioBtn.style.position = 'fixed';
                audioBtn.style.margin = '0';
                audioBtn.style.left = (initX + dx) + 'px';
                audioBtn.style.top = (initY + dy) + 'px';
            };
            const onEnd = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onEnd);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onEnd);
            };
            const onStart = (e) => {
                isDragging = true;
                audioBtn.dataset.wasDragged = 'false';
                startX = e.touches ? e.touches[0].clientX : e.clientX;
                startY = e.touches ? e.touches[0].clientY : e.clientY;
                const rect = audioBtn.getBoundingClientRect();
                initX = rect.left;
                initY = rect.top;
                document.addEventListener('mousemove', onMove, {passive: false});
                document.addEventListener('mouseup', onEnd);
                document.addEventListener('touchmove', onMove, {passive: false});
                document.addEventListener('touchend', onEnd);
            };
            audioBtn.addEventListener('mousedown', onStart);
            audioBtn.addEventListener('touchstart', onStart, {passive: false});
            audioBtn.addEventListener('click', (e) => {
                if (audioBtn.dataset.wasDragged === 'true') {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    audioBtn.dataset.wasDragged = 'false';
                }
            }, true);
        }`;

let patchedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        
        // Use a regex replace to handle slight whitespace variations
        // Find: audioBtn.addEventListener('touchstart', toggleAudio, {passive: false}); \s* }
        const regex = /audioBtn\.addEventListener\('touchstart',\s*toggleAudio,\s*\{passive:\s*false\}\);\s*\}/g;
        
        if (regex.test(content) && !content.includes('DRAG AND DROP INJECTION')) {
            content = content.replace(regex, dragCode);
            fs.writeFileSync(fileLoc, content, 'utf8');
            patchedCount++;
        }
    }
}

console.log(`[DRAG & DROP] Successfully injected into ${patchedCount} games.`);
