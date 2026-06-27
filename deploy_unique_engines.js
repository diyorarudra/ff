const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

const titles = {
  59: "Cube Move", 61: "Faster or Slower", 62: "Quiz Game 2", 63: "Connect the Dots",
  66: "Virtual Drum", 70: "Space Flash", 72: "Fill the Water", 73: "Chibi Hero", 74: "Jo Jo Run",
  75: "Tappy Dumont", 76: "Hit Villains", 77: "Weapon Strike", 78: "Thief Challenge", 80: "True or False",
  81: "Solve Math Ex", 82: "Draggable Puzzle", 83: "Guess Number", 84: "Hacker Challenge", 85: "3D Car Run",
  86: "Subway Run 5", 87: "City Builder", 88: "Classic Bowling", 89: "Balloons Shooter", 90: "Cannon Balls",
  91: "Memory Card Match", 92: "Neon Brick Breaker", 93: "Bubble Pop Classic", 94: "Froggy Jump",
  95: "Tower Stack Arena", 96: "Retro Tic-Tac-Toe", 97: "Maze Escape", 98: "Color Tap Runner",
  99: "Word Scramble Suite", 100: "Space Asteroids Culler"
};

const uniqueEngines = {
    59: `
        const c = document.getElementById('gameCanvas_59'); const ctx = c.getContext('2d');
        let px=400, py=250, score=0, tgt={x:400+Math.random()*200-100, y:250+Math.random()*150-75};
        function iso(x,y,z){ return {x: x-y, y: (x+y)/2 - z}; }
        function loop() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            let p1=iso(px,py,0), p2=iso(px,py,30);
            ctx.fillStyle='#3b82f6'; ctx.fillRect(p2.x-15, p2.y-15, 30, 30);
            let t=iso(tgt.x,tgt.y,0);
            ctx.fillStyle='#22c55e'; ctx.beginPath(); ctx.arc(t.x, t.y, 10, 0, Math.PI*2); ctx.fill();
            if(Math.hypot(px-tgt.x, py-tgt.y)<20){ score+=10; tgt={x:400+Math.random()*200-100, y:250+Math.random()*150-75}; document.getElementById('score').innerText=score; }
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowUp')px-=10; if(e.key==='ArrowDown')px+=10; if(e.key==='ArrowLeft')py-=10; if(e.key==='ArrowRight')py+=10; }); loop();
    `,
    61: `
        const c=document.getElementById('gameCanvas_61'); const ctx=c.getContext('2d');
        let rate=1, x=0, score=0;
        setInterval(()=>rate=0.5+Math.random()*4, 2000);
        function loop() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            x += rate; if(x>c.width) x=0;
            ctx.fillStyle='#facc15'; ctx.fillRect(x,200,40,40);
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Current Speed Rate: '+rate.toFixed(2), 250, 100);
            ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('click', ()=>{ if(x>380 && x<420){ score+=10; document.getElementById('score').innerText=score; } }); loop();
    `,
    62: `
        const c=document.getElementById('gameCanvas_62'); const ctx=c.getContext('2d');
        let hex=[], score=0;
        function drawHex(x,y,r,color){ ctx.fillStyle=color; ctx.beginPath(); for(let i=0;i<6;i++){ ctx.lineTo(x+r*Math.cos(i*Math.PI/3), y+r*Math.sin(i*Math.PI/3)); } ctx.closePath(); ctx.fill(); }
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            hex.forEach(h=>drawHex(h.x,h.y,40,h.c));
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        setInterval(()=>{ if(hex.length<10) hex.push({x:100+Math.random()*600, y:100+Math.random()*300, c:'#'+Math.floor(Math.random()*16777215).toString(16)}); }, 1000);
        c.addEventListener('click',(e)=>{ const r=c.getBoundingClientRect(); const cx=(e.clientX-r.left)*c.width/r.width, cy=(e.clientY-r.top)*c.height/r.height; for(let i=hex.length-1;i>=0;i--){ if(Math.hypot(cx-hex[i].x, cy-hex[i].y)<40){ hex.splice(i,1); score+=10; document.getElementById('score').innerText=score; break; } } }); loop();
    `,
    63: `
        const c=document.getElementById('gameCanvas_63'); const ctx=c.getContext('2d');
        let pts=Array(10).fill().map(()=>({x:50+Math.random()*700, y:50+Math.random()*400})), line=[], score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.strokeStyle='#3b82f6'; ctx.lineWidth=3; ctx.beginPath();
            line.forEach((l,i)=>{ if(i===0) ctx.moveTo(l.x,l.y); else ctx.lineTo(l.x,l.y); }); ctx.stroke();
            pts.forEach((p,i)=>{ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(p.x,p.y,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.font='10px sans-serif'; ctx.fillText(i+1, p.x-3,p.y+3); });
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('click',(e)=>{
            const r=c.getBoundingClientRect(); const cx=(e.clientX-r.left)*c.width/r.width, cy=(e.clientY-r.top)*c.height/r.height;
            if(line.length<pts.length){ let target=pts[line.length]; if(Math.hypot(cx-target.x, cy-target.y)<15){ line.push(target); score+=10; document.getElementById('score').innerText=score; } }
        }); loop();
    `,
    66: `
        const c=document.getElementById('gameCanvas_66'); const ctx=c.getContext('2d');
        let actx=null;
        function playHit(freq){ if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)(); let o=actx.createOscillator(), g=actx.createGain(); o.frequency.value=freq; g.gain.setValueAtTime(1,actx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,actx.currentTime+0.2); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+0.2); }
        let pads=[{x:200,y:250,r:60,f:100},{x:350,y:200,r:70,f:150},{x:500,y:200,r:70,f:200},{x:650,y:250,r:60,f:250}], hit=-1, score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            pads.forEach((p,i)=>{ ctx.fillStyle=hit===i?'#e11d48':'#334155'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); });
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Hits: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('click',(e)=>{ const r=c.getBoundingClientRect(); const cx=(e.clientX-r.left)*c.width/r.width, cy=(e.clientY-r.top)*c.height/r.height; pads.forEach((p,i)=>{ if(Math.hypot(cx-p.x, cy-p.y)<p.r){ playHit(p.f); hit=i; setTimeout(()=>hit=-1, 100); score++; document.getElementById('score').innerText=score; } }); }); loop();
    `,
    70: `
        const c=document.getElementById('gameCanvas_70'); const ctx=c.getContext('2d');
        let seq=[], uSeq=[], flash=-1, state='show', score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            for(let i=0;i<4;i++){ ctx.fillStyle=flash===i?'#fff':['#ef4444','#3b82f6','#22c55e','#facc15'][i]; ctx.fillRect(200+i*110, 200, 100, 100); }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        function next(){ seq.push(Math.floor(Math.random()*4)); uSeq=[]; state='show'; let i=0; let t=setInterval(()=>{ flash=seq[i]; setTimeout(()=>flash=-1, 300); i++; if(i>=seq.length){ clearInterval(t); state='input'; } }, 600); }
        c.addEventListener('click',(e)=>{ if(state!=='input')return; const r=c.getBoundingClientRect(); const cx=(e.clientX-r.left)*c.width/r.width, cy=(e.clientY-r.top)*c.height/r.height; for(let i=0;i<4;i++){ if(cx>200+i*110 && cx<300+i*110 && cy>200 && cy<300){ flash=i; setTimeout(()=>flash=-1, 200); uSeq.push(i); if(uSeq[uSeq.length-1]!==seq[uSeq.length-1]){ score=0; seq=[]; document.getElementById('score').innerText=score; setTimeout(next,1000); } else if(uSeq.length===seq.length){ score++; document.getElementById('score').innerText=score; setTimeout(next,1000); } } } }); next(); loop();
    `,
    72: `
        const c=document.getElementById('gameCanvas_72'); const ctx=c.getContext('2d');
        let p=[], score=0, fill=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#fff'; ctx.fillRect(300,400,200,10); ctx.fillRect(300,200,10,200); ctx.fillRect(490,200,10,200);
            if(Math.random()<0.3) p.push({x:350+Math.random()*100, y:50, vy:0});
            ctx.fillStyle='#38bdf8';
            for(let i=p.length-1;i>=0;i--){ p[i].vy+=0.4; p[i].y+=p[i].vy; ctx.fillRect(p[i].x,p[i].y,6,6); if(p[i].y>400-fill){ p.splice(i,1); fill+=0.1; score++; document.getElementById('score').innerText=Math.floor(score/10); } }
            if(fill>200) fill=0; ctx.fillRect(310, 400-fill, 180, fill);
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Drops Caught: '+score, 20,40); requestAnimationFrame(loop);
        } loop();
    `,
    73: `
        const c=document.getElementById('gameCanvas_73'); const ctx=c.getContext('2d');
        let px=100, attack=false, en=[], score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#22c55e'; ctx.fillRect(0,400,c.width,100);
            ctx.fillStyle='#38bdf8'; ctx.fillRect(px,360,40,40);
            if(attack){ ctx.fillStyle='#facc15'; ctx.fillRect(px+40,370,50,20); }
            if(Math.random()<0.02) en.push({x:850, y:360});
            ctx.fillStyle='#ef4444';
            for(let i=en.length-1;i>=0;i--){ en[i].x-=3; ctx.fillRect(en[i].x,en[i].y,40,40); if(attack && en[i].x>px+40 && en[i].x<px+90){ en.splice(i,1); score+=10; document.getElementById('score').innerText=score; } else if(en[i].x<-50) en.splice(i,1); }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key===' ') { attack=true; setTimeout(()=>attack=false, 200); } }); loop();
    `,
    74: `
        const c=document.getElementById('gameCanvas_74'); const ctx=c.getContext('2d');
        let px=400, py=250, vx=0, vy=0, pivot=null, score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            vy+=0.3; if(pivot){ let dist=Math.hypot(px-pivot.x, py-pivot.y); if(dist>200){ let tx=px-pivot.x, ty=py-pivot.y; let dp=(vx*tx + vy*ty)/(dist*dist); vx-=dp*tx; vy-=dp*ty; } ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(pivot.x,pivot.y); ctx.lineTo(px,py); ctx.stroke(); }
            px+=vx; py+=vy; if(py>c.height){ py=250; px=400; vx=0; vy=0; score=0; }
            ctx.fillStyle='#ef4444'; ctx.beginPath(); ctx.arc(px,py,15,0,Math.PI*2); ctx.fill();
            score++; document.getElementById('score').innerText=Math.floor(score/10); ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+Math.floor(score/10), 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',(e)=>{ const r=c.getBoundingClientRect(); pivot={x:(e.clientX-r.left)*c.width/r.width, y:(e.clientY-r.top)*c.height/r.height}; });
        c.addEventListener('mouseup',()=>{ pivot=null; }); loop();
    `,
    75: `
        const c=document.getElementById('gameCanvas_75'); const ctx=c.getContext('2d');
        let py=250, vy=0, grav=0.5, obs=[], score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            vy+=grav; py+=vy; if(py<0||py>c.height) grav = grav>0?-0.5:0.5;
            if(Math.random()<0.02) obs.push({x:850, y:Math.random()*400, w:30, h:100+Math.random()*100});
            ctx.fillStyle='#facc15'; ctx.fillRect(100,py,30,30);
            ctx.fillStyle='#ef4444';
            for(let i=obs.length-1;i>=0;i--){ obs[i].x-=5; ctx.fillRect(obs[i].x,obs[i].y,obs[i].w,obs[i].h); if(100>obs[i].x-30 && 100<obs[i].x+obs[i].w && py>obs[i].y-30 && py<obs[i].y+obs[i].h){ score=0; obs=[]; break; } if(obs[i].x<-50) { obs.splice(i,1); score+=10; document.getElementById('score').innerText=score; } }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',()=>{ grav*=-1; vy=0; }); loop();
    `,
    76: `
        const c=document.getElementById('gameCanvas_76'); const ctx=c.getContext('2d');
        let vils=[], score=0, cx=400, cy=250;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            if(Math.random()<0.03) vils.push({x:Math.random()*700+50, y:Math.random()*400+50, life:100});
            ctx.fillStyle='#ef4444'; for(let i=vils.length-1;i>=0;i--){ vils[i].life--; ctx.beginPath(); ctx.arc(vils[i].x,vils[i].y,20,0,Math.PI*2); ctx.fill(); if(vils[i].life<=0) vils.splice(i,1); }
            ctx.strokeStyle='#0f0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-20,cy); ctx.lineTo(cx+20,cy); ctx.moveTo(cx,cy-20); ctx.lineTo(cx,cy+20); ctx.stroke(); ctx.beginPath(); ctx.arc(cx,cy,15,0,Math.PI*2); ctx.stroke();
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousemove',(e)=>{ const r=c.getBoundingClientRect(); cx=(e.clientX-r.left)*c.width/r.width; cy=(e.clientY-r.top)*c.height/r.height; });
        c.addEventListener('mousedown',()=>{ for(let i=vils.length-1;i>=0;i--){ if(Math.hypot(cx-vils[i].x, cy-vils[i].y)<25){ vils.splice(i,1); score+=10; document.getElementById('score').innerText=score; } } }); loop();
    `,
    77: `
        const c=document.getElementById('gameCanvas_77'); const ctx=c.getContext('2d');
        let angle=0, knives=[], thrown=[], score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            angle+=0.05; ctx.save(); ctx.translate(400,200); ctx.rotate(angle); ctx.fillStyle='#8b5cf6'; ctx.beginPath(); ctx.arc(0,0,80,0,Math.PI*2); ctx.fill();
            thrown.forEach(a=>{ ctx.save(); ctx.rotate(a); ctx.fillStyle='#cbd5e1'; ctx.fillRect(-4,80,8,40); ctx.restore(); }); ctx.restore();
            for(let i=knives.length-1;i>=0;i--){ knives[i].y-=15; ctx.fillStyle='#cbd5e1'; ctx.fillRect(knives[i].x-4,knives[i].y,8,40); if(knives[i].y<280){ thrown.push(Math.PI/2 - angle); knives.splice(i,1); score+=10; document.getElementById('score').innerText=score; } }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',()=>{ knives.push({x:400, y:500}); }); loop();
    `,
    78: `
        const c=document.getElementById('gameCanvas_78'); const ctx=c.getContext('2d');
        let lasers=[{y:100, d:1},{y:200, d:-1},{y:300, d:1}], px=400, py=450, score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#22c55e'; ctx.fillRect(0,0,c.width,50);
            lasers.forEach(l=>{ l.y+=l.d*2; if(l.y>400||l.y<50) l.d*=-1; ctx.fillStyle='#ef4444'; ctx.fillRect(0,l.y,c.width,5); if(py>l.y-15 && py<l.y+20){ py=450; score=0; } });
            ctx.fillStyle='#3b82f6'; ctx.fillRect(px-15,py-15,30,30);
            if(py<50){ score+=100; py=450; document.getElementById('score').innerText=score; }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowUp')py-=15; if(e.key==='ArrowDown')py+=15; }); loop();
    `,
    80: `
        const c=document.getElementById('gameCanvas_80'); const ctx=c.getContext('2d');
        let cardX=400, cardY=250, drag=false, sx, score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#ef4444'; ctx.fillText('FALSE', 100, 250); ctx.fillStyle='#22c55e'; ctx.fillText('TRUE', 650, 250);
            ctx.fillStyle='#fff'; ctx.fillRect(cardX-100, cardY-150, 200, 300);
            ctx.fillStyle='#000'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText('Statement', cardX, cardY);
            if(!drag && cardX!==400){ cardX+=(400-cardX)*0.1; }
            ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',(e)=>{ drag=true; const r=c.getBoundingClientRect(); sx=(e.clientX-r.left)*c.width/r.width - cardX; });
        c.addEventListener('mousemove',(e)=>{ if(drag){ const r=c.getBoundingClientRect(); cardX=(e.clientX-r.left)*c.width/r.width - sx; } });
        c.addEventListener('mouseup',()=>{ drag=false; if(cardX<200 || cardX>600){ score+=10; document.getElementById('score').innerText=score; cardX=400; } }); loop();
    `,
    81: `
        const c=document.getElementById('gameCanvas_81'); const ctx=c.getContext('2d');
        let eqs=[], score=0;
        setInterval(()=>eqs.push({x:Math.random()*700+50, y:-30, text:Math.floor(Math.random()*10)+'+'+Math.floor(Math.random()*10)}), 1500);
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#fff'; ctx.font='28px monospace';
            for(let i=eqs.length-1;i>=0;i--){ eqs[i].y+=1.5; ctx.fillText(eqs[i].text, eqs[i].x, eqs[i].y); if(eqs[i].y>c.height){ eqs.splice(i,1); score=Math.max(0,score-5); } }
            ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',(e)=>{ const r=c.getBoundingClientRect(); const cx=(e.clientX-r.left)*c.width/r.width, cy=(e.clientY-r.top)*c.height/r.height; for(let i=eqs.length-1;i>=0;i--){ if(Math.hypot(cx-eqs[i].x, cy-eqs[i].y)<40){ eqs.splice(i,1); score+=10; document.getElementById('score').innerText=score; break; } } }); loop();
    `,
    82: `
        const c=document.getElementById('gameCanvas_82'); const ctx=c.getContext('2d');
        let p=[{x:200,y:200,c:'#f87171'},{x:400,y:200,c:'#60a5fa'},{x:300,y:300,c:'#4ade80'}], drag=null, ox, oy, score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.strokeStyle='#fff'; ctx.strokeRect(550,150,100,100); ctx.strokeRect(650,150,100,100);
            p.forEach(b=>{ ctx.fillStyle=b.c; ctx.fillRect(b.x,b.y,100,100); });
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',(e)=>{ const r=c.getBoundingClientRect(); const cx=(e.clientX-r.left)*c.width/r.width, cy=(e.clientY-r.top)*c.height/r.height; for(let i=p.length-1;i>=0;i--){ if(cx>p[i].x && cx<p[i].x+100 && cy>p[i].y && cy<p[i].y+100){ drag=p[i]; ox=cx-p[i].x; oy=cy-p[i].y; break; } } });
        c.addEventListener('mousemove',(e)=>{ if(drag){ const r=c.getBoundingClientRect(); drag.x=(e.clientX-r.left)*c.width/r.width - ox; drag.y=(e.clientY-r.top)*c.height/r.height - oy; } });
        c.addEventListener('mouseup',()=>{ if(drag && drag.x>500){ score+=10; document.getElementById('score').innerText=score; } drag=null; }); loop();
    `,
    83: `
        const c=document.getElementById('gameCanvas_83'); const ctx=c.getContext('2d');
        let tgt={x:Math.random()*c.width, y:Math.random()*c.height}, pings=[], score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.strokeStyle='#38bdf8';
            for(let i=pings.length-1;i>=0;i--){ pings[i].r+=2; ctx.beginPath(); ctx.arc(pings[i].x, pings[i].y, pings[i].r, 0, Math.PI*2); ctx.globalAlpha=Math.max(0, 1-pings[i].r/200); ctx.stroke(); ctx.globalAlpha=1; if(pings[i].r>200)pings.splice(i,1); }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',(e)=>{ const r=c.getBoundingClientRect(); const cx=(e.clientX-r.left)*c.width/r.width, cy=(e.clientY-r.top)*c.height/r.height; pings.push({x:cx,y:cy,r:0}); let dist=Math.hypot(cx-tgt.x,cy-tgt.y); if(dist<50){ score+=50; document.getElementById('score').innerText=score; tgt={x:Math.random()*c.width, y:Math.random()*c.height}; } }); loop();
    `,
    84: `
        const c=document.getElementById('gameCanvas_84'); const ctx=c.getContext('2d');
        let drops=[], mx=400, my=250, score=0;
        setInterval(()=>drops.push({x:Math.random()*c.width, y:-20, t:String.fromCharCode(33+Math.random()*93)}), 100);
        function loop(){
            ctx.fillStyle='rgba(19,26,38,0.2)'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#22c55e'; ctx.font='20px monospace';
            for(let i=drops.length-1;i>=0;i--){ drops[i].y+=4; ctx.fillText(drops[i].t, drops[i].x, drops[i].y); if(Math.hypot(mx-drops[i].x, my-drops[i].y)<30){ drops.splice(i,1); score++; document.getElementById('score').innerText=score; } else if(drops[i].y>c.height) drops.splice(i,1); }
            ctx.fillStyle='#fff'; ctx.fillRect(mx-10,my-10,20,20);
            ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousemove',(e)=>{ const r=c.getBoundingClientRect(); mx=(e.clientX-r.left)*c.width/r.width; my=(e.clientY-r.top)*c.height/r.height; }); loop();
    `,
    85: `
        const c=document.getElementById('gameCanvas_85'); const ctx=c.getContext('2d');
        let pos=0, score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,250);
            pos+=0.1; score++; document.getElementById('score').innerText=Math.floor(score/10);
            for(let y=250;y<c.height;y+=5){ let w=(y-250)*3; let c1=(y+Math.floor(pos*100))%40<20?'#334155':'#475569'; ctx.fillStyle=c1; ctx.fillRect(400-w/2, y, w, 5); }
            ctx.fillStyle='#ef4444'; ctx.fillRect(350,380,100,50);
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+Math.floor(score/10), 20,40); requestAnimationFrame(loop);
        } loop();
    `,
    86: `
        const c=document.getElementById('gameCanvas_86'); const ctx=c.getContext('2d');
        let px=400, lanes=[200,400,600], obs=[], score=0, lIdx=1;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            lanes.forEach(lx=>{ ctx.fillStyle='#334155'; ctx.fillRect(lx-50,0,100,c.height); });
            if(Math.random()<0.03) obs.push({lane:Math.floor(Math.random()*3), y:-50});
            ctx.fillStyle='#ef4444';
            for(let i=obs.length-1;i>=0;i--){ obs[i].y+=6; ctx.fillRect(lanes[obs[i].lane]-40, obs[i].y, 80, 40); if(obs[i].lane===lIdx && Math.abs(obs[i].y-400)<40){ score=0; obs=[]; break; } if(obs[i].y>c.height){ obs.splice(i,1); score+=10; document.getElementById('score').innerText=score; } }
            px+=(lanes[lIdx]-px)*0.2; ctx.fillStyle='#38bdf8'; ctx.fillRect(px-30,380,60,60);
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowLeft'&&lIdx>0)lIdx--; if(e.key==='ArrowRight'&&lIdx<2)lIdx++; }); loop();
    `,
    87: `
        const c=document.getElementById('gameCanvas_87'); const ctx=c.getContext('2d');
        let tow=[{x:300,w:200,y:450}], curr={x:0,w:200,d:4}, score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            curr.x+=curr.d; if(curr.x<0||curr.x+curr.w>c.width)curr.d*=-1;
            ctx.fillStyle='#facc15'; ctx.fillRect(curr.x, 100, curr.w, 30);
            ctx.fillStyle='#94a3b8'; tow.forEach((t,i)=>ctx.fillRect(t.x, c.height-50-(tow.length-i)*30, t.w, 30));
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',()=>{ let tTop=tow[tow.length-1]; let over=Math.min(curr.x+curr.w, tTop.x+tTop.w)-Math.max(curr.x, tTop.x); if(over>0){ curr.w=over; curr.x=Math.max(curr.x, tTop.x); tow.push({x:curr.x, w:curr.w}); score+=10; document.getElementById('score').innerText=score; } else { tow=[{x:300,w:200}]; curr.w=200; score=0; } }); loop();
    `,
    88: `
        const c=document.getElementById('gameCanvas_88'); const ctx=c.getContext('2d');
        let ang=0, swing=0.05, ball=null, pins=Array(10).fill({life:1}), score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#e11d48'; ctx.beginPath(); ctx.moveTo(400,450); ctx.lineTo(400+Math.cos(ang)*50, 450+Math.sin(ang)*50); ctx.stroke();
            ang+=swing; if(ang>Math.PI||ang<0) swing*=-1;
            if(ball){ ball.x+=ball.vx; ball.y+=ball.vy; ctx.beginPath(); ctx.arc(ball.x,ball.y,15,0,Math.PI*2); ctx.fill(); if(ball.y<50){ ball=null; } }
            ctx.fillStyle='#fff'; ctx.fillRect(350,50,100,20);
            ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',()=>{ if(!ball) ball={x:400, y:450, vx:Math.cos(ang)*10, vy:Math.sin(ang)*10 - 5}; score+=10; document.getElementById('score').innerText=score; }); loop();
    `,
    89: `
        const c=document.getElementById('gameCanvas_89'); const ctx=c.getContext('2d');
        let arr=null, bal=[], score=0;
        setInterval(()=>{ if(Math.random()<0.5) bal.push({x:100+Math.random()*600, y:c.height, r:20, c:'#'+Math.floor(Math.random()*16777215).toString(16)}); }, 1000);
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            for(let i=bal.length-1;i>=0;i--){ bal[i].y-=2; ctx.fillStyle=bal[i].c; ctx.beginPath(); ctx.arc(bal[i].x,bal[i].y,bal[i].r,0,Math.PI*2); ctx.fill(); if(bal[i].y<-50) bal.splice(i,1); }
            if(arr){ arr.x+=arr.vx; arr.y+=arr.vy; arr.vy+=0.1; ctx.fillStyle='#fff'; ctx.fillRect(arr.x,arr.y,10,3); for(let i=bal.length-1;i>=0;i--){ if(Math.hypot(arr.x-bal[i].x, arr.y-bal[i].y)<bal[i].r){ bal.splice(i,1); arr=null; score+=10; document.getElementById('score').innerText=score; break; } } if(arr && arr.y>c.height) arr=null; }
            ctx.fillStyle='#38bdf8'; ctx.beginPath(); ctx.arc(400,450,30,Math.PI,0); ctx.stroke();
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',(e)=>{ if(!arr){ const r=c.getBoundingClientRect(); let dx=(e.clientX-r.left)*c.width/r.width-400, dy=(e.clientY-r.top)*c.height/r.height-450; let a=Math.atan2(dy,dx); arr={x:400,y:450,vx:Math.cos(a)*15,vy:Math.sin(a)*15}; } }); loop();
    `,
    90: `
        const c=document.getElementById('gameCanvas_90'); const ctx=c.getContext('2d');
        let cannon={x:400,y:450,a:-Math.PI/2}, balls=[], tgts=[], score=0;
        setInterval(()=>{ tgts.push({x:50+Math.random()*700, y:50, life:3}); }, 2000);
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#ef4444'; tgts.forEach(t=>{ t.y+=0.5; ctx.fillRect(t.x-20,t.y-20,40,40); ctx.fillStyle='#fff'; ctx.fillText(t.life, t.x-5, t.y+5); });
            for(let i=balls.length-1;i>=0;i--){ balls[i].x+=balls[i].vx; balls[i].y+=balls[i].vy; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(balls[i].x,balls[i].y,8,0,Math.PI*2); ctx.fill(); let hit=false; for(let j=tgts.length-1;j>=0;j--){ if(Math.hypot(balls[i].x-tgts[j].x, balls[i].y-tgts[j].y)<25){ tgts[j].life--; if(tgts[j].life<=0){ tgts.splice(j,1); score+=10; document.getElementById('score').innerText=score; } hit=true; break; } } if(hit || balls[i].y<0 || balls[i].x<0 || balls[i].x>c.width) balls.splice(i,1); }
            ctx.save(); ctx.translate(cannon.x,cannon.y); ctx.rotate(cannon.a); ctx.fillStyle='#64748b'; ctx.fillRect(0,-10,40,20); ctx.restore();
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousemove',(e)=>{ const r=c.getBoundingClientRect(); cannon.a=Math.atan2((e.clientY-r.top)*c.height/r.height-cannon.y, (e.clientX-r.left)*c.width/r.width-cannon.x); });
        c.addEventListener('mousedown',()=>{ balls.push({x:cannon.x,y:cannon.y,vx:Math.cos(cannon.a)*10,vy:Math.sin(cannon.a)*10}); }); loop();
    `,
    91: `
        const c=document.getElementById('gameCanvas_91'); const ctx=c.getContext('2d');
        let cards=Array(16).fill(0).map((_,i)=>({id:i%8, flip:false})).sort(()=>Math.random()-0.5);
        let sel=[], score=0;
        function draw(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            for(let i=0;i<16;i++){ let x=200+(i%4)*100, y=50+Math.floor(i/4)*100; ctx.fillStyle=cards[i].flip?'#fff':'#3b82f6'; ctx.fillRect(x,y,90,90); if(cards[i].flip){ ctx.fillStyle='#000'; ctx.font='36px sans-serif'; ctx.fillText(cards[i].id, x+30,y+60); } }
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Pairs: '+score, 20,40);
        }
        c.addEventListener('mousedown',(e)=>{ if(sel.length>=2)return; const r=c.getBoundingClientRect(); let x=(e.clientX-r.left)*c.width/r.width, y=(e.clientY-r.top)*c.height/r.height; let cIdx=Math.floor((x-200)/100) + Math.floor((y-50)/100)*4; if(cIdx>=0 && cIdx<16 && !cards[cIdx].flip){ cards[cIdx].flip=true; sel.push(cIdx); if(sel.length===2){ setTimeout(()=>{ if(cards[sel[0]].id===cards[sel[1]].id){ score++; document.getElementById('score').innerText=score; } else { cards[sel[0]].flip=false; cards[sel[1]].flip=false; } sel=[]; draw(); }, 1000); } draw(); } }); draw();
    `,
    92: `
        const c=document.getElementById('gameCanvas_92'); const ctx=c.getContext('2d');
        let px=350, bx=400, by=300, vx=4, vy=-4, bricks=[], score=0;
        for(let r=0;r<4;r++)for(let l=0;l<8;l++)bricks.push({x:100+l*80, y:50+r*30, st:true});
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#38bdf8'; ctx.fillRect(px,450,100,10);
            bx+=vx; by+=vy; if(bx<0||bx>c.width)vx*=-1; if(by<0)vy*=-1;
            if(by>440 && by<460 && bx>px && bx<px+100) vy*=-1;
            if(by>c.height){ bx=400; by=300; vx=4; vy=-4; }
            ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bx,by,8,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#ef4444'; bricks.forEach(b=>{ if(b.st){ ctx.fillRect(b.x,b.y,75,20); if(bx>b.x && bx<b.x+75 && by>b.y && by<b.y+20){ b.st=false; vy*=-1; score+=10; document.getElementById('score').innerText=score; } } });
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowLeft')px-=30; if(e.key==='ArrowRight')px+=30; }); loop();
    `,
    93: `
        const c=document.getElementById('gameCanvas_93'); const ctx=c.getContext('2d');
        let bub=[], score=0;
        for(let r=0;r<5;r++)for(let l=0;l<10;l++)bub.push({x:50+l*70, y:50+r*40, c:['#ef4444','#3b82f6','#22c55e'][Math.floor(Math.random()*3)]});
        function draw(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            bub.forEach(b=>{ ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,20,0,Math.PI*2); ctx.fill(); });
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40);
        }
        c.addEventListener('mousedown',(e)=>{ const r=c.getBoundingClientRect(); let x=(e.clientX-r.left)*c.width/r.width, y=(e.clientY-r.top)*c.height/r.height; for(let i=bub.length-1;i>=0;i--){ if(Math.hypot(x-bub[i].x, y-bub[i].y)<20){ bub.splice(i,1); score+=10; document.getElementById('score').innerText=score; draw(); break; } } }); draw();
    `,
    94: `
        const c=document.getElementById('gameCanvas_94'); const ctx=c.getContext('2d');
        let px=400, py=250, vy=0, plats=[{x:400,y:400},{x:200,y:200},{x:600,y:100}], score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            vy+=0.4; py+=vy;
            if(py<250){ let d=250-py; py=250; score+=Math.floor(d); document.getElementById('score').innerText=score; plats.forEach(p=>{ p.y+=d; if(p.y>c.height){ p.y=0; p.x=Math.random()*700; } }); }
            if(py>c.height){ py=250; score=0; }
            ctx.fillStyle='#22c55e'; plats.forEach(p=>{ ctx.fillRect(p.x,p.y,80,10); if(vy>0 && py+10>p.y && py<p.y+10 && px>p.x-10 && px<p.x+90){ vy=-12; } });
            ctx.fillStyle='#fff'; ctx.fillRect(px,py-15,20,20);
            ctx.font='24px sans-serif'; ctx.fillText('Height: '+score, 20,40); requestAnimationFrame(loop);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowLeft')px-=20; if(e.key==='ArrowRight')px+=20; }); loop();
    `,
    95: `
        const c=document.getElementById('gameCanvas_95'); const ctx=c.getContext('2d');
        let stack=[{x:300,w:200}], curr={x:0,w:200,y:400,d:5}, score=0;
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            curr.x+=curr.d; if(curr.x<0||curr.x+curr.w>c.width)curr.d*=-1;
            ctx.fillStyle='#facc15'; ctx.fillRect(curr.x, curr.y, curr.w, 30);
            ctx.fillStyle='#94a3b8'; stack.forEach((s,i)=>ctx.fillRect(s.x, 430-i*30, s.w, 30));
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousedown',()=>{ let tTop=stack[stack.length-1]; let over=Math.min(curr.x+curr.w, tTop.x+tTop.w)-Math.max(curr.x, tTop.x); if(over>0){ curr.w=over; curr.x=Math.max(curr.x, tTop.x); stack.push({x:curr.x, w:curr.w}); score+=10; document.getElementById('score').innerText=score; stack.forEach(s=>s.y+=30); curr.y-=30; } else { stack=[{x:300,w:200}]; curr.w=200; curr.y=400; score=0; } }); loop();
    `,
    96: `
        const c=document.getElementById('gameCanvas_96'); const ctx=c.getContext('2d');
        let bd=Array(9).fill(''), turn='X', score=0;
        function draw(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.strokeStyle='#fff'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(350,100); ctx.lineTo(350,400); ctx.moveTo(450,100); ctx.lineTo(450,400); ctx.moveTo(250,200); ctx.lineTo(550,200); ctx.moveTo(250,300); ctx.lineTo(550,300); ctx.stroke();
            ctx.fillStyle='#fff'; ctx.font='48px sans-serif'; ctx.textAlign='center';
            for(let i=0;i<9;i++){ if(bd[i]) ctx.fillText(bd[i], 300+(i%3)*100, 165+Math.floor(i/3)*100); }
            ctx.font='24px sans-serif'; ctx.textAlign='left'; ctx.fillText('Wins: '+score, 20,40);
        }
        c.addEventListener('mousedown',(e)=>{ const r=c.getBoundingClientRect(); let x=(e.clientX-r.left)*c.width/r.width, y=(e.clientY-r.top)*c.height/r.height; if(x>250&&x<550&&y>100&&y<400){ let idx=Math.floor((x-250)/100)+Math.floor((y-100)/100)*3; if(!bd[idx]){ bd[idx]='X'; draw(); setTimeout(()=>{ let mt=[]; bd.forEach((v,i)=>{if(!v)mt.push(i)}); if(mt.length>0)bd[mt[Math.floor(Math.random()*mt.length)]]='O'; draw(); },500); } } }); draw();
    `,
    97: `
        const c=document.getElementById('gameCanvas_97'); const ctx=c.getContext('2d');
        let px=0, py=0, goal={x:19,y:9}, score=0;
        function draw(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#22c55e'; ctx.fillRect(goal.x*40, goal.y*40, 40, 40);
            ctx.fillStyle='#38bdf8'; ctx.fillRect(px*40, py*40, 40, 40);
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Escapes: '+score, 20,40);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key==='ArrowUp'&&py>0)py--; if(e.key==='ArrowDown'&&py<11)py++; if(e.key==='ArrowLeft'&&px>0)px--; if(e.key==='ArrowRight'&&px<19)px++; if(px===goal.x && py===goal.y){ score++; document.getElementById('score').innerText=score; px=0; py=0; goal={x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*12)}; } draw(); }); draw();
    `,
    98: `
        const c=document.getElementById('gameCanvas_98'); const ctx=c.getContext('2d');
        let p=['#ef4444','#3b82f6','#22c55e','#facc15'], seq=[], user=[], state='wait', score=0, lit=-1;
        function draw(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            p.forEach((cl,i)=>{ ctx.fillStyle=lit===i?'#fff':cl; ctx.fillRect(200+(i%2)*110, 100+Math.floor(i/2)*110, 100,100); });
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40);
        }
        function play(){ seq.push(Math.floor(Math.random()*4)); user=[]; state='play'; let i=0; let t=setInterval(()=>{ lit=seq[i]; draw(); setTimeout(()=>{ lit=-1; draw(); },300); i++; if(i>=seq.length){ clearInterval(t); state='input'; } }, 600); }
        c.addEventListener('mousedown',(e)=>{ if(state!=='input')return; const r=c.getBoundingClientRect(); let x=(e.clientX-r.left)*c.width/r.width, y=(e.clientY-r.top)*c.height/r.height; let i=Math.floor((x-200)/110)+Math.floor((y-100)/110)*2; if(i>=0&&i<4){ lit=i; draw(); setTimeout(()=>{lit=-1;draw();},200); user.push(i); if(user[user.length-1]!==seq[user.length-1]){ score=0; seq=[]; document.getElementById('score').innerText=0; setTimeout(play,1000); } else if(user.length===seq.length){ score++; document.getElementById('score').innerText=score; setTimeout(play,1000); } } }); play();
    `,
    99: `
        const c=document.getElementById('gameCanvas_99'); const ctx=c.getContext('2d');
        let words=['HTML','CANVAS','ARCADE','NEXUS'], cur=0, txt='', score=0;
        function draw(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            let w=words[cur].split('').sort(()=>Math.random()-0.5).join('  ');
            ctx.fillStyle='#facc15'; ctx.font='36px monospace'; ctx.fillText(w, 300, 200);
            ctx.fillStyle='#fff'; ctx.fillText(txt, 300, 300);
            ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40);
        }
        window.addEventListener('keydown',(e)=>{ if(e.key.length===1) txt+=e.key.toUpperCase(); if(e.key==='Backspace') txt=txt.slice(0,-1); if(e.key==='Enter'){ if(txt===words[cur]){ score+=10; cur=(cur+1)%words.length; document.getElementById('score').innerText=score; } txt=''; } draw(); }); draw();
    `,
    100: `
        const c=document.getElementById('gameCanvas_100'); const ctx=c.getContext('2d');
        let ang=0, rays=[], ast=[], score=0;
        setInterval(()=>ast.push({x:Math.random()<0.5?-50:850, y:Math.random()*500}), 1500);
        function loop(){
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#8b5cf6'; ast.forEach((a,i)=>{ a.x+=(400-a.x)*0.01; a.y+=(250-a.y)*0.01; ctx.beginPath(); ctx.arc(a.x,a.y,15,0,Math.PI*2); ctx.fill(); if(Math.hypot(400-a.x, 250-a.y)<30){ ast=[]; score=0; } });
            ctx.strokeStyle='#38bdf8'; rays.forEach((r,i)=>{ r.x+=r.vx; r.y+=r.vy; ctx.beginPath(); ctx.moveTo(r.x,r.y); ctx.lineTo(r.x-r.vx, r.y-r.vy); ctx.stroke(); let hit=false; ast.forEach((a,j)=>{ if(Math.hypot(r.x-a.x, r.y-a.y)<20){ ast.splice(j,1); hit=true; score+=10; document.getElementById('score').innerText=score; } }); if(hit||r.x<0||r.x>c.width||r.y<0||r.y>c.height) rays.splice(i,1); });
            ctx.save(); ctx.translate(400,250); ctx.rotate(ang); ctx.fillStyle='#fff'; ctx.fillRect(-10,-10,20,20); ctx.fillRect(0,-3,30,6); ctx.restore();
            ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.fillText('Score: '+score, 20,40); requestAnimationFrame(loop);
        }
        c.addEventListener('mousemove',(e)=>{ const r=c.getBoundingClientRect(); ang=Math.atan2((e.clientY-r.top)*c.height/r.height-250, (e.clientX-r.left)*c.width/r.width-400); });
        c.addEventListener('mousedown',()=>{ rays.push({x:400,y:250,vx:Math.cos(ang)*15,vy:Math.sin(ang)*15}); }); loop();
    `
};

function getInstruction(id, title) {
    const inst = {
        59: "Use arrow keys to move the isometric cube to the targets.",
        61: "Click the block when it's perfectly in the center, regardless of speed.",
        62: "Click the floating hex clusters as they spawn across the canvas.",
        63: "Click the numbered dots in sequential order to connect the vector lines.",
        66: "Click the 4 drum pads to play hit transients and build a score.",
        70: "Watch the visual strobe sequence and repeat the pattern from memory.",
        72: "Catch the falling liquid particle gravity arrays to fill the bucket boundary box.",
        73: "Press Space to attack and deflect enemies coming from the right.",
        74: "Click and hold to attach a rope constraint and swing around the pivot.",
        75: "Click to instantly invert vertical gravity and avoid the oncoming blocks.",
        76: "Move the mouse to aim your sniper crosshair and click to shoot.",
        77: "Click to fire knives toward the continuously spinning circle vector.",
        78: "Use Up/Down arrows to navigate through the horizontal laser beams.",
        80: "Drag the card horizontally to evaluate the bounds for True or False.",
        81: "Solve the falling arithmetic equations and click them to intercept before they drop.",
        83: "Click to send out distance-based radar pings to find the invisible target.",
        84: "Move your mouse to intercept the vertical cascade falling matrix characters.",
        85: "Survive the Mode-7 style pseudo-3D horizontal road layout.",
        86: "Use Left/Right arrows to switch lanes and dodge the blocks.",
        87: "Drop building layers perfectly on top of each other to stack your tower.",
        88: "Time your click to release the bowling ball along the pendulum swing angle.",
        89: "Aim your bow and click to pop the ascending balloons.",
        90: "Move mouse to aim the turret and click to fire cannon balls.",
        91: "Click to flip and match the memory grid card pairs.",
        92: "Use Left/Right arrows to bounce the ball and compute elastic collision.",
        93: "Rapidly tap to clear the bubble array.",
        94: "Use Left/Right arrows to infinitely scroll and jump up the platforms.",
        95: "Click to horizontally drop the shifting blocks and stack the arena tower.",
        96: "Play Retro Tic-Tac-Toe against the integrated min-max evaluation engine.",
        97: "Use Arrow keys to navigate the node boundary traversal maze to the green goal.",
        98: "Memorize the sequence and replicate the array strings against the color matrix.",
        99: "Type the scrambled letters using the keyboard to match the original word.",
        100: "Move mouse to rotate 360 degrees and click to fire raycast project vectors."
    };
    return inst[id] || "Interact with the canvas to score points.";
}

let count = 0;
for (let i = 51; i <= 100; i++) {
    const fileLoc = path.join(targetDir, 'game'+i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');

        // Only inject if it's one of the new highly-unique engines
        if (uniqueEngines[i]) {
            const scriptMarker = '<script>';
            const closingMarker = '</script>';
            const startIdx = text.lastIndexOf(scriptMarker);
            const endIdx = text.lastIndexOf(closingMarker);

            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                const enginePayload = uniqueEngines[i];
                text = text.substring(0, startIdx) + scriptMarker + '\n' + enginePayload + '\n  ' + closingMarker + text.substring(endIdx + closingMarker.length);
            }

            // Replace instructions
            const title = titles[i] || ('Game ' + i);
            const newInstr = getInstruction(i, title);

            // Need to carefully find and replace instruction text ONLY
            const pStart = text.lastIndexOf('<p class="text-center text-gray-300 mt-2 font-medium text-lg px-4">');
            if (pStart !== -1) {
                const pEnd = text.indexOf('</p>', pStart);
                if (pEnd !== -1) {
                    const newP = '<p class="text-center text-gray-300 mt-2 font-medium text-lg px-4">\n      ' + newInstr + '\n    </p>';
                    text = text.substring(0, pStart) + newP + text.substring(pEnd + 4);
                }
            }

            // Remove legacy platformer descriptions if any are left inside the SEO blocks, though I removed the SEO blocks entirely.
            
            fs.writeFileSync(fileLoc, text, { encoding: 'utf8' });
            console.log('Updated Game ' + i + ' (' + title + ')');
            count++;
        }
    }
}
console.log('Successfully injected unique engines and instructions for ' + count + ' directories.');
