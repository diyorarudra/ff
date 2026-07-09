const fs = require('fs');
const path = require('path');

const mainjs = fs.readFileSync('js/main.js', 'utf8');
const matches = [...mainjs.matchAll(/slug: '([^']+)'/g)];
const slugs = matches.slice(-38).map(m => m[1]);

for (const slug of slugs) {
    const file = `games/${slug}/index.html`;
    if (!fs.existsSync(file)) continue;

    let html = fs.readFileSync(file, 'utf8');
    let modified = false;

    // 1. Insert button into navbar if not already there
    const newBtn = `<button id="audioToggleBtn" style="width: 38px; height: 38px; padding: 0; display: flex; align-items: center; justify-content: center; background: #1e293b; color: #38bdf8; border: 1px solid #38bdf8; border-radius: 50%; cursor: pointer; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); transition: all 0.2s; z-index: 200; flex-shrink: 0;" title="Toggle Audio">🔊</button>`;
    
    if (!html.includes('id="audioToggleBtn"')) {
        html = html.replace('<div class="flex items-center gap-4">', '<div class="flex items-center gap-4">\n      ' + newBtn);
        modified = true;
    }

    // 2. Insert JS logic before </body> if not already there
    if (!html.includes('initAudioEngine()')) {
        const audioJS = `
<script>
// --- NATIVE WEB AUDIO ENGINE ---
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
}

document.addEventListener('mousedown', (e) => {
    if(!audioCtx && e.target.id !== 'audioToggleBtn') initAudioEngine();
    if(e.target.tagName === 'CANVAS' || e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.btn') || e.target.closest('.key') || e.target.closest('.tube') || e.target.closest('.option-btn') || e.target.closest('.color-btn')) playClickSound();
});
document.addEventListener('keydown', (e) => {
    if(!audioCtx) initAudioEngine();
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Enter'].includes(e.code)) playClickSound();
});
</script>
</body>`;
        html = html.replace('</body>', audioJS);
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, html);
        console.log(`Updated ${file}`);
    }
}
console.log('Done.');
