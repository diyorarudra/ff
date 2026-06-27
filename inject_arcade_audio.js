const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

console.log("[ArcadeNexus Audio Architect]: Initiating Universal Web Audio Deployment...");

const buttonTemplate = `<button id="audioToggleBtn" style="position: absolute; top: 15px; right: 15px; z-index: 100; padding: 8px 14px; background: #1e293b; color: #38bdf8; border: 1px solid #38bdf8; border-radius: 6px; cursor: pointer; font-family: sans-serif; font-weight: bold; font-size: 13px; transition: all 0.2s;">🔊 Music: ON</button>`;

const audioEngineLogic = `
        // --- NATIVE WEB AUDIO ENGINE ---
        let audioCtx = null;
        let bgmOsc = null;
        let bgmGain = null;
        let isMuted = false;

        function initAudioEngine() {
            if (audioCtx) return;
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            bgmOsc = audioCtx.createOscillator();
            bgmGain = audioCtx.createGain();
            
            bgmOsc.type = 'triangle';
            bgmGain.gain.value = isMuted ? 0 : 0.03;
            
            bgmOsc.connect(bgmGain);
            bgmGain.connect(audioCtx.destination);
            
            bgmOsc.start();
            
            let freqs = [130.81, 146.83, 164.81, 196.00];
            let fIdx = 0;
            setInterval(() => {
                if(audioCtx && bgmOsc) {
                    bgmOsc.frequency.setValueAtTime(freqs[fIdx], audioCtx.currentTime);
                    fIdx = (fIdx + 1) % freqs.length;
                }
            }, 600);
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
            audioBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if(!audioCtx) initAudioEngine();
                isMuted = !isMuted;
                if(bgmGain) bgmGain.gain.value = isMuted ? 0 : 0.03;
                audioBtn.textContent = isMuted ? '🔇 Music: OFF' : '🔊 Music: ON';
            });
            audioBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if(!audioCtx) initAudioEngine();
                isMuted = !isMuted;
                if(bgmGain) bgmGain.gain.value = isMuted ? 0 : 0.03;
                audioBtn.textContent = isMuted ? '🔇 Music: OFF' : '🔊 Music: ON';
            }, {passive: false});
        }

        // Bind init and SFX to canvas interactions globally
        document.addEventListener('mousedown', (e) => {
            if(!audioCtx && e.target.id !== 'audioToggleBtn') initAudioEngine();
            if(e.target.tagName === 'CANVAS') playClickSound();
        });
        document.addEventListener('keydown', (e) => {
            if(!audioCtx) initAudioEngine();
            if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) playClickSound();
        });
`;

let injectedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, 'game' + i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        let original = content;

        // 1. Inject UI Element just before the canvas
        if (!content.includes('audioToggleBtn')) {
            content = content.replace(/(<canvas[^>]*>)/, buttonTemplate + '\n      $1');
        }

        // 2. Inject Web Audio Engine into the main script boundary
        if (!content.includes('NATIVE WEB AUDIO ENGINE')) {
            const scriptEnd = '</script>';
            const lastScriptEndIdx = content.lastIndexOf(scriptEnd);
            
            if (lastScriptEndIdx !== -1) {
                content = content.substring(0, lastScriptEndIdx) + audioEngineLogic + content.substring(lastScriptEndIdx);
            }
        }

        if (content !== original) {
            fs.writeFileSync(fileLoc, content, 'utf8');
            injectedCount++;
        }
    }
}

console.log('[PASS]: Native Web Audio synthesizers successfully deployed across ' + injectedCount + ' game matrices.');
console.log("[Antigravity Final Status]: Audio architecture sweep completely stabilized.");
