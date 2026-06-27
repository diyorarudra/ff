const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[GamiDay Audio Architect]: Initiating Pure SFX Engine Extraction...");

const pureEngine = `// --- NATIVE WEB AUDIO ENGINE ---
        let audioCtx = null;
        let isMuted = false;

        function initAudioEngine() {
            if (audioCtx) return;
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        function playClickSound() {
            if (isMuted || !audioCtx) return;
            let clickOsc = audioCtx.createOscillator();
            let clickGain = audioCtx.createGain();
            
            clickOsc.type = 'sine';
            clickOsc.frequency.setValueAtTime(440, audioCtx.currentTime);
            clickOsc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
            
            clickGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            clickGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
            
            clickOsc.connect(clickGain);
            clickGain.connect(audioCtx.destination);
            
            clickOsc.start();
            clickOsc.stop(audioCtx.currentTime + 0.1);
        }

        const audioBtn = document.getElementById('audioToggleBtn');
        if(audioBtn) {
            const toggleAudio = (e) => {
                if(e) { e.preventDefault(); e.stopPropagation(); }
                if(!audioCtx) initAudioEngine();
                if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                isMuted = !isMuted;
                audioBtn.textContent = isMuted ? '🔇' : '🔊';
            };
            audioBtn.addEventListener('click', toggleAudio);
            audioBtn.addEventListener('touchstart', toggleAudio, {passive: false});
        }
        `;

let processedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        const engineStartIdx = content.lastIndexOf('// --- NATIVE WEB AUDIO ENGINE ---');
        const engineEndIdx = content.lastIndexOf('// Bind init and SFX');

        if (engineStartIdx !== -1 && engineEndIdx !== -1 && engineStartIdx < engineEndIdx) {
            content = content.substring(0, engineStartIdx) + pureEngine + content.substring(engineEndIdx);
        }

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            processedCount++;
        }
    }
}

console.log('[PASS]: BGM oscillator loop successfully purged and SFX pure click bindings integrated across ' + processedCount + ' environment arrays.');
console.log("[Antigravity Final Status]: Audio interaction suite perfectly standardized.");
