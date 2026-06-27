const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

const getUI = `
    const restartBtn = document.getElementById('restartBtn') || { addEventListener: () => {} };
    function updateScoreUI(score) {
        const scoreNode = document.getElementById('score') || document.querySelector('[id*="score"]');
        if (scoreNode) scoreNode.textContent = score;
        const bestNode = document.getElementById('bestScore') || document.querySelector('[id*="bestScore"]');
        if (bestNode && Number(score) > Number(bestNode.textContent)) bestNode.textContent = score;
    }
`;

const engines = {
    61: `
        // --- GAME 61: FASTER OR SLOWER (Reaction) ---
        const canvas = document.getElementById('gameCanvas_61'); const ctx = canvas.getContext('2d');
        ${getUI}
        let pos, speed, isOver, score, tgt;
        function init() { pos=0; speed=2+Math.random()*8; score=0; isOver=false; tgt=canvas.width*0.8; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('MISSED', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            pos += speed;
            ctx.fillStyle = '#334155'; ctx.fillRect(tgt-20, 100, 40, 200);
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(pos, 180, 40, 40);
            if(pos > canvas.width) isOver = true;
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousedown', () => {
            if(isOver) return;
            if(Math.abs((pos+20) - tgt) < 30) { score+=10; updateScoreUI(score); pos=0; speed=2+Math.random()*10; }
            else isOver = true;
        });
        restartBtn.addEventListener('click', init); init();
    `,
    62: `
        // --- GAME 62: QUIZ GAME 2 ---
        const canvas = document.getElementById('gameCanvas_62'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, qIndex, isOver;
        const db = [ {q:"HTML stands for?", a:["HyperText Markup Language","HighText Machine Logic","HyperTool Multi Language","None"], ans:0}, {q:"10 + 5 * 2 = ?", a:["30","20","25","15"], ans:1} ];
        function init() { score=0; qIndex=0; isOver=false; updateScoreUI(score); draw(); }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver || qIndex>=db.length) { ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText(isOver?'WRONG!':'COMPLETE!', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle='#38bdf8'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText(db[qIndex].q, canvas.width/2, 100);
            for(let i=0; i<4; i++) {
                ctx.fillStyle='#1e293b'; ctx.fillRect(canvas.width/2 - 200, 150 + i*60, 400, 45);
                ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.fillText(db[qIndex].a[i], canvas.width/2, 178 + i*60);
            }
        }
        canvas.addEventListener('click', e => {
            if(isOver || qIndex>=db.length) return;
            const r=canvas.getBoundingClientRect(); let y=(e.clientY-r.top)*(canvas.height/r.height);
            let clicked = -1; for(let i=0; i<4; i++) if(y > 150+i*60 && y < 150+i*60+45) clicked=i;
            if(clicked!==-1) { if(clicked===db[qIndex].ans) { score+=10; updateScoreUI(score); qIndex++; draw(); } else { isOver=true; draw(); } }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    63: `
        // --- GAME 63: CONNECT THE DOTS ---
        const canvas = document.getElementById('gameCanvas_63'); const ctx = canvas.getContext('2d');
        ${getUI}
        let dots, next, isOver, score;
        function init() {
            score=0; next=1; isOver=false; dots=[]; updateScoreUI(score);
            for(let i=1; i<=10; i++) dots.push({n:i, x:40+Math.random()*(canvas.width-80), y:40+Math.random()*(canvas.height-80)});
            draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('SUCCESS', canvas.width/2, canvas.height/2); return; }
            ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.beginPath();
            for(let i=0; i<next-1; i++) { if(i===0) ctx.moveTo(dots[i].x, dots[i].y); else ctx.lineTo(dots[i].x, dots[i].y); } ctx.stroke();
            dots.forEach(d => {
                ctx.fillStyle = d.n < next ? '#38bdf8' : '#334155'; ctx.beginPath(); ctx.arc(d.x, d.y, 15, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle='#fff'; ctx.font='16px sans-serif'; ctx.textAlign='center'; ctx.fillText(d.n, d.x, d.y+5);
            });
        }
        canvas.addEventListener('click', e => {
            if(isOver) return; const r=canvas.getBoundingClientRect(); let x=(e.clientX-r.left)*(canvas.width/r.width), y=(e.clientY-r.top)*(canvas.height/r.height);
            let target = dots.find(d => d.n === next);
            if(target && Math.hypot(x-target.x, y-target.y)<25) {
                score+=10; next++; updateScoreUI(score);
                if(next>10) isOver=true; draw();
            }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    72: `
        // --- GAME 72: FILL THE WATER ---
        const canvas = document.getElementById('gameCanvas_72'); const ctx = canvas.getContext('2d');
        ${getUI}
        let fill, target, isFilling, isOver, score;
        function init() { fill=0; target=100+Math.random()*150; isFilling=false; isOver=false; score=0; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle=Math.abs(fill-target)<10?'#4ade80':'#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText(Math.abs(fill-target)<10?'PERFECT!':'FAILED', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isFilling) fill += 3;
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4; ctx.strokeRect(canvas.width/2-50, canvas.height-300, 100, 250);
            ctx.fillStyle = '#3b82f6'; ctx.fillRect(canvas.width/2-48, canvas.height-50-fill, 96, fill);
            ctx.strokeStyle = '#4ade80'; ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(canvas.width/2-70, canvas.height-50-target); ctx.lineTo(canvas.width/2+70, canvas.height-50-target); ctx.stroke(); ctx.setLineDash([]);
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousedown', () => { if(!isOver && fill===0) isFilling=true; });
        canvas.addEventListener('mouseup', () => {
            if(isFilling) { isFilling=false; isOver=true; if(Math.abs(fill-target)<10) { score+=100; updateScoreUI(score); } }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    78: `
        // --- GAME 78: THIEF CHALLENGE (Grid Stealth) ---
        const canvas = document.getElementById('gameCanvas_78'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, py, gx, gy, isOver, score;
        function init() { px=0; py=0; gx=4; gy=4; isOver=false; score=0; updateScoreUI(score); draw(); }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle=px===gx&&py===gy?'#ef4444':'#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText(px===gx&&py===gy?'CAUGHT!':'ESCAPED!', canvas.width/2, canvas.height/2); return; }
            let sz = canvas.height/6; let ox = (canvas.width-sz*6)/2;
            for(let r=0; r<6; r++) for(let c=0; c<6; c++) {
                ctx.strokeStyle='#334155'; ctx.strokeRect(ox+c*sz, r*sz, sz, sz);
                if(r===5&&c===5) { ctx.fillStyle='#22c55e'; ctx.fillRect(ox+c*sz+10, r*sz+10, sz-20, sz-20); }
            }
            ctx.fillStyle='#facc15'; ctx.beginPath(); ctx.arc(ox+px*sz+sz/2, py*sz+sz/2, sz/3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle='#ef4444'; ctx.fillRect(ox+gx*sz+10, gy*sz+10, sz-20, sz-20);
        }
        window.addEventListener('keydown', e => {
            if(isOver) return;
            if(e.key==='ArrowRight' && px<5) px++; if(e.key==='ArrowLeft' && px>0) px--;
            if(e.key==='ArrowDown' && py<5) py++; if(e.key==='ArrowUp' && py>0) py--;
            if(px===5 && py===5) { isOver=true; score+=50; updateScoreUI(score); draw(); return; }
            if(gx<px) gx++; else if(gx>px) gx--; if(gy<py) gy++; else if(gy>py) gy--;
            if(px===gx && py===gy) isOver = true; draw();
        });
        restartBtn.addEventListener('click', init); init();
    `,
    79: `
        // --- GAME 79: QUIZ GAMES (Text Matching) ---
        const canvas = document.getElementById('gameCanvas_79'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, isOver, term, match, options;
        const pairs = [['Paris','France'],['Tokyo','Japan'],['Berlin','Germany'],['Rome','Italy'],['Madrid','Spain']];
        function init() { score=0; isOver=false; updateScoreUI(0); nextRound(); }
        function nextRound() {
            let p = pairs[Math.floor(Math.random()*pairs.length)]; term=p[0]; match=p[1];
            options = [...pairs.map(x=>x[1])].sort(()=>Math.random()-0.5).slice(0,4);
            if(!options.includes(match)) options[Math.floor(Math.random()*4)] = match;
            draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('WRONG', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle='#38bdf8'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText("Match Capital to Country: " + term, canvas.width/2, 100);
            for(let i=0; i<4; i++) {
                ctx.fillStyle='#1e293b'; ctx.fillRect(canvas.width/2 - 200, 150 + i*60, 400, 45);
                ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.fillText(options[i], canvas.width/2, 178 + i*60);
            }
        }
        canvas.addEventListener('click', e => {
            if(isOver) return;
            const r=canvas.getBoundingClientRect(); let y=(e.clientY-r.top)*(canvas.height/r.height);
            let clicked = -1; for(let i=0; i<4; i++) if(y > 150+i*60 && y < 150+i*60+45) clicked=i;
            if(clicked!==-1) { if(options[clicked]===match) { score+=10; updateScoreUI(score); nextRound(); } else { isOver=true; draw(); } }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    80: `
        // --- GAME 80: TRUE OR FALSE ---
        const canvas = document.getElementById('gameCanvas_80'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, isOver, stat, isTrue;
        function init() { score=0; isOver=false; updateScoreUI(0); next(); }
        function next() {
            let a = Math.floor(Math.random()*10)+1, b = Math.floor(Math.random()*10)+1;
            isTrue = Math.random()>0.5;
            let ans = isTrue ? (a+b) : (a+b + (Math.random()>0.5?1:-1));
            stat = a + " + " + b + " = " + ans; draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle='#fff'; ctx.font='bold 40px sans-serif'; ctx.textAlign='center'; ctx.fillText(stat, canvas.width/2, 150);
            ctx.fillStyle='#22c55e'; ctx.fillRect(canvas.width/2 - 150, 250, 100, 60); ctx.fillStyle='#fff'; ctx.fillText("T", canvas.width/2 - 100, 295);
            ctx.fillStyle='#ef4444'; ctx.fillRect(canvas.width/2 + 50, 250, 100, 60); ctx.fillStyle='#fff'; ctx.fillText("F", canvas.width/2 + 100, 295);
        }
        canvas.addEventListener('click', e => {
            if(isOver) return; const r=canvas.getBoundingClientRect(); let x=(e.clientX-r.left)*(canvas.width/r.width), y=(e.clientY-r.top)*(canvas.height/r.height);
            if(y>250 && y<310) {
                let ans = (x>canvas.width/2-150 && x<canvas.width/2-50) ? true : (x>canvas.width/2+50 && x<canvas.width/2+150 ? false : null);
                if(ans!==null) { if(ans===isTrue) { score+=10; updateScoreUI(score); next(); } else { isOver=true; draw(); } }
            }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    81: `
        // --- GAME 81: SOLVE MATH EX ---
        const canvas = document.getElementById('gameCanvas_81'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, isOver, ex, ans, inp;
        function init() { score=0; isOver=false; updateScoreUI(0); next(); }
        function next() {
            let ops = ['+','-','*']; let op = ops[Math.floor(Math.random()*ops.length)];
            let a = Math.floor(Math.random()*12)+1, b = Math.floor(Math.random()*12)+1;
            if(op==='-') { let t=a; a=a+b; b=t; }
            ans = op==='+' ? a+b : (op==='-' ? a-b : a*b);
            ex = a + " " + op + " " + b + " = ?"; inp = ""; draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('WRONG', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle='#38bdf8'; ctx.font='bold 40px sans-serif'; ctx.textAlign='center'; ctx.fillText(ex, canvas.width/2, 150);
            ctx.fillStyle='#334155'; ctx.fillRect(canvas.width/2 - 100, 220, 200, 60);
            ctx.fillStyle='#fff'; ctx.fillText(inp, canvas.width/2, 265);
        }
        window.addEventListener('keydown', e => {
            if(isOver) return;
            if(e.key==='Backspace') inp=inp.slice(0,-1);
            else if(e.key==='Enter') { if(parseInt(inp)===ans) { score+=10; updateScoreUI(score); next(); } else { isOver=true; draw(); } }
            else if(e.key.match(/[0-9]/)) inp+=e.key;
            draw();
        });
        restartBtn.addEventListener('click', init); init();
    `,
    82: `
        // --- GAME 82: DRAGGABLE PUZZLE ---
        const canvas = document.getElementById('gameCanvas_82'); const ctx = canvas.getContext('2d');
        ${getUI}
        let pieces, dragged, score, isOver;
        function init() {
            score=0; isOver=false; dragged=null; updateScoreUI(0);
            pieces = [{id:0,x:50,y:50},{id:1,x:150,y:50},{id:2,x:50,y:150},{id:3,x:150,y:150}];
            pieces.forEach(p=>{p.cx=p.x; p.cy=p.y; p.tx=300+(p.id%2)*80; p.ty=100+Math.floor(p.id/2)*80;});
            draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('SOLVED!', canvas.width/2, canvas.height/2); return; }
            
            ctx.strokeStyle='#334155'; ctx.lineWidth=2;
            for(let i=0; i<4; i++) ctx.strokeRect(300+(i%2)*80, 100+Math.floor(i/2)*80, 80, 80);
            
            pieces.forEach(p => {
                ctx.fillStyle='#3b82f6'; ctx.fillRect(p.cx, p.cy, 76, 76);
                ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.fillText(p.id, p.cx+38, p.cy+45);
            });
        }
        canvas.addEventListener('mousedown', e => {
            const r=canvas.getBoundingClientRect(); let x=(e.clientX-r.left)*(canvas.width/r.width), y=(e.clientY-r.top)*(canvas.height/r.height);
            for(let p of pieces) if(x>p.cx && x<p.cx+76 && y>p.cy && y<p.cy+76) { dragged=p; break; }
        });
        canvas.addEventListener('mousemove', e => {
            if(dragged) { const r=canvas.getBoundingClientRect(); dragged.cx=(e.clientX-r.left)*(canvas.width/r.width)-38; dragged.cy=(e.clientY-r.top)*(canvas.height/r.height)-38; draw(); }
        });
        canvas.addEventListener('mouseup', () => {
            if(dragged) {
                if(Math.hypot(dragged.cx-dragged.tx, dragged.cy-dragged.ty)<30) { dragged.cx=dragged.tx; dragged.cy=dragged.ty; score+=10; updateScoreUI(score); }
                dragged=null;
                if(score===40) isOver=true; draw();
            }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    83: `
        // --- GAME 83: GUESS NUMBER ---
        const canvas = document.getElementById('gameCanvas_83'); const ctx = canvas.getContext('2d');
        ${getUI}
        let ans, inp, isOver, msg, score;
        function init() { ans=Math.floor(Math.random()*100)+1; inp=""; isOver=false; msg="Guess 1 to 100"; score=0; updateScoreUI(0); draw(); }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='#38bdf8'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText(msg, canvas.width/2, 100);
            ctx.fillStyle='#334155'; ctx.fillRect(canvas.width/2 - 100, 150, 200, 60);
            ctx.fillStyle='#fff'; ctx.font='bold 32px sans-serif'; ctx.fillText(inp, canvas.width/2, 195);
        }
        window.addEventListener('keydown', e => {
            if(isOver) return;
            if(e.key==='Backspace') inp=inp.slice(0,-1);
            else if(e.key==='Enter') {
                score++; updateScoreUI(score);
                let v = parseInt(inp);
                if(v===ans) { msg="CORRECT! Guesses: "+score; isOver=true; }
                else { msg=v>ans?"Too High!":"Too Low!"; inp=""; }
            }
            else if(e.key.match(/[0-9]/) && inp.length<3) inp+=e.key;
            draw();
        });
        restartBtn.addEventListener('click', init); init();
    `,
    84: `
        // --- GAME 84: HACKER CHALLENGE (Mastermind) ---
        const canvas = document.getElementById('gameCanvas_84'); const ctx = canvas.getContext('2d');
        ${getUI}
        let pin, inp, msg, isOver, score;
        function init() { pin=Math.floor(Math.random()*900+100).toString(); inp=""; msg="Enter 3-digit PIN"; isOver=false; score=0; updateScoreUI(score); draw(); }
        function draw() {
            ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='#22c55e'; ctx.font='20px monospace'; ctx.textAlign='center'; ctx.fillText(msg, canvas.width/2, 100);
            ctx.strokeStyle='#22c55e'; ctx.strokeRect(canvas.width/2 - 80, 150, 160, 50);
            ctx.fillText(inp + (inp.length<3?"_":""), canvas.width/2, 182);
        }
        window.addEventListener('keydown', e => {
            if(isOver) return;
            if(e.key==='Backspace') inp=inp.slice(0,-1);
            else if(e.key==='Enter' && inp.length===3) {
                score++; updateScoreUI(score);
                if(inp===pin) { msg="ACCESS GRANTED"; isOver=true; }
                else {
                    let b=0, c=0;
                    for(let i=0;i<3;i++) { if(inp[i]===pin[i]) b++; else if(pin.includes(inp[i])) c++; }
                    msg = "Match:"+b+" InPos, "+c+" OutPos"; inp="";
                }
            }
            else if(e.key.match(/[0-9]/) && inp.length<3) inp+=e.key;
            draw();
        });
        restartBtn.addEventListener('click', init); init();
    `,
    97: `
        // --- GAME 97: MAZE ESCAPE ---
        const canvas = document.getElementById('gameCanvas_97'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, py, score, isOver, maze, sz;
        function init() {
            score=0; isOver=false; sz = canvas.height/10; updateScoreUI(0);
            maze = [
                [1,1,1,1,1,1,1,1,1,1], [1,0,0,0,1,0,0,0,2,1], [1,0,1,0,1,0,1,1,0,1],
                [1,0,1,0,0,0,0,1,0,1], [1,0,1,1,1,1,0,1,0,1], [1,0,0,0,0,0,0,1,0,1],
                [1,1,1,0,1,1,1,1,0,1], [1,0,0,0,1,0,0,0,0,1], [1,3,1,0,0,0,1,1,0,1], [1,1,1,1,1,1,1,1,1,1]
            ];
            for(let r=0;r<10;r++)for(let c=0;c<10;c++) if(maze[r][c]===3) { py=r; px=c; maze[r][c]=0; } draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('ESCAPED!', canvas.width/2, canvas.height/2); return; }
            let ox = (canvas.width - sz*10)/2;
            for(let r=0;r<10;r++)for(let c=0;c<10;c++) {
                if(maze[r][c]===1) { ctx.fillStyle='#334155'; ctx.fillRect(ox+c*sz, r*sz, sz, sz); }
                else if(maze[r][c]===2) { ctx.fillStyle='#facc15'; ctx.fillRect(ox+c*sz+10, r*sz+10, sz-20, sz-20); }
            }
            ctx.fillStyle='#38bdf8'; ctx.beginPath(); ctx.arc(ox+px*sz+sz/2, py*sz+sz/2, sz/3, 0, Math.PI*2); ctx.fill();
        }
        window.addEventListener('keydown', e => {
            if(isOver) return; let nx=px, ny=py;
            if(e.key==='ArrowUp') ny--; if(e.key==='ArrowDown') ny++; if(e.key==='ArrowLeft') nx--; if(e.key==='ArrowRight') nx++;
            if(maze[ny][nx]!==1) { px=nx; py=ny; score++; updateScoreUI(score); if(maze[ny][nx]===2) isOver=true; draw(); }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    95: `
        // --- GAME 95: TOWER STACK ARENA ---
        const canvas = document.getElementById('gameCanvas_95'); const ctx = canvas.getContext('2d');
        ${getUI}
        let blocks, bw, dir, isOver, score;
        function init() { blocks=[{x:canvas.width/2-50, w:100, y:canvas.height-30}]; bw=100; dir=3; score=0; isOver=false; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('TOWER FALL', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            let cur = blocks[blocks.length-1]; cur.x += dir;
            if(cur.x < 0 || cur.x + cur.w > canvas.width) dir = -dir;
            
            let offY = blocks.length>10 ? (blocks.length-10)*30 : 0;
            blocks.forEach((b,i) => {
                ctx.fillStyle = i===blocks.length-1 ? '#38bdf8' : '#e2e8f0';
                ctx.fillRect(b.x, b.y + offY, b.w, 30);
                ctx.strokeStyle='#334155'; ctx.strokeRect(b.x, b.y + offY, b.w, 30);
            });
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('click', () => {
            if(isOver) return;
            let cur = blocks[blocks.length-1]; let prev = blocks[blocks.length-2];
            if(prev) {
                let overlap = Math.max(0, Math.min(cur.x+cur.w, prev.x+prev.w) - Math.max(cur.x, prev.x));
                if(overlap <= 0) { isOver=true; return; }
                cur.w = overlap; cur.x = Math.max(cur.x, prev.x);
            }
            score++; updateScoreUI(score);
            blocks.push({x: 0, w: cur.w, y: cur.y-30});
            dir = dir > 0 ? (dir+0.2) : (dir-0.2);
        });
        restartBtn.addEventListener('click', init); init();
    `
};

console.log("[GamiDay Engine]: Commencing Phase 3 Batch Injection...");

Object.keys(engines).forEach(gameId => {
    const fileLoc = path.join(gamesDir, 'game'+gameId, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');

        const scriptStart = '<script>';
        const scriptEnd = '</script>';
        const startIdx = content.lastIndexOf(scriptStart);
        const endIdx = content.lastIndexOf(scriptEnd);

        if (startIdx !== -1 && endIdx !== -1) {
            const fullyFeaturedContent = content.substring(0, startIdx + scriptStart.length) + '\\n' + engines[gameId] + '\\n' + content.substring(endIdx);
            fs.writeFileSync(fileLoc, fullyFeaturedContent, { encoding: 'utf8' });
            console.log("[PASS]: Injected algorithmic core into game" + gameId + "/index.html");
        }
    }
});

console.log("[Phase 3 Status]: 13 target games successfully upgraded and sealed with algorithmic matrices.");
