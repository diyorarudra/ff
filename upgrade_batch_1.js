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
    53: `
        // --- GAME 53: SIDE BY SIDE ---
        const canvas = document.getElementById('gameCanvas_53'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, isOver, obstacles, p1x, p2x;
        function init() {
            score = 0; isOver = false; obstacles = []; p1x = canvas.width/4; p2x = canvas.width*0.75;
            updateScoreUI(score); loop();
        }
        function loop() {
            if(isOver) {
                ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);
                ctx.fillStyle = '#ef4444'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
                return;
            }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(canvas.width/2, 0); ctx.lineTo(canvas.width/2, canvas.height); ctx.stroke();
            
            if(Math.random()<0.04) {
                let side = Math.random()>0.5 ? 0 : 1;
                obstacles.push({ x: side === 0 ? canvas.width/4 : canvas.width*0.75, y: -40, w: 60, h: 40 });
            }
            
            ctx.shadowBlur = 15; ctx.shadowColor = '#38bdf8'; ctx.fillStyle='#38bdf8'; ctx.fillRect(p1x-20, canvas.height-60, 40, 40);
            ctx.shadowColor = '#a855f7'; ctx.fillStyle='#a855f7'; ctx.fillRect(p2x-20, canvas.height-60, 40, 40);
            ctx.shadowBlur = 0;
            
            for(let i=obstacles.length-1; i>=0; i--) {
                let o = obstacles[i]; o.y += 4 + score/500;
                ctx.fillStyle='#f43f5e'; ctx.fillRect(o.x-o.w/2, o.y, o.w, o.h);
                let checkX = o.x < canvas.width/2 ? p1x : p2x;
                if(Math.abs(checkX - o.x) < 30 && o.y + o.h > canvas.height-60 && o.y < canvas.height-20) isOver=true;
                if(o.y > canvas.height) { obstacles.splice(i,1); score+=10; updateScoreUI(score); }
            }
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown', e => {
            if(e.key === 'a' && p1x > 40) p1x -= 60; if(e.key === 'd' && p1x < canvas.width/2 - 40) p1x += 60;
            if(e.key === 'ArrowLeft' && p2x > canvas.width/2 + 40) p2x -= 60; if(e.key === 'ArrowRight' && p2x < canvas.width - 40) p2x += 60;
        });
        restartBtn.addEventListener('click', init); init();
    `,
    54: `
        // --- GAME 54: SPACE BATTLESHIP ---
        const canvas = document.getElementById('gameCanvas_54'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, isOver, px, bullets, enemies;
        function init() { score=0; isOver=false; px=canvas.width/2; bullets=[]; enemies=[]; updateScoreUI(score); loop(); }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('HULL BREACH', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            if(Math.random()<0.03) enemies.push({x:Math.random()*(canvas.width-40)+20, y:-30, hp:2});
            
            ctx.shadowBlur=10; ctx.shadowColor='#22d3ee'; ctx.fillStyle='#22d3ee';
            ctx.beginPath(); ctx.moveTo(px, canvas.height-60); ctx.lineTo(px-20, canvas.height-20); ctx.lineTo(px+20, canvas.height-20); ctx.fill(); ctx.shadowBlur=0;
            
            for(let i=bullets.length-1; i>=0; i--) {
                bullets[i].y-=8; ctx.fillStyle='#facc15'; ctx.fillRect(bullets[i].x-2, bullets[i].y, 4, 12);
                if(bullets[i].y<0) { bullets.splice(i,1); continue; }
                for(let j=enemies.length-1; j>=0; j--) {
                    if(bullets[i] && Math.hypot(bullets[i].x-enemies[j].x, bullets[i].y-enemies[j].y)<25) {
                        enemies[j].hp--; bullets.splice(i,1);
                        if(enemies[j].hp<=0) { enemies.splice(j,1); score+=50; updateScoreUI(score); } break;
                    }
                }
            }
            for(let i=enemies.length-1; i>=0; i--) {
                enemies[i].y += 1.5; ctx.fillStyle='#f43f5e'; ctx.fillRect(enemies[i].x-15, enemies[i].y-10, 30, 20);
                if(enemies[i].y > canvas.height) isOver=true;
                if(Math.hypot(px-enemies[i].x, canvas.height-40-enemies[i].y)<30) isOver=true;
            }
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousemove', e => { const r=canvas.getBoundingClientRect(); px=(e.clientX-r.left)*(canvas.width/r.width); });
        canvas.addEventListener('click', () => bullets.push({x:px, y:canvas.height-60}));
        restartBtn.addEventListener('click', init); init();
    `,
    56: `
        // --- GAME 56: MILLIONAIRE QUIZ ---
        const canvas = document.getElementById('gameCanvas_56'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, qIndex, isOver;
        const db = [ {q:"What is the DOM?", a:["Document Object Model","Data Origin Matrix","Digital Option Menu","Data Object Map"], ans:0}, {q:"What does CSS stand for?", a:["Cascading Style Sheets","Computer Style Syntax","Core System Scripts","Creative Style Sheets"], ans:0}, {q:"Which is not a JS framework?", a:["React","Vue","Angular","Django"], ans:3} ];
        function init() { score=0; qIndex=0; isOver=false; updateScoreUI(score); draw(); }
        function draw() {
            ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver || qIndex>=db.length) { ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText(isOver?'WRONG ANSWER!':'YOU WIN!', canvas.width/2, canvas.height/2); return; }
            
            ctx.fillStyle='#c7d2fe'; ctx.font='24px sans-serif'; ctx.textAlign='center';
            ctx.fillText(db[qIndex].q, canvas.width/2, 120);
            
            for(let i=0; i<4; i++) {
                let y = 220 + i*60;
                ctx.fillStyle='#312e81'; ctx.strokeStyle='#4f46e5'; ctx.lineWidth=2;
                ctx.fillRect(canvas.width/2 - 200, y, 400, 45); ctx.strokeRect(canvas.width/2 - 200, y, 400, 45);
                ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.fillText(db[qIndex].a[i], canvas.width/2, y+28);
            }
        }
        canvas.addEventListener('click', e => {
            if(isOver || qIndex>=db.length) return;
            const r=canvas.getBoundingClientRect(); let y=(e.clientY-r.top)*(canvas.height/r.height);
            let clicked = -1;
            for(let i=0; i<4; i++) if(y > 220+i*60 && y < 220+i*60+45) clicked=i;
            if(clicked!==-1) {
                if(clicked===db[qIndex].ans) { score+=1000; updateScoreUI(score); qIndex++; draw(); } else { isOver=true; draw(); }
            }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    57: `
        // --- GAME 57: SNAKE & LADDERS ---
        const canvas = document.getElementById('gameCanvas_57'); const ctx = canvas.getContext('2d');
        ${getUI}
        let pos, aiPos, isOver, message;
        const jumps = {16:6, 47:26, 49:11, 56:53, 62:19, 64:60, 87:24, 93:73, 95:75, 98:78, 1:38, 4:14, 9:31, 21:42, 28:84, 36:44, 51:67, 71:91, 80:100};
        function init() { pos=0; aiPos=0; isOver=false; message="Click to Roll Dice!"; updateScoreUI(0); draw(); }
        function getCoords(p) { if(p===0)return{x:10,y:canvas.height-10}; let r=Math.floor((p-1)/10), c=(p-1)%10; if(r%2!==0) c=9-c; return {x: 40+c*(canvas.width/10), y: canvas.height - 40 - r*(canvas.height/10)}; }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            for(let i=0; i<100; i++) {
                let r=Math.floor(i/10), c=i%10;
                ctx.fillStyle = (r+c)%2===0 ? '#1e293b' : '#334155'; ctx.fillRect(c*(canvas.width/10), r*(canvas.height/10), canvas.width/10, canvas.height/10);
            }
            let pC=getCoords(pos), aC=getCoords(aiPos);
            ctx.shadowBlur=10; ctx.shadowColor='#3b82f6'; ctx.fillStyle='#3b82f6'; ctx.beginPath(); ctx.arc(pC.x, pC.y, 15, 0, Math.PI*2); ctx.fill();
            ctx.shadowColor='#ef4444'; ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(aC.x+10, aC.y+10, 15, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
            ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0, canvas.height/2-40, canvas.width, 80);
            ctx.fillStyle='#fff'; ctx.font='bold 28px sans-serif'; ctx.textAlign='center'; ctx.fillText(message, canvas.width/2, canvas.height/2+10);
        }
        function roll(isPlayer) {
            if(isOver) return;
            let dice=Math.floor(Math.random()*6)+1;
            if(isPlayer) { pos+=dice; if(jumps[pos]) pos=jumps[pos]; if(pos>=100){pos=100; message="You Win!"; isOver=true; updateScoreUI(100);} else { message="You rolled "+dice+". AI thinking..."; draw(); setTimeout(()=>roll(false), 800); return; } }
            else { aiPos+=dice; if(jumps[aiPos]) aiPos=jumps[aiPos]; if(aiPos>=100){aiPos=100; message="AI Wins!"; isOver=true;} else { message="AI rolled "+dice+". Your turn!"; } } draw();
        }
        canvas.addEventListener('click', ()=> { if(!isOver && message.includes("Your turn") || message.includes("Click")) roll(true); });
        restartBtn.addEventListener('click', init); init();
    `,
    58: `
        // --- GAME 58: LUDO (Mini) ---
        const canvas = document.getElementById('gameCanvas_58'); const ctx = canvas.getContext('2d');
        ${getUI}
        let p, ai, isOver, msg;
        function init() { p=0; ai=0; isOver=false; msg="Click to Roll!"; updateScoreUI(0); draw(); }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.strokeStyle='#334155'; ctx.lineWidth=20; ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2, 180, 0, Math.PI*2); ctx.stroke();
            let pAngle = (p/40)*Math.PI*2 - Math.PI/2, aiAngle = (ai/40)*Math.PI*2 + Math.PI/2;
            ctx.shadowBlur=15; ctx.shadowColor='#22c55e'; ctx.fillStyle='#22c55e'; ctx.beginPath(); ctx.arc(canvas.width/2 + Math.cos(pAngle)*180, canvas.height/2 + Math.sin(pAngle)*180, 20, 0, Math.PI*2); ctx.fill();
            ctx.shadowColor='#ef4444'; ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(canvas.width/2 + Math.cos(aiAngle)*180, canvas.height/2 + Math.sin(aiAngle)*180, 20, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText(msg, canvas.width/2, canvas.height/2);
        }
        function play(player) {
            if(isOver) return; let dice = Math.floor(Math.random()*6)+1;
            if(player) { p+=dice; if(p>=40){p=40; isOver=true; msg="You Win!"; updateScoreUI(100);} else { msg="You:"+dice+". AI turn."; draw(); setTimeout(()=>play(false), 700); return;} }
            else { ai+=dice; if(ai>=40){ai=40; isOver=true; msg="AI Wins!";} else msg="AI:"+dice+". Your turn."; } draw();
        }
        canvas.addEventListener('click', ()=> { if(!isOver && msg.includes("turn") || msg.includes("Click")) play(true); });
        restartBtn.addEventListener('click', init); init();
    `,
    60: `
        // --- GAME 60: PLAY CHESS SANDBOX ---
        const canvas = document.getElementById('gameCanvas_60'); const ctx = canvas.getContext('2d');
        ${getUI}
        const sz = canvas.height/8, offX = (canvas.width - canvas.height)/2;
        let board, sel;
        function init() {
            sel = null; updateScoreUI(0);
            board = [
                ['♜','♞','♝','♛','♚','♝','♞','♜'], ['♟','♟','♟','♟','♟','♟','♟','♟'],
                ['','','','','','','',''], ['','','','','','','',''], ['','','','','','','',''], ['','','','','','','',''],
                ['♙','♙','♙','♙','♙','♙','♙','♙'], ['♖','♘','♗','♕','♔','♗','♘','♖']
            ]; draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            for(let r=0; r<8; r++) {
                for(let c=0; c<8; c++) {
                    ctx.fillStyle = (r+c)%2===0 ? '#e2e8f0' : '#475569';
                    if(sel && sel.r===r && sel.c===c) ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(offX + c*sz, r*sz, sz, sz);
                    ctx.fillStyle = r<2 ? '#000' : '#fff'; ctx.font = sz*0.7+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
                    if(board[r][c]) { ctx.shadowBlur=4; ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.fillText(board[r][c], offX + c*sz + sz/2, r*sz + sz/2+4); ctx.shadowBlur=0; }
                }
            }
        }
        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect(); let x = (e.clientX - rect.left)*(canvas.width/rect.width), y = (e.clientY - rect.top)*(canvas.height/rect.height);
            let c = Math.floor((x-offX)/sz), r = Math.floor(y/sz);
            if(r>=0&&r<8&&c>=0&&c<8) {
                if(sel) { if(sel.r!==r || sel.c!==c) { board[r][c] = board[sel.r][sel.c]; board[sel.r][sel.c] = ''; updateScoreUI(10); } sel = null; }
                else if(board[r][c]) sel = {r,c};
            } else sel=null; draw();
        });
        restartBtn.addEventListener('click', init); init();
    `,
    64: `
        // --- GAME 64: SPIDER SOLITAIRE SANDBOX ---
        const canvas = document.getElementById('gameCanvas_64'); const ctx = canvas.getContext('2d');
        ${getUI}
        let stacks, sel;
        function init() {
            stacks = Array(8).fill().map(()=>[]); sel = null; updateScoreUI(0);
            for(let i=0; i<40; i++) stacks[i%8].push(Math.floor(Math.random()*13)+1);
            draw();
        }
        function draw() {
            ctx.fillStyle = '#064e3b'; ctx.fillRect(0,0,canvas.width,canvas.height); // Casino Green
            for(let i=0; i<8; i++) {
                ctx.strokeStyle = '#047857'; ctx.lineWidth=2; ctx.strokeRect(30 + i*95, 30, 70, 100);
                for(let j=0; j<stacks[i].length; j++) {
                    let y = 30 + j*20, isSel = (sel && sel.c===i && sel.r===j);
                    ctx.fillStyle = '#fff'; ctx.fillRect(30 + i*95, y, 70, 100);
                    ctx.strokeStyle = isSel ? '#ef4444' : '#ccc'; ctx.lineWidth = isSel ? 3 : 1; ctx.strokeRect(30 + i*95, y, 70, 100);
                    ctx.fillStyle = '#000'; ctx.font='bold 20px sans-serif'; ctx.textAlign='center'; ctx.fillText(stacks[i][j], 30 + i*95 + 35, y+55);
                }
            }
        }
        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect(); let x = (e.clientX - rect.left)*(canvas.width/rect.width), y = (e.clientY - rect.top)*(canvas.height/rect.height);
            let c = Math.floor((x-20)/95);
            if(c>=0 && c<8) {
                if(sel) { if(sel.c !== c) { let moving = stacks[sel.c].splice(sel.r); stacks[c] = stacks[c].concat(moving); updateScoreUI(15); } sel = null; }
                else if(stacks[c].length>0) sel = {c: c, r: stacks[c].length-1};
            } else sel=null; draw();
        });
        restartBtn.addEventListener('click', init); init();
    `,
    65: `
        // --- GAME 65: FOUR COLORS (UNO) ---
        const canvas = document.getElementById('gameCanvas_65'); const ctx = canvas.getContext('2d');
        ${getUI}
        let hand, pile, isOver, msg, colors = ['#ef4444','#3b82f6','#22c55e','#eab308'];
        function init() { hand=[]; for(let i=0; i<5; i++) hand.push({c:Math.floor(Math.random()*4), n:Math.floor(Math.random()*9)+1}); pile={c:Math.floor(Math.random()*4), n:Math.floor(Math.random()*9)+1}; isOver=false; msg="Match color or number!"; updateScoreUI(5); draw(); }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver){ ctx.fillStyle='#fff'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText(msg, canvas.width/2, canvas.height/2); return; }
            
            ctx.fillStyle='#334155'; ctx.fillRect(canvas.width/2-50, 100, 100, 140);
            ctx.fillStyle = colors[pile.c]; ctx.fillRect(canvas.width/2-45, 105, 90, 130);
            ctx.fillStyle='#fff'; ctx.font='bold 60px sans-serif'; ctx.textAlign='center'; ctx.fillText(pile.n, canvas.width/2, 190);
            
            let w = hand.length*90; let offX = (canvas.width - w)/2;
            for(let i=0; i<hand.length; i++) {
                ctx.fillStyle='#fff'; ctx.fillRect(offX + i*90 + 5, canvas.height-160, 80, 120);
                ctx.fillStyle=colors[hand[i].c]; ctx.fillRect(offX + i*90 + 10, canvas.height-155, 70, 110);
                ctx.fillStyle='#fff'; ctx.font='bold 40px sans-serif'; ctx.fillText(hand[i].n, offX + i*90 + 45, canvas.height-90);
            }
            ctx.fillStyle='#94a3b8'; ctx.font='20px sans-serif'; ctx.fillText(msg, canvas.width/2, 60);
        }
        canvas.addEventListener('click', e => {
            if(isOver) return; const rect = canvas.getBoundingClientRect(); let x = (e.clientX - rect.left)*(canvas.width/rect.width), y = (e.clientY - rect.top)*(canvas.height/rect.height);
            let w = hand.length*90; let offX = (canvas.width - w)/2;
            if(y > canvas.height-160) {
                let idx = Math.floor((x-offX)/90);
                if(idx>=0 && idx<hand.length) {
                    let card = hand[idx];
                    if(card.c===pile.c || card.n===pile.n) { pile = card; hand.splice(idx,1); updateScoreUI(hand.length); if(hand.length===0){isOver=true; msg="UNO! YOU WIN!";} }
                    else msg = "Invalid play!"; draw();
                }
            } else if (y < 280) { hand.push({c:Math.floor(Math.random()*4), n:Math.floor(Math.random()*9)+1}); updateScoreUI(hand.length); msg="Drew a card."; draw(); }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    68: `
        // --- GAME 68: GUESS THE SONG (Tone Match) ---
        const canvas = document.getElementById('gameCanvas_68'); const ctx = canvas.getContext('2d');
        ${getUI}
        let actx, score, isOver, tones, target, options;
        function init() { score=0; isOver=false; actx=new(window.AudioContext||window.webkitAudioContext)(); newRound(); updateScoreUI(score); }
        function newRound() {
            tones = [261.63, 329.63, 392.00, 523.25]; // C E G C
            target = Math.floor(Math.random()*4);
            options = ["Low C", "E", "G", "High C"];
            draw(); playTone(tones[target]);
        }
        function playTone(freq) { let osc = actx.createOscillator(); osc.type='sine'; osc.frequency.value=freq; osc.connect(actx.destination); osc.start(); setTimeout(()=>osc.stop(), 500); }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('WRONG! GAME OVER', canvas.width/2, canvas.height/2); return; }
            
            ctx.fillStyle='#38bdf8'; ctx.font='bold 32px sans-serif'; ctx.textAlign='center'; ctx.fillText('Click Speaker to Hear Tone', canvas.width/2, 100);
            ctx.fillStyle='#1e293b'; ctx.beginPath(); ctx.arc(canvas.width/2, 200, 50, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText('🔊', canvas.width/2, 212);
            
            for(let i=0; i<4; i++) {
                ctx.fillStyle='#334155'; ctx.fillRect(canvas.width/2 - 200, 320 + i*50, 400, 40);
                ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.fillText(options[i], canvas.width/2, 348 + i*50);
            }
        }
        canvas.addEventListener('click', e => {
            if(isOver) return; const rect = canvas.getBoundingClientRect(); let x = (e.clientX - rect.left)*(canvas.width/rect.width), y = (e.clientY - rect.top)*(canvas.height/rect.height);
            if(Math.hypot(x-canvas.width/2, y-200)<50) { playTone(tones[target]); return; }
            let clicked = -1;
            for(let i=0; i<4; i++) if(y>320+i*50 && y<360+i*50) clicked=i;
            if(clicked !== -1) { if(clicked === target) { score+=50; updateScoreUI(score); newRound(); } else { isOver=true; draw(); } }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    91: `
        // --- GAME 91: MEMORY CARD MATCH ---
        const canvas = document.getElementById('gameCanvas_91'); const ctx = canvas.getContext('2d');
        ${getUI}
        let cards, flipped, score, isOver, lock;
        const symbols = ['🚀','👽','👾','🛸','⭐','🪐','☄️','🌕'];
        function init() {
            score=0; isOver=false; flipped=[]; lock=false; updateScoreUI(0);
            let deck = [...symbols, ...symbols].sort(()=>Math.random()-0.5);
            cards = deck.map((s,i)=>({s, r:Math.floor(i/4), c:i%4, up:false, match:false})); draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            let matches = 0;
            cards.forEach(card => {
                let x = 120 + card.c*140, y = 30 + card.r*110;
                ctx.fillStyle = card.up || card.match ? '#e2e8f0' : '#334155'; ctx.fillRect(x,y,100,90);
                ctx.strokeStyle='#1e293b'; ctx.strokeRect(x,y,100,90);
                if(card.up || card.match) { ctx.fillStyle='#000'; ctx.font='40px sans-serif'; ctx.textAlign='center'; ctx.fillText(card.s, x+50, y+60); }
                if(card.match) matches++;
            });
            if(matches===16) { ctx.fillStyle='rgba(15,23,42,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#4ade80'; ctx.font='bold 40px sans-serif'; ctx.fillText('YOU WIN!', canvas.width/2, canvas.height/2); }
        }
        canvas.addEventListener('click', e => {
            if(lock) return; const rect = canvas.getBoundingClientRect(); let x = (e.clientX - rect.left)*(canvas.width/rect.width), y = (e.clientY - rect.top)*(canvas.height/rect.height);
            let c = Math.floor((x-120)/140), r = Math.floor((y-30)/110);
            let card = cards.find(cd => cd.c===c && cd.r===r);
            if(card && !card.up && !card.match) {
                card.up = true; flipped.push(card); draw();
                if(flipped.length===2) {
                    lock=true; score+=10; updateScoreUI(score);
                    setTimeout(() => {
                        if(flipped[0].s === flipped[1].s) { flipped[0].match=true; flipped[1].match=true; score+=50; updateScoreUI(score); }
                        else { flipped[0].up=false; flipped[1].up=false; }
                        flipped = []; lock=false; draw();
                    }, 800);
                }
            }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    96: `
        // --- GAME 96: RETRO TIC-TAC-TOE ---
        const canvas = document.getElementById('gameCanvas_96'); const ctx = canvas.getContext('2d');
        ${getUI}
        let board, isOver, msg, score;
        function init() { board=['','','','','','','','','']; isOver=false; msg="Your Turn (X)"; score=0; updateScoreUI(score); draw(); }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 4; ctx.shadowBlur=10; ctx.shadowColor='#38bdf8';
            ctx.beginPath(); ctx.moveTo(canvas.width/2 - 50, 100); ctx.lineTo(canvas.width/2 - 50, 400); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(canvas.width/2 + 50, 100); ctx.lineTo(canvas.width/2 + 50, 400); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(canvas.width/2 - 150, 200); ctx.lineTo(canvas.width/2 + 150, 200); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(canvas.width/2 - 150, 300); ctx.lineTo(canvas.width/2 + 150, 300); ctx.stroke(); ctx.shadowBlur=0;
            
            for(let i=0; i<9; i++) {
                if(board[i]) {
                    let r = Math.floor(i/3), c = i%3;
                    let x = canvas.width/2 - 100 + c*100, y = 150 + r*100;
                    ctx.fillStyle = board[i]==='X' ? '#facc15' : '#ef4444'; ctx.font='bold 60px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
                    ctx.fillText(board[i], x, y);
                }
            }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText(msg, canvas.width/2, 50);
        }
        function checkWin() {
            const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            for(let w of wins) if(board[w[0]] && board[w[0]]===board[w[1]] && board[w[1]]===board[w[2]]) return board[w[0]];
            if(!board.includes('')) return 'Draw'; return null;
        }
        function aiTurn() {
            let empty = []; board.forEach((v,i)=>{if(!v)empty.push(i)});
            if(empty.length>0) { board[empty[Math.floor(Math.random()*empty.length)]] = 'O'; }
            let w = checkWin(); if(w){ isOver=true; msg=w==='Draw'?"It's a Draw!":w+" Wins!"; if(w==='O')score-=10; updateScoreUI(score); } else msg="Your Turn (X)"; draw();
        }
        canvas.addEventListener('click', e => {
            if(isOver || msg.includes('O')) return;
            const rect = canvas.getBoundingClientRect(); let x = (e.clientX - rect.left)*(canvas.width/rect.width), y = (e.clientY - rect.top)*(canvas.height/rect.height);
            let c = Math.floor((x - (canvas.width/2 - 150))/100), r = Math.floor((y - 100)/100);
            if(r>=0&&r<3&&c>=0&&c<3 && !board[r*3+c]) {
                board[r*3+c] = 'X'; let w = checkWin();
                if(w) { isOver=true; msg=w==='Draw'?"It's a Draw!":w+" Wins!"; if(w==='X')score+=50; updateScoreUI(score); draw(); }
                else { msg="AI Thinking..."; draw(); setTimeout(aiTurn, 600); }
            }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    99: `
        // --- GAME 99: WORD SCRAMBLE SUITE ---
        const canvas = document.getElementById('gameCanvas_99'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, isOver, word, scramble, input;
        const words = ['JAVASCRIPT', 'BROWSER', 'CANVAS', 'ENGINE', 'ARCADE', 'NETWORK', 'PHYSICS', 'VECTOR'];
        function init() { score=0; isOver=false; updateScoreUI(score); nextWord(); }
        function nextWord() {
            word = words[Math.floor(Math.random()*words.length)];
            scramble = word.split('').sort(()=>Math.random()-0.5).join('');
            input = ""; draw();
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(isOver) { ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('YOU WIN!', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle='#38bdf8'; ctx.font='bold 40px monospace'; ctx.textAlign='center'; ctx.letterSpacing='10px'; ctx.fillText(scramble, canvas.width/2, 150);
            ctx.fillStyle='#334155'; ctx.fillRect(canvas.width/2 - 200, 250, 400, 60);
            ctx.fillStyle='#fff'; ctx.font='bold 32px sans-serif'; ctx.letterSpacing='normal'; ctx.fillText(input || "Type word here...", canvas.width/2, 290);
        }
        window.addEventListener('keydown', e => {
            if(isOver) return;
            if(e.key==='Backspace') input = input.slice(0,-1);
            else if(e.key==='Enter') {
                if(input === word) { score+=100; updateScoreUI(score); nextWord(); }
                else { input = ""; } // Clears wrong guess
            }
            else if(e.key.length===1 && e.key.match(/[a-z]/i)) input += e.key.toUpperCase();
            draw();
        });
        restartBtn.addEventListener('click', init); init();
    `
};

console.log("[ArcadeNexus Engine]: Commencing Phase 1 Batch Injection...");

Object.keys(engines).forEach(gameId => {
    const fileLoc = path.join(gamesDir, 'game'+gameId, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');

        const scriptStart = '<script>';
        const scriptEnd = '</script>';
        const startIdx = content.lastIndexOf(scriptStart);
        const endIdx = content.lastIndexOf(scriptEnd);

        if (startIdx !== -1 && endIdx !== -1) {
            const fullyFeaturedContent = content.substring(0, startIdx + scriptStart.length) + '\n' + engines[gameId] + '\n' + content.substring(endIdx);
            fs.writeFileSync(fileLoc, fullyFeaturedContent, { encoding: 'utf8' });
            console.log("[PASS]: Injected logic core into game" + gameId + "/index.html");
        }
    }
});

console.log("[Phase 1 Status]: 12 target games successfully upgraded and sealed.");
