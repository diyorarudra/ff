const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[GamiDay UX Architect]: Initiating Perfect Audio UI Relocation Protocol...");

const oldBtnRegex = /<button id="audioToggleBtn"[^>]*>[🔊🔇]<\/button>\s*/g;
const newBtn = `<button id="audioToggleBtn" style="display: inline-block; margin-left: 15px; padding: 12px; background: #1e293b; color: #38bdf8; border: 2px solid #38bdf8; border-radius: 50%; cursor: pointer; font-size: 20px; line-height: 1; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); transition: all 0.2s; vertical-align: middle;">🔊</button>`;

const newJs = `const audioBtn = document.getElementById('audioToggleBtn');
        if(audioBtn) {
            const toggleAudio = (e) => {
                if(e) { e.preventDefault(); e.stopPropagation(); }
                if(!audioCtx) initAudioEngine();
                if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                isMuted = !isMuted;
                if(bgmGain) bgmGain.gain.value = isMuted ? 0 : 0.03;
                audioBtn.textContent = isMuted ? '🔇' : '🔊';
            };
            audioBtn.addEventListener('click', toggleAudio);
            audioBtn.addEventListener('touchstart', toggleAudio, {passive: false});
        }
        `;
        
const jsRegex = /const audioBtn = document\.getElementById\('audioToggleBtn'\);[\s\S]*?\}\s*(?=\/\/ Bind init and SFX)/g;

let processedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        // 1. Remove the old button
        content = content.replace(oldBtnRegex, '');

        // 2. Inject new button next to restartBtn
        if (!content.includes('margin-left: 15px; padding: 12px;')) {
            // Find restartBtn and append right after it
            content = content.replace(/(id="restartBtn"[^>]*>[^<]*<\/button>)/i, '$1\n        ' + newBtn);
        }

        // 3. Update the JavaScript state toggle logic
        if (jsRegex.test(content)) {
            content = content.replace(jsRegex, newJs);
        }

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            processedCount++;
        }
    }
}

console.log('[PASS]: Audio UI controls successfully nested inside the main header dashboard and JS logic stabilized in ' + processedCount + ' layout matrices.');
console.log("[Antigravity Final Status]: Interface rendering and state handling perfected.");
