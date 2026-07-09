const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, '..', 'games');

const priorityGames = [
  'daily-word-puzzle', 'word-connect', 'daily-brain-training',
  'cricket-quiz-league', 'color-sort-puzzle', 'water-sort-puzzle',
  'escape-room-mini', 'find-the-difference'
];

const helperStr = `
function showLevelCompleteModal(onNext) {
    let modal = document.getElementById('ff-internal-level-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ff-internal-level-modal';
        modal.innerHTML = '<div style="background:rgba(15,23,42,0.95);padding:40px;border-radius:24px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.8);border:2px solid #fbbf24;min-width:300px;"><h2 style="color:#fbbf24;font-size:32px;margin:0 0 20px 0;font-family:system-ui,sans-serif;font-weight:900;">Level Complete!</h2><button id="ff-internal-next-btn" style="background:linear-gradient(135deg, #fbbf24, #f59e0b);color:#000;border:none;padding:16px 32px;font-size:20px;font-weight:900;border-radius:30px;cursor:pointer;box-shadow:0 4px 15px rgba(245,158,11,0.4);transition:transform 0.2s;">Next Level ➔</button></div>';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
        document.body.appendChild(modal);
        
        const btn = document.getElementById('ff-internal-next-btn');
        btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
    }
    modal.style.display = 'flex';
    document.getElementById('ff-internal-next-btn').onclick = () => {
        modal.style.display = 'none';
        if (onNext) onNext();
    };
}
`;

priorityGames.forEach(slug => {
    let jsPath = path.join(gamesDir, slug, 'script.js');
    if (!fs.existsSync(jsPath)) return;
    let code = fs.readFileSync(jsPath, 'utf8');
    
    if (code.includes('showLevelCompleteModal')) {
        console.log('Skipped (already patched): ' + slug);
        return;
    }
    
    // Add helper
    code += helperStr;
    
    // Replace manual lines for some specific games
    if (slug === 'color-sort-puzzle' || slug === 'water-sort-puzzle' || slug === 'find-the-difference' || slug === 'escape-room-mini') {
        // e.g. postMsg("LEVEL_COMPLETE", ...); level++; startLevel();
        code = code.replace(/(postMsg\("LEVEL_COMPLETE"[^\)]*\);)\s+([a-zA-Z]+\+\+;)\s+([a-zA-Z]+\(\);)/g, 
        (match, p1, p2, p3) => `${p1}\n                showLevelCompleteModal(() => {\n                    ${p2}\n                    ${p3}\n                });`);
    } else if (slug === 'daily-word-puzzle' || slug === 'word-connect' || slug === 'daily-brain-training' || slug === 'cricket-quiz-league') {
        // e.g. postMsg("LEVEL_COMPLETE", ...); loadRound();
        code = code.replace(/(postMsg\("LEVEL_COMPLETE"[^\)]*\);)\s+([a-zA-Z]+\(\);)/g, 
        (match, p1, p2) => `${p1}\n                showLevelCompleteModal(() => {\n                    ${p2}\n                });`);
    }
    
    fs.writeFileSync(jsPath, code, 'utf8');
    console.log('Patched: ' + slug);
});
