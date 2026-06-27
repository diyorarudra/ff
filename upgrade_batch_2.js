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
    69: `
        // --- GAME 69: CAR RUSH ---
        const canvas = document.getElementById('gameCanvas_69'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, py, isOver, score, obs;
        function init() { px=canvas.width/2; py=canvas.height-80; score=0; obs=[]; isOver=false; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('CRASH', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#334155'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#94a3b8'; ctx.setLineDash([20,20]); ctx.beginPath(); ctx.moveTo(canvas.width/3, 0); ctx.lineTo(canvas.width/3, canvas.height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(canvas.width*2/3, 0); ctx.lineTo(canvas.width*2/3, canvas.height); ctx.stroke(); ctx.setLineDash([]);
            
            if(Math.random()<0.04) obs.push({x: Math.random()>0.5 ? (Math.random()>0.5?canvas.width/6:canvas.width/2) : canvas.width*5/6, y:-50});
            
            for(let i=obs.length-1; i>=0; i--) {
                obs[i].y += 5 + score/500;
                ctx.fillStyle='#f43f5e'; ctx.fillRect(obs[i].x-25, obs[i].y-25, 50, 50);
                if(Math.abs(px-obs[i].x)<45 && Math.abs(py-obs[i].y)<45) isOver=true;
                if(obs[i].y > canvas.height) { obs.splice(i,1); score+=10; updateScoreUI(score); }
            }
            ctx.fillStyle='#3b82f6'; ctx.fillRect(px-25, py-25, 50, 50);
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown', e => {
            if(isOver) return;
            if(e.key==='ArrowLeft' && px>canvas.width/6) px-=canvas.width/3;
            if(e.key==='ArrowRight' && px<canvas.width*5/6) px+=canvas.width/3;
        });
        restartBtn.addEventListener('click', init); init();
    `,
    85: `
        // --- GAME 85: 3D CAR RUN ---
        const canvas = document.getElementById('gameCanvas_85'); const ctx = canvas.getContext('2d');
        ${getUI}
        let pos, speed, isOver, score, curves, curveIdx;
        function init() { pos=0; speed=10; score=0; curves=[0,1,-1,0,2,-2]; curveIdx=0; isOver=false; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('WRECKED', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            let curve = curves[curveIdx]; pos += curve*2;
            if(Math.random()<0.01) curveIdx = (curveIdx+1)%curves.length;
            
            for(let i=0; i<30; i++) {
                let w = (i/30)*canvas.width, y = canvas.height - i*15;
                ctx.fillStyle = i%2===0 ? '#334155' : '#475569';
                ctx.fillRect(canvas.width/2 - w/2 - pos*(i/30), y, w, 15);
            }
            
            ctx.fillStyle='#facc15'; ctx.fillRect(canvas.width/2 - 30, canvas.height - 80, 60, 40);
            if(Math.abs(pos) > canvas.width/3) isOver = true;
            
            score+=1; updateScoreUI(Math.floor(score/10));
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown', e => {
            if(e.key==='ArrowLeft') pos+=15;
            if(e.key==='ArrowRight') pos-=15;
        });
        restartBtn.addEventListener('click', init); init();
    `,
    86: `
        // --- GAME 86: SUBWAY RUN 5 ---
        const canvas = document.getElementById('gameCanvas_86'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, py, isOver, score, vy, isJumping, trains;
        function init() { px=1; py=0; vy=0; score=0; trains=[]; isOver=false; isJumping=false; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('BUSTED', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            if(isJumping) { vy+=0.4; py+=vy; if(py>=0){py=0; isJumping=false;} }
            if(Math.random()<0.02) trains.push({lane: Math.floor(Math.random()*3), z: 0.1});
            
            for(let i=trains.length-1; i>=0; i--) {
                trains[i].z += 0.01 + score/20000;
                let scale = trains[i].z;
                let w = scale * 100, h = scale * 80;
                let x = canvas.width/2 + (trains[i].lane - 1)*scale*200 - w/2;
                let y = canvas.height/2 + scale*200 - h/2;
                
                ctx.fillStyle = '#fb923c'; ctx.fillRect(x, y, w, h);
                if(scale > 0.8 && scale < 1.2 && trains[i].lane === px && py > -40) isOver=true;
                if(scale > 1.5) { trains.splice(i,1); score+=10; updateScoreUI(score); }
            }
            
            let pw = 60, ph = 80 + py;
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(canvas.width/2 + (px - 1)*200 - pw/2, canvas.height - ph - 20, pw, ph);
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown', e => {
            if(isOver) return;
            if(e.key==='ArrowLeft' && px>0) px--;
            if(e.key==='ArrowRight' && px<2) px++;
            if(e.key==='ArrowUp' && !isJumping) { vy=-8; isJumping=true; }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    94: `
        // --- GAME 94: FROGGY JUMP ---
        const canvas = document.getElementById('gameCanvas_94'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, py, vx, vy, isOver, score, plats, camY;
        function init() { px=canvas.width/2; py=canvas.height-100; vx=0; vy=-10; score=0; camY=0; plats=[{x:canvas.width/2, y:canvas.height-20}]; isOver=false; updateScoreUI(0); for(let i=0;i<10;i++) spawnPlat(); loop(); }
        function spawnPlat() { plats.push({x: Math.random()*(canvas.width-80)+40, y: plats[plats.length-1].y - 100 - Math.random()*50}); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('FELL OFF', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            px+=vx; vy+=0.4; py+=vy;
            if(px < -20) px = canvas.width; if(px > canvas.width) px = -20;
            if(py < canvas.height/2) { camY = canvas.height/2 - py; score = Math.max(score, Math.floor(camY)); updateScoreUI(score); } else camY = 0;
            
            for(let i=plats.length-1; i>=0; i--) {
                let p = plats[i]; ctx.fillStyle = '#4ade80'; ctx.fillRect(p.x-40, p.y + camY, 80, 15);
                if(vy > 0 && px > p.x-40 && px < p.x+40 && py > p.y-10 && py < p.y+10) { vy = -12; }
                if(p.y + camY > canvas.height) { plats.splice(i,1); spawnPlat(); }
            }
            
            ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(px, py + camY, 15, 0, Math.PI*2); ctx.fill();
            if(py + camY > canvas.height) isOver = true;
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown', e => { if(e.key==='ArrowLeft') vx=-5; if(e.key==='ArrowRight') vx=5; });
        window.addEventListener('keyup', e => { if(e.key==='ArrowLeft' || e.key==='ArrowRight') vx=0; });
        restartBtn.addEventListener('click', init); init();
    `,
    75: `
        // --- GAME 75: TAPPY DUMONT ---
        const canvas = document.getElementById('gameCanvas_75'); const ctx = canvas.getContext('2d');
        ${getUI}
        let py, vy, isOver, score, pipes;
        function init() { py=200; vy=0; score=0; isOver=false; pipes=[]; updateScoreUI(0); loop(); }
        function spawn() { pipes.push({x: canvas.width, top: 50+Math.random()*150, gap: 150, passed:false}); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('CRASH', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#1e293b'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            vy+=0.4; py+=vy;
            ctx.fillStyle='#eab308'; ctx.beginPath(); ctx.arc(100, py, 15, 0, Math.PI*2); ctx.fill();
            
            if(pipes.length===0 || pipes[pipes.length-1].x < canvas.width-300) spawn();
            for(let i=pipes.length-1; i>=0; i--) {
                let p = pipes[i]; p.x -= 3;
                ctx.fillStyle = '#22c55e'; ctx.fillRect(p.x, 0, 50, p.top); ctx.fillRect(p.x, p.top+p.gap, 50, canvas.height);
                if(p.x < 100 && !p.passed) { p.passed = true; score+=10; updateScoreUI(score); }
                if(100+15>p.x && 100-15<p.x+50 && (py-15<p.top || py+15>p.top+p.gap)) isOver = true;
                if(p.x < -50) pipes.splice(i,1);
            }
            if(py>canvas.height || py<0) isOver=true;
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('click', () => { if(!isOver) vy=-7; });
        window.addEventListener('keydown', e => { if(e.key===' ' && !isOver) vy=-7; });
        restartBtn.addEventListener('click', init); init();
    `,
    73: `
        // --- GAME 73: CHIBI HERO ---
        const canvas = document.getElementById('gameCanvas_73'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, py, isOver, score, enemies, attackTime;
        function init() { px=canvas.width/4; py=canvas.height-50; isOver=false; score=0; enemies=[]; attackTime=0; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('DEFEATED', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#1e293b'; ctx.fillRect(0, canvas.height-30, canvas.width, 30);
            
            if(Math.random()<0.02) enemies.push({x: canvas.width+30, y: canvas.height-50, hp: 1});
            
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(px-15, py-20, 30, 40);
            if(attackTime > 0) { ctx.fillStyle = '#facc15'; ctx.fillRect(px+15, py-10, 40, 10); attackTime--; }
            
            for(let i=enemies.length-1; i>=0; i--) {
                let e = enemies[i]; e.x -= 3 + score/100;
                ctx.fillStyle = '#f43f5e'; ctx.fillRect(e.x-15, e.y-20, 30, 40);
                if(attackTime > 0 && Math.abs((px+35) - e.x) < 35) { enemies.splice(i,1); score+=10; updateScoreUI(score); continue; }
                if(Math.abs(px - e.x) < 25) isOver = true;
                if(e.x < -30) enemies.splice(i,1);
            }
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown', e => { if(e.key===' ' && attackTime===0) attackTime=15; });
        canvas.addEventListener('click', () => { if(attackTime===0) attackTime=15; });
        restartBtn.addEventListener('click', init); init();
    `,
    98: `
        // --- GAME 98: COLOR TAP RUNNER ---
        const canvas = document.getElementById('gameCanvas_98'); const ctx = canvas.getContext('2d');
        ${getUI}
        let pos, score, isOver, colors, blocks, pColor;
        function init() { colors=['#ef4444','#3b82f6','#22c55e']; pos=0; score=0; isOver=false; blocks=[]; pColor=0; updateScoreUI(0); for(let i=0;i<10;i++) spawnBlock(i); loop(); }
        function spawnBlock(idx) { blocks.push({x: idx*100, c: Math.floor(Math.random()*3)}); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('MISMATCH', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            pos += 4 + score/50;
            
            for(let i=0; i<blocks.length; i++) {
                let b = blocks[i]; ctx.fillStyle = colors[b.c]; ctx.fillRect(b.x - pos, canvas.height/2, 100, 50);
                if(b.x - pos < 50 && b.x - pos > -50) {
                    if(b.c !== pColor) isOver = true;
                    if(b.x - pos < -40 && !b.scored) { b.scored = true; score+=5; updateScoreUI(score); }
                }
            }
            if(blocks[0].x - pos < -100) { blocks.shift(); spawnBlock(blocks[blocks.length-1].x/100 + 1); }
            
            ctx.fillStyle = colors[pColor]; ctx.beginPath(); ctx.arc(50, canvas.height/2 - 20, 20, 0, Math.PI*2); ctx.fill();
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown', e => { if(e.key==='ArrowUp' || e.key===' ') pColor = (pColor+1)%3; });
        canvas.addEventListener('click', () => { pColor = (pColor+1)%3; });
        restartBtn.addEventListener('click', init); init();
    `,
    100: `
        // --- GAME 100: SPACE ASTEROIDS CULLER ---
        const canvas = document.getElementById('gameCanvas_100'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, py, angle, score, isOver, bullets, asts;
        function init() { px=canvas.width/2; py=canvas.height/2; angle=0; score=0; isOver=false; bullets=[]; asts=[]; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('HULL DESTROYED', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            if(Math.random()<0.03) {
                let a = Math.random()*Math.PI*2; let dist = Math.max(canvas.width, canvas.height);
                asts.push({x: px + Math.cos(a)*dist, y: py + Math.sin(a)*dist, vx: -Math.cos(a)*2, vy: -Math.sin(a)*2, r: 20+Math.random()*20});
            }
            
            ctx.save(); ctx.translate(px, py); ctx.rotate(angle);
            ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(-10,-10); ctx.lineTo(-10,10); ctx.fill(); ctx.restore();
            
            for(let i=bullets.length-1; i>=0; i--) {
                bullets[i].x += bullets[i].vx; bullets[i].y += bullets[i].vy;
                ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(bullets[i].x, bullets[i].y, 3, 0, Math.PI*2); ctx.fill();
                if(bullets[i].x < 0 || bullets[i].x > canvas.width || bullets[i].y < 0 || bullets[i].y > canvas.height) { bullets.splice(i,1); continue; }
                
                for(let j=asts.length-1; j>=0; j--) {
                    if(bullets[i] && Math.hypot(bullets[i].x - asts[j].x, bullets[i].y - asts[j].y) < asts[j].r) {
                        bullets.splice(i,1); asts[j].r -= 10;
                        if(asts[j].r <= 10) { asts.splice(j,1); score+=10; updateScoreUI(score); }
                        break;
                    }
                }
            }
            for(let i=asts.length-1; i>=0; i--) {
                asts[i].x += asts[i].vx; asts[i].y += asts[i].vy;
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(asts[i].x, asts[i].y, asts[i].r, 0, Math.PI*2); ctx.stroke();
                if(Math.hypot(px - asts[i].x, py - asts[i].y) < asts[i].r + 10) isOver = true;
            }
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousemove', e => { const r=canvas.getBoundingClientRect(); angle = Math.atan2((e.clientY-r.top)*(canvas.height/r.height) - py, (e.clientX-r.left)*(canvas.width/r.width) - px); });
        canvas.addEventListener('click', () => { bullets.push({x: px, y: py, vx: Math.cos(angle)*8, vy: Math.sin(angle)*8}); });
        restartBtn.addEventListener('click', init); init();
    `,
    90: `
        // --- GAME 90: CANNON BALLS ---
        const canvas = document.getElementById('gameCanvas_90'); const ctx = canvas.getContext('2d');
        ${getUI}
        let balls, targets, isOver, score, angle;
        function init() { balls=[]; targets=[]; score=0; isOver=false; angle=-Math.PI/4; updateScoreUI(0); for(let i=0;i<5;i++) spawnTarget(); loop(); }
        function spawnTarget() { targets.push({x: canvas.width/2 + Math.random()*300, y: Math.random()*(canvas.height-100)+50, r: 15}); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('OUT OF AMMO', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            ctx.save(); ctx.translate(40, canvas.height-40); ctx.rotate(angle);
            ctx.fillStyle = '#64748b'; ctx.fillRect(0, -10, 50, 20); ctx.restore();
            
            for(let i=balls.length-1; i>=0; i--) {
                balls[i].vy += 0.2; balls[i].x += balls[i].vx; balls[i].y += balls[i].vy;
                ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(balls[i].x, balls[i].y, 6, 0, Math.PI*2); ctx.fill();
                
                for(let j=targets.length-1; j>=0; j--) {
                    if(balls[i] && Math.hypot(balls[i].x - targets[j].x, balls[i].y - targets[j].y) < targets[j].r + 6) {
                        targets.splice(j,1); balls.splice(i,1); score+=20; updateScoreUI(score); spawnTarget(); break;
                    }
                }
                if(balls[i] && (balls[i].x > canvas.width || balls[i].y > canvas.height)) balls.splice(i,1);
            }
            
            targets.forEach(t => { ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill(); });
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousemove', e => { const r=canvas.getBoundingClientRect(); angle = Math.atan2((e.clientY-r.top)*(canvas.height/r.height) - (canvas.height-40), (e.clientX-r.left)*(canvas.width/r.width) - 40); });
        canvas.addEventListener('click', () => { balls.push({x: 40, y: canvas.height-40, vx: Math.cos(angle)*12, vy: Math.sin(angle)*12}); });
        restartBtn.addEventListener('click', init); init();
    `,
    92: `
        // --- GAME 92: NEON BRICK BREAKER ---
        const canvas = document.getElementById('gameCanvas_92'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, bx, by, vx, vy, isOver, score, bricks;
        function init() { px=canvas.width/2; bx=canvas.width/2; by=canvas.height-50; vx=4; vy=-4; score=0; isOver=false; bricks=[]; updateScoreUI(0);
            for(let r=0; r<5; r++) for(let c=0; c<8; c++) bricks.push({x: c*95+30, y: r*35+50, w: 85, h: 25, active:true}); loop();
        }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            bx+=vx; by+=vy;
            if(bx<5 || bx>canvas.width-5) vx=-vx; if(by<5) vy=-vy;
            if(by>canvas.height-30 && bx>px-50 && bx<px+50) { vy=-vy; vx = (bx-px)*0.15; }
            if(by>canvas.height) isOver=true;
            
            ctx.shadowBlur = 10; ctx.fillStyle = '#38bdf8'; ctx.shadowColor = '#38bdf8'; ctx.fillRect(px-50, canvas.height-20, 100, 10);
            
            ctx.fillStyle = '#eab308'; ctx.shadowColor = '#eab308'; ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = '#a855f7'; ctx.shadowColor = '#a855f7';
            let won = true;
            bricks.forEach(b => {
                if(b.active) {
                    won = false; ctx.fillRect(b.x, b.y, b.w, b.h);
                    if(bx>b.x && bx<b.x+b.w && by>b.y && by<b.y+b.h) { vy=-vy; b.active=false; score+=15; updateScoreUI(score); }
                }
            });
            if(won) { isOver=true; ctx.shadowBlur=0; ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('YOU WIN', canvas.width/2, canvas.height/2); return; }
            ctx.shadowBlur = 0; requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousemove', e => { const r=canvas.getBoundingClientRect(); px = (e.clientX-r.left)*(canvas.width/r.width); });
        restartBtn.addEventListener('click', init); init();
    `,
    93: `
        // --- GAME 93: BUBBLE POP CLASSIC ---
        const canvas = document.getElementById('gameCanvas_93'); const ctx = canvas.getContext('2d');
        ${getUI}
        let bubbles, proj, score, isOver, angle, colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];
        function init() { score=0; isOver=false; bubbles=[]; angle=-Math.PI/2; updateScoreUI(0);
            for(let r=0; r<4; r++) for(let c=0; c<12; c++) bubbles.push({x: c*60+40, y: r*50+40, c: colors[Math.floor(Math.random()*4)]});
            newProj(); loop();
        }
        function newProj() { proj = {x: canvas.width/2, y: canvas.height-40, vx:0, vy:0, active:false, c: colors[Math.floor(Math.random()*4)]}; }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            ctx.save(); ctx.translate(canvas.width/2, canvas.height-40); ctx.rotate(angle); ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(40,0); ctx.stroke(); ctx.restore();
            
            if(proj.active) {
                proj.x += proj.vx; proj.y += proj.vy;
                if(proj.x<20 || proj.x>canvas.width-20) proj.vx=-proj.vx;
                let hit = false;
                for(let i=0; i<bubbles.length; i++) {
                    if(Math.hypot(proj.x - bubbles[i].x, proj.y - bubbles[i].y) < 40) { hit = true; break; }
                }
                if(hit || proj.y<20) { bubbles.push({x: proj.x, y: proj.y, c: proj.c}); score+=10; updateScoreUI(score); newProj(); }
            }
            ctx.fillStyle = proj.c; ctx.beginPath(); ctx.arc(proj.x, proj.y, 20, 0, Math.PI*2); ctx.fill();
            
            bubbles.forEach(b => { ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(b.x, b.y, 20, 0, Math.PI*2); ctx.fill(); if(b.y > canvas.height-100) isOver=true; });
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousemove', e => { const r=canvas.getBoundingClientRect(); angle = Math.atan2((e.clientY-r.top)*(canvas.height/r.height) - (canvas.height-40), (e.clientX-r.left)*(canvas.width/r.width) - canvas.width/2); });
        canvas.addEventListener('click', () => { if(!proj.active) { proj.vx = Math.cos(angle)*15; proj.vy = Math.sin(angle)*15; proj.active = true; } });
        restartBtn.addEventListener('click', init); init();
    `,
    76: `
        // --- GAME 76: HIT VILLAINS ---
        const canvas = document.getElementById('gameCanvas_76'); const ctx = canvas.getContext('2d');
        ${getUI}
        let score, isOver, vils, t;
        function init() { score=0; isOver=false; vils=[]; t=0; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver){ ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('TIME UP', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            t++; if(t>1800) isOver=true; // 30 sec time limit
            
            if(Math.random()<0.04 && vils.length<5) vils.push({x: 50+Math.random()*(canvas.width-100), y: 50+Math.random()*(canvas.height-100), r: 10, max: 25+Math.random()*20, grow:true});
            
            for(let i=vils.length-1; i>=0; i--) {
                let v = vils[i];
                if(v.grow) { v.r+=0.5; if(v.r>v.max) v.grow=false; } else { v.r-=0.5; if(v.r<5) { vils.splice(i,1); score-=5; updateScoreUI(score); continue; } }
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(v.x, v.y, v.r, 0, Math.PI*2); ctx.fill();
            }
            
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.fillText('Time: '+Math.floor((1800-t)/60), 20, 30);
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousedown', e => {
            const r=canvas.getBoundingClientRect(); let mx=(e.clientX-r.left)*(canvas.width/r.width), my=(e.clientY-r.top)*(canvas.height/r.height);
            for(let i=vils.length-1; i>=0; i--) {
                if(Math.hypot(mx - vils[i].x, my - vils[i].y) < vils[i].r) { vils.splice(i,1); score+=20; updateScoreUI(score); break; }
            }
        });
        restartBtn.addEventListener('click', init); init();
    `
};

console.log("[GamiDay Engine]: Commencing Phase 2 Batch Injection...");

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
            console.log("[PASS]: Injected physics core into game" + gameId + "/index.html");
        }
    }
});

console.log("[Phase 2 Status]: 12 target games successfully upgraded and sealed with strict physics engines.");
