const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

// Mojibake replacement map
const mojibakeMap = {
    "Send Message": "Send Message",
    "Quick Response": "Quick Response",
    "Bug Reports": "Bug Reports",
    "Partnerships": "Partnerships",
    "Built with Love": "Built with Love",
    "Built with Love": "Built with Love",
    "Delete": "Delete",
    "&mdash;": "&mdash;",
    "-": "-"
};

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let original = fs.readFileSync(filePath, 'utf8');
    let text = original;

    // Fix Mojibake
    for (const [bad, good] of Object.entries(mojibakeMap)) {
        // use split join for replaceAll
        text = text.split(bad).join(good);
    }

    // Ensure <meta charset="UTF-8"> is the absolute first declaration inside <head>
    if (filePath.endsWith('.html')) {
        text = text.replace(/<meta charset="[^"]*">/gi, '');
        const headIdx = text.indexOf('<head>');
        if (headIdx !== -1) {
            // Find if it already has it right after
            const afterHead = text.substring(headIdx + 6, headIdx + 40);
            if (!afterHead.includes('<meta charset="UTF-8">')) {
                text = text.substring(0, headIdx + 6) + '\n  <meta charset="UTF-8">' + text.substring(headIdx + 6);
            }
        }
    }

    if (text !== original) {
        fs.writeFileSync(filePath, text, { encoding: 'utf8' });
        return true;
    }
    return false;
}

// 1. Run Mojibake Purge on the entire games directory tree
let totalFixed = 0;
for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(__dirname, 'games', `game${i}`, 'index.html');
    if (processFile(fileLoc)) {
        totalFixed++;
    }
}
console.log(`[Antigravity Automation]: Completed MOJIBAKE PURGE. Fixed encoding in ${totalFixed} files.`);

// 2. Specific Arcade Logic Integration (Game 89 - Balloons Shooter)
const game89Path = path.join(__dirname, 'games', 'game89', 'index.html');
if (fs.existsSync(game89Path)) {
    let text = fs.readFileSync(game89Path, 'utf8');
    
    // Fix instruction text
    const pStart = text.lastIndexOf('<p class="text-center');
    const pEnd = text.indexOf('</p>', pStart);
    if (pStart !== -1 && pEnd !== -1) {
        const pBlock = text.substring(pStart, pEnd + 4);
        const newPBlock = pBlock.replace(/>[^<]*<\/p>/, '>Click or tap to pop the floating balloons to score.</p>');
        text = text.substring(0, pStart) + newPBlock + text.substring(pEnd + 4);
    }

    const scriptMarker = '<script>';
    const closingMarker = '</script>';
    const startIdx = text.lastIndexOf(scriptMarker);
    const endIdx = text.lastIndexOf(closingMarker);

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const balloonEngine = `
        const c=document.getElementById('gameCanvas_89'); const ctx=c.getContext('2d');
        let b=[]; let s=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            if(Math.random()<0.08) b.push({x:Math.random()*c.width, y:c.height+50, r:20+Math.random()*30, c:'hsl('+Math.floor(Math.random()*360)+', 80%, 50%)'});
            for(let i=b.length-1;i>=0;i--){ 
                b[i].y-=3; 
                ctx.fillStyle=b[i].c; 
                ctx.beginPath(); ctx.arc(b[i].x,b[i].y,b[i].r,0,Math.PI*2); ctx.fill(); 
                if(b[i].y<-50) b.splice(i,1); 
            }
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('Balloons Shooter Score: '+s,20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('click',(e)=>{ 
            const r=c.getBoundingClientRect(); 
            const x=(e.clientX-r.left)*(c.width/r.width), y=(e.clientY-r.top)*(c.height/r.height); 
            for(let i=b.length-1;i>=0;i--){ 
                if(Math.hypot(b[i].x-x,b[i].y-y)<b[i].r){ b.splice(i,1); s+=10; document.getElementById('score').innerText=s; break; } 
            } 
        }); loop();`;
        
        const rewrittenContent = text.substring(0, startIdx) + scriptMarker + '\n' + balloonEngine + '\n  ' + closingMarker + text.substring(endIdx + closingMarker.length);
        fs.writeFileSync(game89Path, rewrittenContent, { encoding: 'utf8' });
        console.log('[Antigravity Automation]: Injected specific balloon shooter mechanics into games/game89/index.html');
    }
}
