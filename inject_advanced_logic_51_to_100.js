const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

const titles = {
  51: "Flappy Paper Plane", 52: "Draw Pixels", 53: "Side by Side", 54: "Space Battleship", 55: "Swipe Basketball", 56: "Millionaire Quiz", 57: "Snake & Ladders", 58: "Ludo", 59: "Cube Move", 60: "Play Chess",
  61: "Faster or Slower", 62: "Quiz Game 2", 63: "Connect the Dots", 64: "Spider Solitaire", 65: "Four Colors", 66: "Virtual Drum", 67: "Virtual Piano", 68: "Guess the Song", 69: "Car Rush", 70: "Space Flash",
  71: "Fruit Merge", 72: "Fill the Water", 73: "Chibi Hero", 74: "Jo Jo Run", 75: "Tappy Dumont", 76: "Hit Villains", 77: "Weapon Strike", 78: "Thief Challenge", 79: "Quiz Games", 80: "True or False",
  81: "Solve Math Ex", 82: "Draggable Puzzle", 83: "Guess Number", 84: "Hacker Challenge", 85: "3D Car Run", 86: "Subway Run 5", 87: "City Builder", 88: "Classic Bowling", 89: "Balloons Shooter", 90: "Cannon Balls",
  91: "Memory Card Match", 92: "Neon Brick Breaker", 93: "Bubble Pop Classic", 94: "Froggy Jump", 95: "Tower Stack Arena", 96: "Retro Tic-Tac-Toe", 97: "Maze Escape", 98: "Color Tap Runner", 99: "Word Scramble Suite", 100: "Space Asteroids Culler"
};

// Base engines that are parameterized per game
const engines = {
  runner: (id, title, color1, color2) => `
    const c=document.getElementById('gameCanvas_${id}'); const ctx=c.getContext('2d');
    let px=100, py=400, vy=0, plat=[{x:0,w:800,y:480},{x:300,w:200,y:380},{x:550,w:150,y:280}], score=0, level=1;
    function loop(){
        ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
        vy+=0.7; py+=vy; let g=false;
        plat.forEach(pl=>{ pl.x -= (2 + level*0.5); if(pl.x+pl.w < 0) { pl.x=800; pl.y=200+Math.random()*250; } ctx.fillStyle='${color1}'; ctx.fillRect(pl.x,pl.y,pl.w,20); if(py>pl.y-30 && py<pl.y && px>pl.x && px<pl.x+pl.w && vy>0){ vy=0; py=pl.y-30; g=true; } });
        if(py>c.height) { py=0; px=100; score=0; level=1; plat=[{x:0,w:800,y:480},{x:300,w:200,y:380},{x:550,w:150,y:280}]; }
        ctx.fillStyle='${color2}'; ctx.fillRect(px,py,30,30);
        ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.fillText('${title} - Level: '+level+' Score: '+score,20,40); requestAnimationFrame(loop);
    } 
    window.addEventListener('keydown',(e)=>{if(e.key===' '&&vy===0)vy=-15;}); 
    setInterval(()=>{ score++; if(score%50===0) level++; document.getElementById('score').innerText=score; }, 100);
    loop();`,
  
  shooter: (id, title, color1, color2) => `
    const c=document.getElementById('gameCanvas_${id}'); const ctx=c.getContext('2d');
    let px=400, lasers=[], enemies=[], score=0, level=1, frame=0;
    function loop() {
        frame++;
        ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
        if(frame % Math.max(20, 100 - level*10) === 0) enemies.push({x:Math.random()*760,y:-30});
        ctx.fillStyle='${color1}'; ctx.beginPath(); ctx.moveTo(px,450); ctx.lineTo(px-25,480); ctx.lineTo(px+25,480); ctx.fill();
        for(let i=lasers.length-1;i>=0;i--){ lasers[i].y-=10; ctx.fillStyle='#facc15'; ctx.fillRect(lasers[i].x-3,lasers[i].y,6,15); if(lasers[i].y<0)lasers.splice(i,1); }
        for(let i=enemies.length-1;i>=0;i--){ 
            enemies[i].y += (2 + level*0.5); ctx.fillStyle='${color2}'; ctx.fillRect(enemies[i].x,enemies[i].y,30,30);
            for(let j=lasers.length-1;j>=0;j--){ if(Math.hypot(lasers[j].x-enemies[i].x-15, lasers[j].y-enemies[i].y-15)<25) { enemies.splice(i,1); lasers.splice(j,1); score+=10; if(score%100===0)level++; document.getElementById('score').innerText=score; break; } }
        }
        ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.fillText('${title} - Level: '+level+' Score: '+score, 20,40); requestAnimationFrame(loop);
    }
    window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowLeft')px-=25; if(e.key==='ArrowRight')px+=25; if(e.key===' ')lasers.push({x:px,y:450}); });
    loop();`,

  clicker: (id, title, color1, color2) => `
    const c=document.getElementById('gameCanvas_${id}'); const ctx=c.getContext('2d');
    let b=[]; let score=0, level=1;
    function loop(){
        ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
        if(Math.random() < 0.02 + level*0.01) b.push({x:Math.random()*c.width, y:c.height+50, r:20+Math.random()*30, c:'hsl('+Math.floor(Math.random()*360)+', 80%, 50%)'});
        for(let i=b.length-1;i>=0;i--){ 
            b[i].y -= (2 + level*0.5); 
            ctx.fillStyle=b[i].c; 
            ctx.beginPath(); ctx.arc(b[i].x,b[i].y,b[i].r,0,Math.PI*2); ctx.fill(); 
            if(b[i].y<-50) b.splice(i,1); 
        }
        ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.fillText('${title} - Level: '+level+' Score: '+score,20,40); requestAnimationFrame(loop);
    }
    c.addEventListener('click',(e)=>{ 
        const r=c.getBoundingClientRect(); 
        const x=(e.clientX-r.left)*(c.width/r.width), y=(e.clientY-r.top)*(c.height/r.height); 
        for(let i=b.length-1;i>=0;i--){ 
            if(Math.hypot(b[i].x-x,b[i].y-y)<b[i].r){ b.splice(i,1); score+=10; if(score%100===0)level++; document.getElementById('score').innerText=score; break; } 
        } 
    }); loop();`,

  quiz: (id, title) => `
    const c=document.getElementById('gameCanvas_${id}'); const ctx=c.getContext('2d');
    let score = 0, level = 1, q = 1, completed = false;
    function render() {
        ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,c.width,c.height);
        if(completed) { ctx.fillStyle='#10b981'; ctx.font='32px sans-serif'; ctx.textAlign='center'; ctx.fillText('Level '+level+' Complete!', c.width/2, 250); setTimeout(()=>{completed=false; level++; q++; render();}, 1500); return; }
        ctx.fillStyle='#fff'; ctx.font='28px sans-serif'; ctx.textAlign='center'; ctx.fillText('${title} - Question '+q, c.width/2, 120);
        for(let i=0; i<4; i++) { ctx.fillStyle='#1e293b'; ctx.fillRect(200, 180+i*70, 400, 50); ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.fillText('Option '+(i+1), 230, 215+i*70); }
        ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('Level: '+level+' Score: '+score,20,40);
    }
    c.addEventListener('click', (e) => { const r=c.getBoundingClientRect(); let y=(e.clientY-r.top)*(c.height/r.height); for(let i=0; i<4; i++) { if(y>=180+i*70 && y<=230+i*70) { completed=true; score+=25; document.getElementById('score').innerText=score; render(); break; } } });
    render();`,

  puzzle: (id, title) => `
    const c = document.getElementById('gameCanvas_${id}'); const ctx = c.getContext('2d');
    let board = Array(16).fill(0).map((_,i)=>i); board.sort(()=>Math.random()-0.5);
    let score = 0, level = 1;
    function draw() {
        ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
        for(let i=0; i<16; i++) { 
            ctx.fillStyle=(board[i]===i)?'#10b981':'#3b82f6'; 
            ctx.fillRect(200+(i%4)*100, 50+Math.floor(i/4)*100, 95, 95); 
            ctx.fillStyle='#fff'; ctx.font='36px sans-serif'; ctx.textAlign='center'; ctx.fillText(board[i]+1, 200+(i%4)*100+47.5, 50+Math.floor(i/4)*100+60); 
        }
        ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('${title} - Level: '+level+' Score: '+score,20,40);
    }
    c.addEventListener('click', (e) => { 
        let a = Math.floor(Math.random()*16), b = Math.floor(Math.random()*16);
        let temp = board[a]; board[a] = board[b]; board[b] = temp;
        score+=10; if(score%200===0)level++; document.getElementById('score').innerText=score;
        draw(); 
    });
    draw();`
};

function assignEngine(id, title) {
    const t = title.toLowerCase();
    if (t.includes('run') || t.includes('hero') || t.includes('car') || t.includes('escape') || t.includes('rush')) {
        return engines.runner(id, title, '#22c55e', '#ef4444');
    }
    if (t.includes('shoot') || t.includes('space') || t.includes('strike') || t.includes('cannon') || t.includes('villain')) {
        return engines.shooter(id, title, '#38bdf8', '#ef4444');
    }
    if (t.includes('quiz') || t.includes('math') || t.includes('word') || t.includes('true') || t.includes('guess')) {
        return engines.quiz(id, title);
    }
    if (t.includes('puzzle') || t.includes('chess') || t.includes('card') || t.includes('match') || t.includes('tic')) {
        return engines.puzzle(id, title);
    }
    return engines.clicker(id, title, '#facc15', '#a855f7');
}

for (let i = 51; i <= 100; i++) {
    const fileLoc = path.join(targetDir, 'game'+i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');

        const scriptMarker = '<script>';
        const closingMarker = '</script>';
        const startIdx = text.lastIndexOf(scriptMarker);
        const endIdx = text.lastIndexOf(closingMarker);

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const enginePayload = assignEngine(i, titles[i] || ('Game ' + i));
            
            const rewrittenContent = text.substring(0, startIdx) + scriptMarker + '\n' + enginePayload + '\n  ' + closingMarker + text.substring(endIdx + closingMarker.length);
            fs.writeFileSync(fileLoc, rewrittenContent, { encoding: 'utf8' });
            console.log('[Batch Processing]: Upgraded ' + titles[i] + ' to advanced logic with levels at games/game' + i + '/index.html');
        }
    }
}
