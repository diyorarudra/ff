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

const instructions = {
    51: "Click or tap to flap and avoid the obstacles.",
    52: "Click and drag on the grid to draw pixels.",
    53: "Use A/D and Left/Right arrows to move both blocks.",
    54: "Use Left/Right arrows to move and Space to shoot.",
    55: "Click and drag to aim, release to shoot toward the hoop.",
    56: "Click the correct answer to progress through the quiz.",
    57: "Click to roll the dice and move your piece.",
    58: "Click to progress your pieces along the Ludo board.",
    60: "Click and drag to position pieces on the board sandbox.",
    64: "Click to distribute cards and build descending suits.",
    65: "Click the deck to play a matching color card.",
    67: "Click the piano keys to play a musical scale.",
    68: "Click to listen to the audio snippet and guess.",
    69: "Use Left and Right keys to steer along the curve.",
    71: "Click inside the canvas viewport to drop items and merge identical tiers.",
    79: "Click the correct answer boxes to score points."
};

const microEngines = {
    51: `
        const canvas = document.getElementById('gameCanvas_51'); const ctx = canvas.getContext('2d');
        let planeY = 250, velocity = 0, gravity = 0.4, score = 0, isOver = false, pipes = [];
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='36px sans-serif'; ctx.textAlign='center'; ctx.fillText('Game Over', canvas.width/2, canvas.height/2); return; }
            velocity += gravity; planeY += velocity;
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(200, planeY, 35, 25);
            if(pipes.length === 0 || pipes[pipes.length-1].x < canvas.width - 350) pipes.push({ x: canvas.width, gapTop: 100 + Math.random()*200, passed: false });
            for(let i=pipes.length-1; i>=0; i--) {
                let p = pipes[i]; p.x -= 4;
                ctx.fillStyle = '#334155'; ctx.fillRect(p.x, 0, 70, p.gapTop); ctx.fillRect(p.x, p.gapTop+160, 70, canvas.height);
                if(p.x < 200 && !p.passed) { score++; p.passed = true; document.getElementById('score').innerText=score; }
                if(p.x < -100) pipes.splice(i,1);
                if(200 > p.x-35 && 200 < p.x+70 && (planeY < p.gapTop || planeY+25 > p.gapTop+160)) isOver = true;
            }
            if(planeY > canvas.height || planeY < 0) isOver = true;
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.textAlign='left'; ctx.fillText('Score: ' + score, 20, 35); requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousedown', () => { velocity = -7.5; }); window.addEventListener('keydown', (e) => { if(e.key === ' ') velocity = -7.5; }); loop();
    `,
    52: `
        const canvas = document.getElementById('gameCanvas_52'); const ctx = canvas.getContext('2d');
        let pixelGrid = Array(16).fill().map(() => Array(16).fill('#131a26'));
        function redraw() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            for(let r=0; r<16; r++) { for(let c=0; c<16; c++) { ctx.fillStyle=pixelGrid[r][c]; ctx.fillRect(c*25+200, r*25+50, 24, 24); } }
        }
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
            const c = Math.floor(((e.clientX - rect.left)*scaleX - 200)/25), r = Math.floor(((e.clientY - rect.top)*scaleY - 50)/25);
            if(r>=0 && r<16 && c>=0 && c<16) { pixelGrid[r][c] = '#8b5cf6'; redraw(); }
        });
        redraw();
    `,
    53: `
        const c=document.getElementById('gameCanvas_53'); const ctx=c.getContext('2d');
        let lx=200, rx=600, y=400, score=0, ob=[];
        function loop() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#3b82f6'; ctx.fillRect(0,0,c.width/2,c.height);
            ctx.fillStyle='#ef4444'; ctx.fillRect(c.width/2,0,c.width/2,c.height);
            ctx.fillStyle='#fff'; ctx.fillRect(lx,y,40,40); ctx.fillRect(rx,y,40,40);
            if(Math.random()<0.04) ob.push({x: Math.random()<0.5?50+Math.random()*250:450+Math.random()*250, y:-40});
            for(let i=ob.length-1;i>=0;i--){ ob[i].y+=6; ctx.fillStyle='#000'; ctx.fillRect(ob[i].x,ob[i].y,40,40); if(ob[i].y>c.height){ob.splice(i,1); score++; document.getElementById('score').innerText=score;} }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key==='a')lx-=20; if(e.key==='d')lx+=20; if(e.key==='ArrowLeft')rx-=20; if(e.key==='ArrowRight')rx+=20; });
        loop();
    `,
    54: `
        const c=document.getElementById('gameCanvas_54'); const ctx=c.getContext('2d');
        let px=400, lasers=[], aliens=[], score=0;
        setInterval(()=>aliens.push({x:Math.random()*760,y:-30}), 700);
        function loop() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#38bdf8'; ctx.beginPath(); ctx.moveTo(px,450); ctx.lineTo(px-25,480); ctx.lineTo(px+25,480); ctx.fill();
            for(let i=lasers.length-1;i>=0;i--){ lasers[i].y-=10; ctx.fillStyle='#facc15'; ctx.fillRect(lasers[i].x-3,lasers[i].y,6,15); if(lasers[i].y<0)lasers.splice(i,1); }
            for(let i=aliens.length-1;i>=0;i--){ 
                aliens[i].y+=3; ctx.fillStyle='#ef4444'; ctx.fillRect(aliens[i].x,aliens[i].y,30,30);
                for(let j=lasers.length-1;j>=0;j--){ if(Math.hypot(lasers[j].x-aliens[i].x-15, lasers[j].y-aliens[i].y-15)<25) { aliens.splice(i,1); lasers.splice(j,1); score+=10; document.getElementById('score').innerText=score; break; } }
            }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowLeft')px-=25; if(e.key==='ArrowRight')px+=25; if(e.key===' ')lasers.push({x:px,y:450}); });
        loop();
    `,
    55: `
        const canvas = document.getElementById('gameCanvas_55'); const ctx = canvas.getContext('2d');
        let bx = 150, by = 400, active = false, vx = 0, vy = 0, score = 0, sx, sy;
        function run() {
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(650, 200, 80, 8);
            if(active) { vy += 0.35; bx += vx; by += vy; if(bx > 640 && bx < 740 && by > 180 && by < 220 && vy > 0) { score++; document.getElementById('score').innerText=score; active = false; bx = 150; by = 400; } if(by > 550) { active = false; bx = 150; by = 400; } }
            ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(bx, by, 22, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.textAlign='left'; ctx.fillText('Score: ' + score, 20, 40); requestAnimationFrame(run);
        }
        canvas.addEventListener('mousedown', (e) => { if(!active) { const r=canvas.getBoundingClientRect(); sx=e.clientX-r.left; sy=e.clientY-r.top; } });
        canvas.addEventListener('mouseup', (e) => { if(!active && sx) { const r=canvas.getBoundingClientRect(); const scX=canvas.width/r.width, scY=canvas.height/r.height; vx=(sx-(e.clientX-r.left))*scX*0.12; vy=(sy-(e.clientY-r.top))*scY*0.12; active=true; } });
        run();
    `,
    56: `
        const canvas = document.getElementById('gameCanvas_56'); const ctx = canvas.getContext('2d');
        const bank = [{ q: "What is standard corporate GST slab?", a: ["5%", "12%", "18%", "40%"], c: 2 }];
        let score = 0, completed = false;
        function render() {
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(completed) { ctx.fillStyle='#10b981'; ctx.font='32px sans-serif'; ctx.textAlign='center'; ctx.fillText('Correct Answer Logged!', canvas.width/2, 250); return; }
            ctx.fillStyle='#fff'; ctx.font='28px sans-serif'; ctx.textAlign='center'; ctx.fillText(bank[0].q, canvas.width/2, 120);
            for(let i=0; i<4; i++) { ctx.fillStyle='#1e293b'; ctx.fillRect(200, 180+i*70, 400, 50); ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.fillText(bank[0].a[i], 230, 215+i*70); }
        }
        canvas.addEventListener('click', (e) => { const r=canvas.getBoundingClientRect(); const scY=canvas.height/r.height; let y=(e.clientY-r.top)*scY; for(let i=0; i<4; i++) { if(y>=180+i*70 && y<=230+i*70 && i===2) { completed=true; render(); document.getElementById('score').innerText=100; } } });
        render();
    `,
    57: `
        const c=document.getElementById('gameCanvas_57'); const ctx=c.getContext('2d');
        let pos=0;
        function draw(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            for(let i=0;i<100;i++){ 
                let x=(i%10)*50 + 150, y=450-Math.floor(i/10)*45;
                ctx.fillStyle=(i%2===0)?'#1e293b':'#334155'; ctx.fillRect(x,y,48,43);
                if(i===pos){ ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(x+24,y+21,18,0,Math.PI*2); ctx.fill(); }
            }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Roll Dice (Click)', 320, 40);
        }
        c.addEventListener('click',()=>{ pos+=Math.floor(Math.random()*6)+1; if(pos>=99)pos=99; draw(); document.getElementById('score').innerText=pos; }); draw();
    `,
    58: `
        const c=document.getElementById('gameCanvas_58'); const ctx=c.getContext('2d');
        let p=[0,0,0,0];
        function draw(){
            ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#ef4444'; ctx.fillRect(150,50,200,200); ctx.fillStyle='#3b82f6'; ctx.fillRect(450,50,200,200);
            ctx.fillStyle='#facc15'; ctx.fillRect(150,250,200,200); ctx.fillStyle='#22c55e'; ctx.fillRect(450,250,200,200);
            ctx.fillStyle='#000'; ctx.font='24px sans-serif'; ctx.fillText('Click to progress Ludo positions: '+p.join(','), 220, 260);
        }
        c.addEventListener('click',()=>{ p[Math.floor(Math.random()*4)]++; draw(); let s=p.reduce((a,b)=>a+b,0); document.getElementById('score').innerText=s; }); draw();
    `,
    60: `
        const canvas = document.getElementById('gameCanvas_60'); const ctx = canvas.getContext('2d');
        let board = Array(8).fill().map(() => Array(8).fill('')); board[0][4] = '♔'; board[7][3] = '♛';
        function draw() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            for(let r=0; r<8; r++) { for(let c=0; c<8; c++) { ctx.fillStyle=(r+c)%2===0?'#f1f5f9':'#475569'; ctx.fillRect(180+c*55, 30+r*55, 55, 55); if(board[r][c]) { ctx.fillStyle='#000'; ctx.font='36px sans-serif'; ctx.textAlign='center'; ctx.fillText(board[r][c], 180+c*55+27.5, 30+r*55+42); } } }
        }
        canvas.addEventListener('click', () => { board[Math.floor(Math.random()*8)][Math.floor(Math.random()*8)] = '♙'; draw(); });
        draw();
    `,
    64: `
        const c=document.getElementById('gameCanvas_64'); const ctx=c.getContext('2d');
        let cols = Array(10).fill(0).map((_,i)=>Array(Math.floor(Math.random()*5)+1).fill(1));
        function draw(){
            ctx.fillStyle='#064e3b'; ctx.fillRect(0,0,c.width,c.height);
            cols.forEach((col,x)=>{ col.forEach((card,y)=>{ ctx.fillStyle='#fff'; ctx.fillRect(100+x*60, 50+y*30, 50, 70); ctx.strokeRect(100+x*60, 50+y*30, 50, 70); }); });
        }
        c.addEventListener('click',()=>{ cols[Math.floor(Math.random()*10)].push(1); draw(); }); draw();
    `,
    65: `
        const c=document.getElementById('gameCanvas_65'); const ctx=c.getContext('2d');
        let h=['#ef4444','#3b82f6','#facc15','#22c55e']; let hand=[0,1,2,3]; let center=0, score=0;
        function draw(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle=h[center]; ctx.fillRect(320,100,160,200);
            hand.forEach((v,i)=>{ ctx.fillStyle=h[v]; ctx.fillRect(160+i*120, 350, 100, 130); });
        }
        c.addEventListener('click',(e)=>{ const r=c.getBoundingClientRect(); const x=e.clientX-r.left; let idx=Math.floor((x-160)/120); if(idx>=0 && idx<hand.length){ center=hand[idx]; hand.splice(idx,1); hand.push(Math.floor(Math.random()*4)); score++; document.getElementById('score').innerText=score; draw(); } }); draw();
    `,
    67: `
        const canvas = document.getElementById('gameCanvas_67'); const ctx = canvas.getContext('2d');
        let actx = null;
        function play(f) { if(!actx) actx = new(window.AudioContext||window.webkitAudioContext)(); let o=actx.createOscillator(), g=actx.createGain(); o.frequency.value=f; g.gain.setValueAtTime(0.3, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime+0.3); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+0.3); }
        function layout() { ctx.fillStyle='#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height); for(let i=0; i<7; i++) { ctx.fillStyle='#fff'; ctx.fillRect(100+i*85, 100, 75, 300); } }
        canvas.addEventListener('mousedown', (e) => { const r=canvas.getBoundingClientRect(); const scX=canvas.width/r.width; let x=(e.clientX-r.left)*scX; for(let i=0; i<7; i++) { if(x>=100+i*85 && x<=175+i*85) play(261.63 + i*30); } });
        layout();
    `,
    68: `
        const c=document.getElementById('gameCanvas_68'); const ctx=c.getContext('2d');
        let actx=null, score=0;
        function play(){ if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)(); let o=actx.createOscillator(); o.connect(actx.destination); o.frequency.value=400+Math.random()*400; o.start(); o.stop(actx.currentTime+0.5); }
        function draw(){ ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height); ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Click to play audio snippet.', 250,250); }
        c.addEventListener('click',()=>{ play(); score+=10; document.getElementById('score').innerText=score; draw(); }); draw();
    `,
    69: `
        const c=document.getElementById('gameCanvas_69'); const ctx=c.getContext('2d');
        let pos=0, curve=0, playerX=400, score=0;
        function loop(){
            pos+=5; score++; document.getElementById('score').innerText=Math.floor(score/10); curve=Math.sin(pos*0.01)*200;
            ctx.fillStyle='#84cc16'; ctx.fillRect(0,0,c.width,c.height);
            for(let y=200;y<500;y+=15){ let w=(y-200)*2.5+100; let cx=400+(y-200)*0.005*curve; ctx.fillStyle=(y+pos)%60<30?'#334155':'#475569'; ctx.fillRect(cx-w/2,y,w,15); }
            ctx.fillStyle='#ef4444'; ctx.fillRect(playerX-30,420,60,40);
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{if(e.key==='ArrowLeft')playerX-=20;if(e.key==='ArrowRight')playerX+=20;}); loop();
    `,
    71: `
        const canvas = document.getElementById('gameCanvas_71'); const ctx = canvas.getContext('2d');
        let list = [], score = 0;
        class Item { constructor(x) { this.x=x; this.y=50; this.r=30; this.vy=3; } update() { this.y+=this.vy; if(this.y>canvas.height-this.r) { this.y=canvas.height-this.r; this.vy=0; } } }
        function step() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            list.forEach(f => { f.update(); ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.fillStyle='#e11d48'; ctx.fill(); });
            for(let i=0; i<list.length; i++) { for(let j=i+1; j<list.length; j++) { if(Math.hypot(list[i].x-list[j].x, list[i].y-list[j].y) < 60) { list.splice(j,1); list[i].r=45; score+=10; document.getElementById('score').innerText=score; } } }
            requestAnimationFrame(step);
        }
        canvas.addEventListener('click', (e) => { const r=canvas.getBoundingClientRect(); const scX=canvas.width/r.width; list.push(new Item((e.clientX-r.left)*scX)); });
        step();
    `,
    79: `
        const canvas = document.getElementById('gameCanvas_79'); const ctx = canvas.getContext('2d');
        const bank = [{ q: "What is standard corporate GST slab?", a: ["5%", "12%", "18%", "40%"], c: 2 }];
        let score = 0, completed = false;
        function render() {
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(completed) { ctx.fillStyle='#10b981'; ctx.font='32px sans-serif'; ctx.textAlign='center'; ctx.fillText('Correct Answer Logged!', canvas.width/2, 250); return; }
            ctx.fillStyle='#fff'; ctx.font='28px sans-serif'; ctx.textAlign='center'; ctx.fillText(bank[0].q, canvas.width/2, 120);
            for(let i=0; i<4; i++) { ctx.fillStyle='#1e293b'; ctx.fillRect(200, 180+i*70, 400, 50); ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.fillText(bank[0].a[i], 230, 215+i*70); }
        }
        canvas.addEventListener('click', (e) => { const r=canvas.getBoundingClientRect(); const scY=canvas.height/r.height; let y=(e.clientY-r.top)*scY; for(let i=0; i<4; i++) { if(y>=180+i*70 && y<=230+i*70 && i===2) { completed=true; render(); document.getElementById('score').innerText=100; } } });
        render();
    `
};

function generateMicroEngine(id, title) {
    if (microEngines[id]) return microEngines[id];

    let engineType = id % 4; 
    if (engineType === 0) {
        return `
        const c=document.getElementById('gameCanvas_${id}'); const ctx=c.getContext('2d');
        let p=[]; let score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            if(Math.random()<0.4) p.push({x:Math.random()*c.width, y:0, vy:0});
            ctx.fillStyle='#3b82f6';
            for(let i=p.length-1;i>=0;i--){ p[i].vy+=0.6; p[i].y+=p[i].vy; ctx.beginPath(); ctx.arc(p[i].x,p[i].y,8,0,Math.PI*2); ctx.fill(); if(p[i].y>c.height){ p.splice(i,1); score++; document.getElementById('score').innerText=score; } }
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('${title} - Fluid Simulator',20,40); requestAnimationFrame(loop);
        } loop();`;
    } else if (engineType === 1) {
        return `
        const c=document.getElementById('gameCanvas_${id}'); const ctx=c.getContext('2d');
        let px=100, py=400, vy=0, plat=[{x:0,w:800,y:480},{x:300,w:200,y:380},{x:550,w:150,y:280}], score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            vy+=0.7; py+=vy; let g=false;
            plat.forEach(pl=>{ ctx.fillStyle='#22c55e'; ctx.fillRect(pl.x,pl.y,pl.w,20); if(py>pl.y-30 && py<pl.y && px>pl.x && px<pl.x+pl.w && vy>0){ vy=0; py=pl.y-30; g=true; } });
            if(py>c.height) { py=0; px=100; score=0; }
            ctx.fillStyle='#ef4444'; ctx.fillRect(px,py,30,30);
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('${title} - Platformer',20,40); requestAnimationFrame(loop);
        } 
        window.addEventListener('keydown',(e)=>{if(e.key==='ArrowRight'){px+=7; score++;} if(e.key==='ArrowLeft')px-=7; if(e.key===' '&&vy===0)vy=-15; document.getElementById('score').innerText=score;}); loop();`;
    } else if (engineType === 2) {
        return `
        const c=document.getElementById('gameCanvas_${id}'); const ctx=c.getContext('2d');
        let grid=Array(32).fill(0), s=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            if(Math.random()<0.08) grid[Math.floor(Math.random()*32)]=80;
            grid.forEach((v,i)=>{ if(v>0){ ctx.fillStyle='hsl('+(v*4)+',100%,50%)'; ctx.fillRect((i%8)*100, Math.floor(i/8)*125, 95, 120); grid[i]--; } });
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('${title} - Rhythm Score: '+s,20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('click',(e)=>{ const r=c.getBoundingClientRect(); const idx=Math.floor(((e.clientX-r.left)/(r.width/8))) + Math.floor(((e.clientY-r.top)/(r.height/4)))*8; if(grid[idx]>0){grid[idx]=0;s+=10; document.getElementById('score').innerText=s;} }); loop();`;
    } else {
        return `
        const c=document.getElementById('gameCanvas_${id}'); const ctx=c.getContext('2d');
        let b=[]; let s=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            if(Math.random()<0.08) b.push({x:Math.random()*c.width, y:c.height, r:20+Math.random()*30, c:'#'+Math.floor(Math.random()*16777215).toString(16)});
            for(let i=b.length-1;i>=0;i--){ b[i].y-=3; ctx.fillStyle=b[i].c; ctx.beginPath(); ctx.arc(b[i].x,b[i].y,b[i].r,0,Math.PI*2); ctx.fill(); if(b[i].y<-50)b.splice(i,1); }
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('${title} - Pop Score: '+s,20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('click',(e)=>{ const r=c.getBoundingClientRect(); const x=(e.clientX-r.left)*(c.width/r.width), y=(e.clientY-r.top)*(c.height/r.height); for(let i=b.length-1;i>=0;i--){ if(Math.hypot(b[i].x-x,b[i].y-y)<b[i].r){ b.splice(i,1); s+=10; document.getElementById('score').innerText=s; break; } } }); loop();`;
    }
}

function getInstructionText(id, title) {
    if (instructions[id]) return instructions[id];
    let type = id % 4;
    if (type === 0) return "Watch the fluid dynamics. Elements fall continuously.";
    if (type === 1) return "Use Left/Right arrows to move, Space to jump.";
    if (type === 2) return "Click the colored tiles before they disappear to score.";
    return "Click the bubbles to pop them before they float away.";
}

for (let i = 51; i <= 100; i++) {
    const fileLoc = path.join(targetDir, `game${i}`, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');

        // Robust viewport rewrite: Find the end of game-header and the end of game-container
        const restartBtnIdx = text.indexOf('id="restartBtn"');
        if (restartBtnIdx !== -1) {
            const headerEndIdx = text.indexOf('</div>', restartBtnIdx) + 6;
            
            // Find the boundary of the game-container (it ends before adsense-side-rail)
            let sideRailIdx = text.indexOf('<div class="adsense-side-rail');
            if (sideRailIdx === -1) sideRailIdx = text.indexOf('<div class="adsense-seo-block'); // fallback
            
            if (headerEndIdx !== -1 && sideRailIdx !== -1) {
                // We find the </div> that closes the game container, which is usually right before sideRailIdx
                const containerEndIdx = text.lastIndexOf('</div>', sideRailIdx - 1);
                
                if (containerEndIdx > headerEndIdx) {
                    const cleanCanvasBlock = `
    <div class="w-full flex justify-center mb-6 mt-4">
      <canvas id="gameCanvas_${i}" width="800" height="500" class="w-full max-w-full bg-[#131a26] rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 touch-none select-none block"></canvas>
    </div>

    <p class="text-center text-gray-300 mt-2 font-medium text-lg px-4">
      ${getInstructionText(i, titles[i])}
    </p>
  `;
                    text = text.substring(0, headerEndIdx) + 'n' + cleanCanvasBlock + text.substring(containerEndIdx);
                }
            }
        }

        const scriptMarker = '<script>';
        const closingMarker = '</script>';
        const startIdx = text.lastIndexOf(scriptMarker);
        const endIdx = text.lastIndexOf(closingMarker);

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const enginePayload = generateMicroEngine(i, titles[i] || `Game ${i}`);
            
            // Ensure UTF-8 without BOM encoding via meta tag
            text = text.replace(/<meta charset="[^"]*">/gi, '');
            const headIdx = text.indexOf('<head>');
            if (headIdx !== -1) {
                text = text.substring(0, headIdx + 6) + 'n  <meta charset="UTF-8">' + text.substring(headIdx + 6);
            }
            
            const newStartIdx = text.lastIndexOf(scriptMarker);
            const newEndIdx = text.lastIndexOf(closingMarker);
            
            const rewrittenContent = text.substring(0, newStartIdx) + scriptMarker + 'n' + enginePayload + 'n  ' + closingMarker + text.substring(newEndIdx + closingMarker.length);
            fs.writeFileSync(fileLoc, rewrittenContent, { encoding: 'utf8' });
            console.log(`[Antigravity Automation]: Purged legacy layout and deployed clean 800x500 viewport engine for ${titles[i]} at games/game${i}/index.html`);
        }
    }
}
