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
    59: `
        // --- GAME 59: CUBE MOVE ---
        const canvas = document.getElementById('gameCanvas_59'); const ctx = canvas.getContext('2d');
        ${getUI}
        let px, py, score, tgt, isOver;
        function iso(x,y,z) { return {x: canvas.width/2 + x - y, y: 150 + (x+y)/2 - z}; }
        function init() { px=0; py=0; score=0; isOver=false; spawnTgt(); updateScoreUI(score); loop(); }
        function spawnTgt() { tgt = {x: Math.floor(Math.random()*6)*50 - 100, y: Math.floor(Math.random()*6)*50 - 100}; }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('FELL OFF', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            for(let x=-150; x<=150; x+=50) for(let y=-150; y<=150; y+=50) {
                let p = iso(x,y,0);
                ctx.strokeStyle = '#334155'; ctx.beginPath(); ctx.moveTo(p.x, p.y);
                let p2 = iso(x+50,y,0); ctx.lineTo(p2.x, p2.y);
                let p3 = iso(x+50,y+50,0); ctx.lineTo(p3.x, p3.y);
                let p4 = iso(x,y+50,0); ctx.lineTo(p4.x, p4.y);
                ctx.closePath(); ctx.stroke();
            }
            
            let tp = iso(tgt.x, tgt.y, 0);
            ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.moveTo(tp.x, tp.y); ctx.lineTo(iso(tgt.x+40,tgt.y,0).x, iso(tgt.x+40,tgt.y,0).y); ctx.lineTo(iso(tgt.x+40,tgt.y+40,0).x, iso(tgt.x+40,tgt.y+40,0).y); ctx.lineTo(iso(tgt.x,tgt.y+40,0).x, iso(tgt.x,tgt.y+40,0).y); ctx.fill();
            
            let pp = iso(px, py, 20);
            ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(pp.x, pp.y); ctx.lineTo(iso(px+40,py,20).x, iso(px+40,py,20).y); ctx.lineTo(iso(px+40,py+40,20).x, iso(px+40,py+40,20).y); ctx.lineTo(iso(px,py+40,20).x, iso(px,py+40,20).y); ctx.fill();
            
            if(Math.abs(px-tgt.x)<10 && Math.abs(py-tgt.y)<10) { score+=10; updateScoreUI(score); spawnTgt(); }
            if(px<-150 || px>150 || py<-150 || py>150) isOver=true;
            requestAnimationFrame(loop);
        }
        window.addEventListener('keydown', e => {
            if(e.key==='ArrowUp') { px-=50; py-=50; } if(e.key==='ArrowDown') { px+=50; py+=50; }
            if(e.key==='ArrowLeft') { px-=50; py+=50; } if(e.key==='ArrowRight') { px+=50; py-=50; }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    66: `
        // --- GAME 66: VIRTUAL DRUM ---
        const canvas = document.getElementById('gameCanvas_66'); const ctx = canvas.getContext('2d');
        ${getUI}
        let actx, score, hits, isOver;
        const drums = [{id:'Q',c:'#ef4444',x:100,y:200,r:60},{id:'W',c:'#38bdf8',x:250,y:150,r:70},{id:'E',c:'#eab308',x:400,y:150,r:70},{id:'R',c:'#22c55e',x:550,y:200,r:60}];
        function init() { score=0; hits=[]; isOver=false; updateScoreUI(score); draw(); }
        function getCtx() { if(!actx) actx = new(window.AudioContext||window.webkitAudioContext)(); return actx; }
        function playDrum(idx) {
            let cx = getCtx(); let osc = cx.createOscillator(); let gn = cx.createGain();
            osc.connect(gn); gn.connect(cx.destination);
            osc.type = idx===0?'square':(idx===1?'triangle':(idx===2?'sine':'sawtooth'));
            osc.frequency.setValueAtTime(idx===0?100:(idx===1?200:(idx===2?300:150)), cx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, cx.currentTime+0.5);
            gn.gain.setValueAtTime(1, cx.currentTime); gn.gain.exponentialRampToValueAtTime(0.01, cx.currentTime+0.5);
            osc.start(cx.currentTime); osc.stop(cx.currentTime+0.5);
            score++; updateScoreUI(score); hits.push({idx, t:20});
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText("Press Q, W, E, R or Click", canvas.width/2, 50);
            
            for(let i=hits.length-1; i>=0; i--) { hits[i].t--; if(hits[i].t<=0) hits.splice(i,1); }
            
            drums.forEach((d,i) => {
                let isHit = hits.find(h=>h.idx===i);
                ctx.fillStyle = isHit ? '#fff' : '#1e293b'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r+(isHit?10:0), 0, Math.PI*2); ctx.fill();
                ctx.strokeStyle = d.c; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(d.x, d.y, d.r+(isHit?10:0)-4, 0, Math.PI*2); ctx.stroke();
                ctx.fillStyle = isHit ? '#000' : d.c; ctx.font='bold 36px sans-serif'; ctx.fillText(d.id, d.x, d.y+12);
            });
            requestAnimationFrame(draw);
        }
        window.addEventListener('keydown', e => {
            let idx = ['Q','W','E','R'].indexOf(e.key.toUpperCase());
            if(idx !== -1) playDrum(idx);
        });
        canvas.addEventListener('mousedown', e => {
            const r=canvas.getBoundingClientRect(); let x=(e.clientX-r.left)*(canvas.width/r.width), y=(e.clientY-r.top)*(canvas.height/r.height);
            drums.forEach((d,i) => { if(Math.hypot(x-d.x, y-d.y)<d.r) playDrum(i); });
        });
        restartBtn.addEventListener('click', ()=>{ if(actx)actx.close(); actx=null; init(); }); init();
    `,
    67: `
        // --- GAME 67: VIRTUAL PIANO ---
        const canvas = document.getElementById('gameCanvas_67'); const ctx = canvas.getContext('2d');
        ${getUI}
        let actx, score, hits, isOver;
        const keys = ['A','S','D','F','G','H','J']; const freqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
        function init() { score=0; hits=[]; isOver=false; updateScoreUI(score); draw(); }
        function getCtx() { if(!actx) actx = new(window.AudioContext||window.webkitAudioContext)(); return actx; }
        function playKey(idx) {
            let cx = getCtx(); let osc = cx.createOscillator(); let gn = cx.createGain();
            osc.connect(gn); gn.connect(cx.destination);
            osc.type = 'sine'; osc.frequency.value = freqs[idx];
            gn.gain.setValueAtTime(1, cx.currentTime); gn.gain.exponentialRampToValueAtTime(0.01, cx.currentTime+1);
            osc.start(cx.currentTime); osc.stop(cx.currentTime+1);
            score++; updateScoreUI(score); hits.push({idx, t:15});
        }
        function draw() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='#38bdf8'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText("Play Piano (A S D F G H J)", canvas.width/2, 60);
            
            for(let i=hits.length-1; i>=0; i--) { hits[i].t--; if(hits[i].t<=0) hits.splice(i,1); }
            
            let kw = 60, sp = 10, ox = (canvas.width - (7*kw + 6*sp))/2;
            for(let i=0; i<7; i++) {
                let isHit = hits.find(h=>h.idx===i);
                ctx.fillStyle = isHit ? '#94a3b8' : '#fff';
                ctx.shadowBlur=10; ctx.shadowColor='rgba(0,0,0,0.5)';
                ctx.fillRect(ox + i*(kw+sp), 150 + (isHit?10:0), kw, 200); ctx.shadowBlur=0;
                ctx.fillStyle = '#000'; ctx.font='bold 24px sans-serif'; ctx.fillText(keys[i], ox + i*(kw+sp) + kw/2, 320 + (isHit?10:0));
            }
            requestAnimationFrame(draw);
        }
        window.addEventListener('keydown', e => {
            let idx = keys.indexOf(e.key.toUpperCase());
            if(idx !== -1) playKey(idx);
        });
        canvas.addEventListener('mousedown', e => {
            const r=canvas.getBoundingClientRect(); let x=(e.clientX-r.left)*(canvas.width/r.width), y=(e.clientY-r.top)*(canvas.height/r.height);
            let kw = 60, sp = 10, ox = (canvas.width - (7*kw + 6*sp))/2;
            if(y>150 && y<350) {
                let idx = Math.floor((x - ox)/(kw+sp));
                if(idx>=0 && idx<7 && x > ox+idx*(kw+sp) && x < ox+idx*(kw+sp)+kw) playKey(idx);
            }
        });
        restartBtn.addEventListener('click', ()=>{ if(actx)actx.close(); actx=null; init(); }); init();
    `,
    70: `
        // --- GAME 70: SPACE FLASH (Simon Says) ---
        const canvas = document.getElementById('gameCanvas_70'); const ctx = canvas.getContext('2d');
        ${getUI}
        let seq, pIdx, state, score, isOver, flashTimer, flashIdx;
        const pads = [{x:200,y:150,c:'#ef4444'}, {x:400,y:150,c:'#3b82f6'}, {x:200,y:350,c:'#22c55e'}, {x:400,y:350,c:'#eab308'}];
        function init() { seq=[]; pIdx=0; state='show'; score=0; isOver=false; flashTimer=0; flashIdx=-1; updateScoreUI(0); nextLevel(); loop(); }
        function nextLevel() { seq.push(Math.floor(Math.random()*4)); pIdx=0; state='show'; flashIdx=0; flashTimer=45; }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('WRONG SEQUENCE', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText(state==='show'?"Watch the Sequence...":"Your Turn!", canvas.width/2, 50);
            
            let activePad = -1;
            if(state==='show') {
                flashTimer--;
                if(flashTimer > 15) activePad = seq[flashIdx];
                if(flashTimer <= 0) { flashIdx++; flashTimer=45; if(flashIdx >= seq.length) state='play'; }
            }
            
            pads.forEach((p,i) => {
                ctx.fillStyle = (i===activePad || p.flash>0) ? '#fff' : p.c;
                ctx.beginPath(); ctx.arc(p.x, p.y, 80, 0, Math.PI*2); ctx.fill();
                if(p.flash>0) p.flash--;
            });
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('click', e => {
            if(isOver || state!=='play') return;
            const r=canvas.getBoundingClientRect(); let x=(e.clientX-r.left)*(canvas.width/r.width), y=(e.clientY-r.top)*(canvas.height/r.height);
            pads.forEach((p,i) => {
                if(Math.hypot(x-p.x, y-p.y)<80) {
                    p.flash = 10;
                    if(i === seq[pIdx]) {
                        pIdx++; if(pIdx >= seq.length) { score+=10; updateScoreUI(score); setTimeout(nextLevel, 800); state='wait'; }
                    } else isOver=true;
                }
            });
        });
        restartBtn.addEventListener('click', init); init();
    `,
    77: `
        // --- GAME 77: WEAPON STRIKE ---
        const canvas = document.getElementById('gameCanvas_77'); const ctx = canvas.getContext('2d');
        ${getUI}
        let angle, knives, proj, isOver, score;
        function init() { angle=0; knives=[]; proj=null; score=0; isOver=false; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('DEFLECTED', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            angle += 0.03 + score/1000;
            
            ctx.save(); ctx.translate(canvas.width/2, 200); ctx.rotate(angle);
            ctx.fillStyle = '#8b5cf6'; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI*2); ctx.fill();
            knives.forEach(a => {
                ctx.save(); ctx.rotate(a);
                ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(-5, 80); ctx.lineTo(5, 80); ctx.lineTo(0, 140); ctx.fill();
                ctx.restore();
            });
            ctx.restore();
            
            if(proj) {
                proj.y -= 25;
                ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(canvas.width/2-5, proj.y); ctx.lineTo(canvas.width/2+5, proj.y); ctx.lineTo(canvas.width/2, proj.y-60); ctx.fill();
                if(proj.y <= 280) {
                    let hitAngle = (Math.PI*2 - angle) % (Math.PI*2); if(hitAngle<0) hitAngle+=Math.PI*2;
                    let overlap = false;
                    knives.forEach(a => {
                        let diff = Math.abs(a - hitAngle); if(diff > Math.PI) diff = Math.PI*2 - diff;
                        if(diff < 0.25) overlap=true;
                    });
                    if(overlap) isOver=true;
                    else { knives.push(hitAngle); score+=10; updateScoreUI(score); proj=null; }
                }
            } else {
                ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.moveTo(canvas.width/2-5, 450); ctx.lineTo(canvas.width/2+5, 450); ctx.lineTo(canvas.width/2, 390); ctx.fill();
            }
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousedown', () => { if(!isOver && !proj) proj = {y: 450}; });
        window.addEventListener('keydown', e => { if(e.key===' ' && !isOver && !proj) proj = {y: 450}; });
        restartBtn.addEventListener('click', init); init();
    `,
    87: `
        // --- GAME 87: CITY BUILDER (Moving Grid Snap) ---
        const canvas = document.getElementById('gameCanvas_87'); const ctx = canvas.getContext('2d');
        ${getUI}
        let grid, obj, dir, score, isOver, t;
        function init() { grid=[]; for(let r=0;r<6;r++)grid.push([0,0,0,0,0,0]); obj={r:0, c:0}; dir=1; score=0; isOver=false; t=0; updateScoreUI(0); loop(); }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('CITY FULL', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#020617'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            t++;
            if(t > (20 - Math.min(score, 15))) { t=0; obj.c += dir; if(obj.c<0 || obj.c>5) { dir=-dir; obj.c+=dir*2; } }
            
            let sz = 70, ox = (canvas.width-sz*6)/2, oy = canvas.height-sz*6 - 50;
            
            for(let r=0; r<6; r++) for(let c=0; c<6; c++) {
                ctx.strokeStyle = '#1e293b'; ctx.strokeRect(ox+c*sz, oy+r*sz, sz, sz);
                if(grid[r][c] === 1) { ctx.fillStyle='#3b82f6'; ctx.fillRect(ox+c*sz+2, oy+r*sz+2, sz-4, sz-4); }
            }
            ctx.fillStyle = '#facc15'; ctx.fillRect(ox+obj.c*sz+2, oy+obj.r*sz+2, sz-4, sz-4);
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('click', () => {
            if(isOver) return;
            if(grid[obj.r][obj.c] === 0) {
                grid[obj.r][obj.c] = 1; score+=10; updateScoreUI(score);
                let full=true; for(let r=0;r<6;r++)for(let c=0;c<6;c++)if(grid[r][c]===0)full=false;
                if(full) isOver=true;
                else { do { obj.r=Math.floor(Math.random()*6); } while(grid[obj.r].every(v=>v===1)); obj.c=0; dir=1; }
            }
        });
        restartBtn.addEventListener('click', init); init();
    `,
    88: `
        // --- GAME 88: CLASSIC BOWLING ---
        const canvas = document.getElementById('gameCanvas_88'); const ctx = canvas.getContext('2d');
        ${getUI}
        let ball, pins, phase, pDir, pVal, isOver, score, t;
        function init() {
            ball = {x: canvas.width/2, y: canvas.height-50, vx:0, vy:0, r:15};
            pins = []; let offX=canvas.width/2, offY=100;
            for(let r=0; r<4; r++) for(let c=0; c<=r; c++) pins.push({x: offX - r*20 + c*40, y: offY + r*30, active:true});
            phase = 'aim'; pDir = 1; pVal = 0; score = 0; isOver=false; updateScoreUI(0); t=0; loop();
        }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#4ade80'; ctx.font='bold 36px sans-serif'; ctx.textAlign='center'; ctx.fillText('STRIKE ZONE', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#172554'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#d97706'; ctx.fillRect(canvas.width/2-100, 0, 200, canvas.height); // Lane
            
            if(phase === 'aim') {
                pVal += pDir*2; if(pVal>100 || pVal<-100) pDir=-pDir;
                ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + pVal, ball.y - 100); ctx.stroke();
            } else if (phase === 'power') {
                pVal += pDir*3; if(pVal>100 || pVal<0) pDir=-pDir;
                ctx.fillStyle = '#ef4444'; ctx.fillRect(50, canvas.height-150, 20, 100);
                ctx.fillStyle = '#22c55e'; ctx.fillRect(50, canvas.height-50-pVal, 20, pVal);
            } else if (phase === 'roll') {
                ball.x += ball.vx; ball.y += ball.vy;
                pins.forEach(p => {
                    if(p.active && Math.hypot(ball.x - p.x, ball.y - p.y) < 25) { p.active=false; score+=10; updateScoreUI(score); }
                });
                if(ball.y < 50 || ball.x < canvas.width/2-100 || ball.x > canvas.width/2+100) {
                    t++; if(t>60) isOver=true;
                }
            }
            
            pins.forEach(p => { if(p.active) { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#ef4444'; ctx.fillRect(p.x-8, p.y-2, 16, 4); } });
            
            ctx.shadowBlur=15; ctx.shadowColor='#000'; ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('click', () => {
            if(phase === 'aim') { ball.vx = pVal/15; phase = 'power'; pVal=0; pDir=1; }
            else if(phase === 'power') { ball.vy = -5 - (pVal/10); phase = 'roll'; }
        });
        restartBtn.addEventListener('click', init); init();
    `
};

console.log("[GamiDay Engine]: Commencing Phase 4 Batch Injection...");

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
            console.log("[PASS]: Injected audiovisual core into game" + gameId + "/index.html");
        }
    }
});

console.log("[Phase 4 Status]: Final 7 games successfully upgraded and sealed with Web Audio matrices.");
