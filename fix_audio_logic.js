const fs = require('fs');
const path = require('path');

const extractRegex = /\/\/\s*---\s*NATIVE WEB AUDIO ENGINE\s*---[\s\S]*?(?=\/\/ Bind init and SFX to canvas interactions globally)/;

const game1Content = fs.readFileSync(path.join(__dirname, 'games', 'game1', 'index.html'), 'utf8');
const match = game1Content.match(extractRegex);

if (!match) {
    console.error("Could not find audio block in Game 1");
    process.exit(1);
}

let audioBlock = match[0];
// Ensure button click is included
const customBindings = `
        // Bind init and SFX to canvas interactions globally
        document.addEventListener('mousedown', (e) => {
            if(!audioCtx && e.target.id !== 'audioToggleBtn') initAudioEngine();
            if(e.target.tagName === 'CANVAS' || e.target.tagName === 'BUTTON' || e.target.closest('button')) playClickSound();
        });
        document.addEventListener('touchstart', (e) => {
            if(!audioCtx && e.target.id !== 'audioToggleBtn') initAudioEngine();
            if(e.target.tagName === 'CANVAS' || e.target.tagName === 'BUTTON' || e.target.closest('button')) playClickSound();
        }, {passive: true});
        document.addEventListener('keydown', (e) => {
            if(!audioCtx) initAudioEngine();
            if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) playClickSound();
        });
`;

audioBlock += customBindings;

const gamesToFix = ['game9', 'game10'];
const targetText = '// Prevent Spacebar and Arrow keys from scrolling the page during gameplay';

gamesToFix.forEach(game => {
    const file = path.join(__dirname, 'games', game, 'index.html');
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('NATIVE WEB AUDIO ENGINE')) {
        console.log(game + ' already has audio engine.');
        return;
    }
    
    content = content.replace(targetText, audioBlock + '\n\n' + targetText);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed audio logic for " + game);
});
