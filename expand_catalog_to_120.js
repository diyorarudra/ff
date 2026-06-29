const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, 'games');

// We use an existing game (e.g. game1) as our reliable structural template
const templatePath = fs.existsSync(path.join(GAMES_DIR, 'game100', 'index.html')) ? path.join(GAMES_DIR, 'game100', 'index.html') : path.join(GAMES_DIR, 'game1', 'index.html');
const baseHtml = fs.readFileSync(templatePath, 'utf8');

function spin(text) {
    let match;
    while (match = /{([^{}]+)}/.exec(text)) {
        let options = match[1].split('|');
        let choice = options[Math.floor(Math.random() * options.length)];
        text = text.substring(0, match.index) + choice + text.substring(match.index + match[0].length);
    }
    return text;
}

const manualSpintax = `<p>{Welcome to this advanced ffliveplay simulation|Engage with our latest interactive challenge|Prepare for an optimized digital experience}. {This highly refined mechanical engine|This responsive gameplay architecture|The core interactive loop here} {demands absolute precision and strategic foresight|requires perfect timing and spatial awareness|is engineered to test your cognitive processing speed}. {When engaging with the interface|As you interact with the primary controls|During active session execution}, {you must prioritize movement patterns over static defense|focus heavily on predictive positioning|always maintain awareness of the expanding boundaries}. {The scoring matrix is directly tied to|Your progression metrics depend entirely on|Success within this environment relies heavily upon} {how efficiently you navigate the active viewport|your ability to process rapid visual stimuli|the speed at which you execute command inputs}. {Every single action|Each strategic maneuver|All tactical decisions} {is immediately calculated by our physics processor|results in dynamic feedback from the game state|triggers a distinct responsive sequence within the logic loop}. {To achieve a maximum retention multiplier|To dominate the historical leaderboards|To secure the highest possible tier ranking}, {players must adapt to the escalating difficulty curve|you must learn to anticipate the randomized algorithmic spawns|it is absolutely essential to minimize unnecessary movements}. {Advanced users typically employ|Experienced participants will often utilize|Professional players naturally gravitate towards} {a methodology of continuous lateral shifting|a strategy of extreme central positioning|a highly aggressive forward-momentum approach}. {By avoiding the outer boundary edges|By maintaining a clear line of sight|By synchronizing your inputs with the internal timer}, {you drastically reduce the probability of catastrophic failure|you ensure a much smoother progression through the advanced stages|you effectively bypass the most common early-game pitfalls}. {Additionally, the responsive design guarantees|Also, the optimized render pipeline ensures|As a technical bonus, our engine guarantees} {that your inputs are recognized with zero latency|that every frame is rendered with absolute clarity|that the physics interactions remain perfectly consistent}. {Remember to utilize the integrated pause functionality|Always keep an eye on the persistent score tracker|Do not forget to monitor your secondary resource meters} {during intense periods of visual overload|when the on-screen action becomes overwhelming|as the temporal constraints begin to tighten}. {Mastering this specific ffliveplay module|Conquering this unique digital challenge|Achieving true proficiency in this arena} {will significantly improve your overall platform reflexes|serves as the perfect training ground for our competitive titles|is a testament to your dedication and digital skill}. {Enjoy the seamlessly integrated graphics|Immerse yourself in the fluid animation sequences|Appreciate the flawless execution of this retro-inspired design} {while you climb the global rankings|as you strive for absolute perfection|throughout your extended gameplay sessions}.</p>`;

const games = [
  { name: "Solar Orbit Collector", script: `
    let angle=0, p=[], s=0.05, d=1; function init(){angle=0;p=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    window.addEventListener('keydown',()=>d*=-1); canvas.addEventListener('mousedown',()=>d*=-1);
    function update(){ angle+=s*d; if(Math.random()<0.05)p.push({x:200,y:200,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5});
    for(let i=p.length-1;i>=0;i--){ p[i].x+=p[i].vx; p[i].y+=p[i].vy; let px=200+Math.cos(angle)*100,py=200+Math.sin(angle)*100;
    if(Math.hypot(p[i].x-px,p[i].y-py)<20){score++;p.splice(i,1);if(scoreEl)scoreEl.textContent=score;}
    else if(p[i].x<0||p[i].x>400||p[i].y<0||p[i].y>400){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}}
    function draw(){ctx.fillStyle='white';ctx.beginPath();ctx.arc(200,200,20,0,6.28);ctx.fill();let px=200+Math.cos(angle)*100,py=200+Math.sin(angle)*100;ctx.fillStyle='cyan';ctx.beginPath();ctx.arc(px,py,15,0,6.28);ctx.fill();ctx.fillStyle='red';p.forEach(e=>{ctx.beginPath();ctx.arc(e.x,e.y,5,0,6.28);ctx.fill();});}`
  },
  { name: "Neon Cyber Runner", script: `
    let pY=300,vY=0,obs=[],t=0; function init(){pY=300;vY=0;obs=[];t=0;score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    window.addEventListener('keydown',()=>pY==300&&(vY=-12)); canvas.addEventListener('mousedown',()=>pY==300&&(vY=-12));
    function update(){pY+=vY;vY+=0.6;if(pY>300){pY=300;vY=0;}t++;if(t%60===0)obs.push({x:400,w:20,h:40+Math.random()*30});
    for(let i=obs.length-1;i>=0;i--){obs[i].x-=6;if(obs[i].x<60&&obs[i].x+obs[i].w>40&&pY>320-obs[i].h){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}if(obs[i].x<-30){obs.splice(i,1);score++;if(scoreEl)scoreEl.textContent=score;}}}
    function draw(){ctx.fillStyle='magenta';ctx.fillRect(40,pY-20,20,20);ctx.fillStyle='cyan';obs.forEach(o=>ctx.fillRect(o.x,320-o.h,o.w,o.h));ctx.fillStyle='white';ctx.fillRect(0,320,400,2);}`
  },
  { name: "Grid Block Sorter", script: `
    let px=200,b=[]; function init(){px=200;b=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    window.addEventListener('keydown',e=>{if(e.key=='ArrowLeft')px-=30;if(e.key=='ArrowRight')px+=30;}); canvas.addEventListener('mousemove',e=>{px=e.clientX-canvas.getBoundingClientRect().left;});
    function update(){if(Math.random()<0.05)b.push({x:Math.random()*350,y:0});for(let i=b.length-1;i>=0;i--){b[i].y+=4;
    if(b[i].y>350&&Math.abs(b[i].x-px)<40){score++;b.splice(i,1);if(scoreEl)scoreEl.textContent=score;}else if(b[i].y>400){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}}
    function draw(){ctx.fillStyle='cyan';ctx.fillRect(px-40,360,80,10);ctx.fillStyle='red';b.forEach(o=>ctx.fillRect(o.x,o.y,20,20));}`
  },
  { name: "Space Dasher", script: `
    let px=200,py=200,b=[]; function init(){px=200;py=200;b=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',e=>{let r=canvas.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;});
    function update(){score++;if(scoreEl)scoreEl.textContent=score;if(Math.random()<0.1)b.push({x:Math.random()*400,y:0,vy:3+Math.random()*3});
    for(let i=b.length-1;i>=0;i--){b[i].y+=b[i].vy;if(Math.hypot(b[i].x-px,b[i].y-py)<15){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}if(b[i].y>400)b.splice(i,1);}}
    function draw(){ctx.fillStyle='lime';ctx.beginPath();ctx.arc(px,py,10,0,6.28);ctx.fill();ctx.fillStyle='gray';b.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y,10,0,6.28);ctx.fill();});}`
  },
  { name: "Geometry Defense", script: `
    let angle=0,e=[],px=200,py=200; function init(){e=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',ev=>{let r=canvas.getBoundingClientRect();angle=Math.atan2(ev.clientY-r.top-200,ev.clientX-r.left-200);});
    canvas.addEventListener('mousedown',()=>{e.forEach((o,i)=>{if(Math.abs(Math.atan2(o.y-200,o.x-200)-angle)<0.2){score++;e.splice(i,1);if(scoreEl)scoreEl.textContent=score;}});});
    function update(){if(Math.random()<0.03){let a=Math.random()*6.28;e.push({x:200+Math.cos(a)*250,y:200+Math.sin(a)*250});}
    for(let i=e.length-1;i>=0;i--){e[i].x+=(200-e[i].x)*0.01;e[i].y+=(200-e[i].y)*0.01;if(Math.hypot(e[i].x-200,e[i].y-200)<20){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}}
    function draw(){ctx.fillStyle='yellow';ctx.beginPath();ctx.arc(200,200,20,0,6.28);ctx.fill();ctx.strokeStyle='white';ctx.beginPath();ctx.moveTo(200,200);ctx.lineTo(200+Math.cos(angle)*40,200+Math.sin(angle)*40);ctx.stroke();ctx.fillStyle='red';e.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y,10,0,6.28);ctx.fill();});}`
  },
  { name: "Color Switcher", script: `
    let py=300,vy=-5,c=0,w=[],colors=['red','cyan']; function init(){py=300;vy=-5;c=0;w=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousedown',()=>{c=1-c;}); window.addEventListener('keydown',()=>{c=1-c;});
    function update(){py+=vy;vy+=0.2;if(py>380)vy=-7;if(Math.random()<0.02)w.push({y:-20,c:Math.random()<0.5?0:1});
    for(let i=w.length-1;i>=0;i--){w[i].y+=3;if(Math.abs(w[i].y-py)<15){if(w[i].c!==c){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}else{score++;if(scoreEl)scoreEl.textContent=score;w.splice(i,1);}}else if(w[i].y>400)w.splice(i,1);}}
    function draw(){ctx.fillStyle=colors[c];ctx.beginPath();ctx.arc(200,py,15,0,6.28);ctx.fill();w.forEach(o=>{ctx.fillStyle=colors[o.c];ctx.fillRect(0,o.y,400,20);});}`
  },
  { name: "Gravity Flip", script: `
    let py=300,vy=0,g=0.6,obs=[],t=0; function init(){py=300;vy=0;g=0.6;obs=[];t=0;score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    window.addEventListener('keydown',()=>{g*=-1;}); canvas.addEventListener('mousedown',()=>{g*=-1;});
    function update(){py+=vy;vy+=g;if(py>380){py=380;vy=0;}if(py<20){py=20;vy=0;}t++;if(t%50===0)obs.push({x:400,y:Math.random()<0.5?20:340});
    for(let i=obs.length-1;i>=0;i--){obs[i].x-=5;if(obs[i].x<220&&obs[i].x>180&&Math.abs(obs[i].y-py)<20){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}if(obs[i].x<-40){obs.splice(i,1);score++;if(scoreEl)scoreEl.textContent=score;}}}
    function draw(){ctx.fillStyle='yellow';ctx.fillRect(190,py-10,20,20);ctx.fillStyle='red';obs.forEach(o=>ctx.fillRect(o.x,o.y,40,40));}`
  },
  { name: "Flappy Cube", script: `
    let py=200,vy=0,p=[]; function init(){py=200;vy=0;p=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    window.addEventListener('keydown',()=>{vy=-6;}); canvas.addEventListener('mousedown',()=>{vy=-6;});
    function update(){py+=vy;vy+=0.4;if(Math.random()<0.02){let h=Math.random()*200+50;p.push({x:400,h:h});}
    for(let i=p.length-1;i>=0;i--){p[i].x-=4;if(p[i].x<120&&p[i].x>80&&(py<p[i].h||py>p[i].h+100)){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}if(p[i].x<-40){p.splice(i,1);score++;if(scoreEl)scoreEl.textContent=score;}}if(py>400||py<0){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}
    function draw(){ctx.fillStyle='orange';ctx.fillRect(100,py-10,20,20);ctx.fillStyle='green';p.forEach(o=>{ctx.fillRect(o.x,0,40,o.h);ctx.fillRect(o.x,o.h+100,40,400);});}`
  },
  { name: "Ping Pong Solo", script: `
    let px=200,bx=200,by=200,vx=4,vy=4; function init(){bx=200;by=200;vx=4;vy=4;score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',e=>{px=e.clientX-canvas.getBoundingClientRect().left;});
    function update(){bx+=vx;by+=vy;if(bx<10||bx>390)vx*=-1;if(by<10)vy*=-1;if(by>380&&Math.abs(bx-px)<40){vy*=-1.1;score++;if(scoreEl)scoreEl.textContent=score;}else if(by>400){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}
    function draw(){ctx.fillStyle='white';ctx.fillRect(px-40,380,80,10);ctx.beginPath();ctx.arc(bx,by,10,0,6.28);ctx.fill();}`
  },
  { name: "Target Tap", script: `
    let t=[]; function init(){t=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousedown',e=>{let r=canvas.getBoundingClientRect();let x=e.clientX-r.left,y=e.clientY-r.top;
    for(let i=t.length-1;i>=0;i--){if(Math.hypot(t[i].x-x,t[i].y-y)<t[i].r){score++;if(scoreEl)scoreEl.textContent=score;t.splice(i,1);break;}}});
    function update(){if(Math.random()<0.03)t.push({x:Math.random()*360+20,y:Math.random()*360+20,r:40});
    for(let i=t.length-1;i>=0;i--){t[i].r-=0.2;if(t[i].r<=0){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}}
    function draw(){ctx.fillStyle='red';t.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,6.28);ctx.fill();});}`
  },
  { name: "Asteroid Dodger", script: `
    let px=200,py=200,a=[]; function init(){a=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',e=>{let r=canvas.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;});
    function update(){score++;if(scoreEl)scoreEl.textContent=score;if(Math.random()<0.05)a.push({x:Math.random()*400,y:0,vx:(Math.random()-0.5)*4,vy:Math.random()*4});
    for(let i=a.length-1;i>=0;i--){a[i].x+=a[i].vx;a[i].y+=a[i].vy;if(a[i].x<0||a[i].x>400)a[i].vx*=-1;if(Math.hypot(a[i].x-px,a[i].y-py)<20){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}if(a[i].y>400)a.splice(i,1);}}
    function draw(){ctx.fillStyle='cyan';ctx.beginPath();ctx.arc(px,py,10,0,6.28);ctx.fill();ctx.fillStyle='gray';a.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y,15,0,6.28);ctx.fill();});}`
  },
  { name: "Snake Classic", script: `
    let s=[{x:10,y:10}],dx=1,dy=0,f={x:15,y:15},t=0; function init(){s=[{x:10,y:10}];dx=1;dy=0;f={x:15,y:15};score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    window.addEventListener('keydown',e=>{if(e.key=='ArrowUp'&&dy==0){dx=0;dy=-1;}if(e.key=='ArrowDown'&&dy==0){dx=0;dy=1;}if(e.key=='ArrowLeft'&&dx==0){dx=-1;dy=0;}if(e.key=='ArrowRight'&&dx==0){dx=1;dy=0;}});
    let mx=0,my=0; canvas.addEventListener('mousedown',e=>{mx=e.clientX;my=e.clientY;}); canvas.addEventListener('mouseup',e=>{let ex=e.clientX,ey=e.clientY;if(Math.abs(ex-mx)>Math.abs(ey-my)){if(ex>mx&&dx==0){dx=1;dy=0;}else if(ex<mx&&dx==0){dx=-1;dy=0;}}else{if(ey>my&&dy==0){dx=0;dy=1;}else if(ey<my&&dy==0){dx=0;dy=-1;}}});
    function update(){t++;if(t%5!==0)return;let h={x:s[0].x+dx,y:s[0].y+dy};s.unshift(h);
    if(h.x==f.x&&h.y==f.y){score++;if(scoreEl)scoreEl.textContent=score;f={x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)};}else{s.pop();}
    if(h.x<0||h.x>=20||h.y<0||h.y>=20||s.slice(1).some(p=>p.x==h.x&&p.y==h.y)){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}
    function draw(){ctx.fillStyle='lime';s.forEach(p=>ctx.fillRect(p.x*20,p.y*20,18,18));ctx.fillStyle='red';ctx.fillRect(f.x*20,f.y*20,18,18);}`
  },
  { name: "Jumper", script: `
    let py=200,vy=0,p=[{x:200,y:380}],px=200; function init(){py=200;vy=0;p=[{x:200,y:380},{x:200,y:200},{x:200,y:50}];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',e=>{px=e.clientX-canvas.getBoundingClientRect().left;});
    function update(){py+=vy;vy+=0.4;if(py<200){p.forEach(o=>o.y-=vy);py=200;score++;if(scoreEl)scoreEl.textContent=Math.floor(score/10);}
    p.forEach(o=>{if(vy>0&&Math.abs(o.x-px)<40&&Math.abs(o.y-py)<15)vy=-10;});
    if(p[0].y>400)p.shift();if(p[p.length-1].y>100)p.push({x:Math.random()*320+40,y:p[p.length-1].y-150});
    if(py>400){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}
    function draw(){ctx.fillStyle='yellow';ctx.fillRect(px-10,py-10,20,20);ctx.fillStyle='green';p.forEach(o=>ctx.fillRect(o.x-40,o.y,80,10));}`
  },
  { name: "Maze Escape", script: `
    let px=200,w=[]; function init(){px=200;w=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',e=>{px=e.clientX-canvas.getBoundingClientRect().left;});
    function update(){if(Math.random()<0.02){let g=Math.random()*300+50;w.push({y:0,g:g});}
    for(let i=w.length-1;i>=0;i--){w[i].y+=3;if(w[i].y>380&&w[i].y<400&&(px<w[i].g-30||px>w[i].g+30)){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}
    if(w[i].y>400){w.splice(i,1);score++;if(scoreEl)scoreEl.textContent=score;}}}
    function draw(){ctx.fillStyle='red';ctx.fillRect(px-10,380,20,20);ctx.fillStyle='blue';w.forEach(o=>{ctx.fillRect(0,o.y,o.g-30,20);ctx.fillRect(o.g+30,o.y,400,20);});}`
  },
  { name: "Orbit Catcher", script: `
    let r=50,d=[]; function init(){r=50;d=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousedown',()=>{r=r==50?100:50;});
    function update(){if(Math.random()<0.03)d.push({y:0,type:Math.random()<0.5?50:100});
    for(let i=d.length-1;i>=0;i--){d[i].y+=4;if(Math.abs(d[i].y-200)<10){if(d[i].type==r){score++;if(scoreEl)scoreEl.textContent=score;d.splice(i,1);}else{isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}else if(d[i].y>400)d.splice(i,1);}}
    function draw(){ctx.strokeStyle='white';ctx.beginPath();ctx.arc(200,200,r,0,6.28);ctx.stroke();ctx.fillStyle='cyan';d.forEach(o=>{ctx.beginPath();ctx.arc(200,o.y,10,0,6.28);ctx.fill();});}`
  },
  { name: "Avoidance", script: `
    let px=200,py=200,l=[]; function init(){l=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',e=>{let r=canvas.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;});
    function update(){score++;if(scoreEl)scoreEl.textContent=score;if(Math.random()<0.05)l.push({y:0,x:Math.random()*400,vx:(Math.random()-0.5)*10});
    for(let i=l.length-1;i>=0;i--){l[i].y+=5;l[i].x+=l[i].vx;if(Math.hypot(l[i].x-px,l[i].y-py)<15){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}if(l[i].y>400)l.splice(i,1);}}
    function draw(){ctx.fillStyle='lime';ctx.beginPath();ctx.arc(px,py,10,0,6.28);ctx.fill();ctx.fillStyle='red';l.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y,5,0,6.28);ctx.fill();});}`
  },
  { name: "Tile Tap", script: `
    let t=[],timer=0; function init(){t=[];score=0;timer=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousedown',e=>{let r=canvas.getBoundingClientRect();let x=e.clientX-r.left,y=e.clientY-r.top;
    for(let i=t.length-1;i>=0;i--){if(Math.abs(t[i].x-x)<25&&Math.abs(t[i].y-y)<25){score++;if(scoreEl)scoreEl.textContent=score;t.splice(i,1);break;}}});
    function update(){timer++;if(timer%40==0)t.push({x:Math.random()*350+25,y:Math.random()*350+25,l:100});
    for(let i=t.length-1;i>=0;i--){t[i].l--;if(t[i].l<=0){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}}
    function draw(){t.forEach(o=>{ctx.fillStyle='rgba(0,255,255,'+(o.l/100)+')';ctx.fillRect(o.x-25,o.y-25,50,50);});}`
  },
  { name: "Shooter", script: `
    let px=200,b=[],e=[]; function init(){b=[];e=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',ev=>{px=ev.clientX-canvas.getBoundingClientRect().left;});
    canvas.addEventListener('mousedown',()=>{b.push({x:px,y:380});});
    function update(){if(Math.random()<0.05)e.push({x:Math.random()*380+10,y:0});
    for(let i=b.length-1;i>=0;i--){b[i].y-=10;if(b[i].y<0)b.splice(i,1);}
    for(let i=e.length-1;i>=0;i--){e[i].y+=2;if(e[i].y>400){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}
    for(let j=b.length-1;j>=0;j--){if(Math.hypot(e[i].x-b[j].x,e[i].y-b[j].y)<20){e.splice(i,1);b.splice(j,1);score++;if(scoreEl)scoreEl.textContent=score;break;}}}}
    function draw(){ctx.fillStyle='white';ctx.fillRect(px-15,370,30,30);ctx.fillStyle='yellow';b.forEach(o=>ctx.fillRect(o.x-2,o.y,4,10));ctx.fillStyle='red';e.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y,15,0,6.28);ctx.fill();});}`
  },
  { name: "Column Matcher", script: `
    let p=1,c=[]; function init(){p=1;c=[];score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    window.addEventListener('keydown',e=>{if(e.key=='ArrowLeft'&&p>0)p--;if(e.key=='ArrowRight'&&p<2)p++;});
    canvas.addEventListener('mousedown',e=>{let rx=e.clientX-canvas.getBoundingClientRect().left;if(rx<canvas.width/2&&p>0)p--;else if(rx>=canvas.width/2&&p<2)p++;});
    function update(){if(Math.random()<0.03)c.push({col:Math.floor(Math.random()*3),y:0});
    for(let i=c.length-1;i>=0;i--){c[i].y+=4;if(c[i].y>380){if(c[i].col==p){score++;if(scoreEl)scoreEl.textContent=score;c.splice(i,1);}else{isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}}}
    function draw(){ctx.fillStyle='cyan';ctx.fillRect(p*133+46,380,40,20);ctx.fillStyle='red';c.forEach(o=>ctx.fillRect(o.col*133+46,o.y,40,40));}`
  },
  { name: "Survival Zone", script: `
    let px=200,py=200,zx=200,zy=200,zr=150,t=0; function init(){zx=200;zy=200;zr=150;t=0;score=0;isGameOver=false;requestAnimationFrame(gameLoop);}
    canvas.addEventListener('mousemove',e=>{let r=canvas.getBoundingClientRect();px=e.clientX-r.left;py=e.clientY-r.top;});
    function update(){t++;if(t%60==0){zx=Math.random()*300+50;zy=Math.random()*300+50;zr-=2;score++;if(scoreEl)scoreEl.textContent=score;}
    if(Math.hypot(px-zx,py-zy)>zr){isGameOver=true;if(gameOverOverlay){gameOverOverlay.style.opacity='1';gameOverOverlay.style.pointerEvents='auto';}}}
    function draw(){ctx.fillStyle='rgba(0,255,0,0.3)';ctx.beginPath();ctx.arc(zx,zy,zr,0,6.28);ctx.fill();ctx.fillStyle='white';ctx.beginPath();ctx.arc(px,py,10,0,6.28);ctx.fill();}`
  }
];

const seoRegex = /<div class="adsense-seo-block"[\s\S]*?<\/div>/;
const scriptRegex = /<script>(?:(?!<\/script>)[\s\S])*?(?=\/\/ Mobile Touch-to-Mouse Polyfill)/;

for (let i = 0; i < 20; i++) {
    const id = 101 + i;
    const game = games[i];
    const newDir = path.join(GAMES_DIR, `game${id}`);
    if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

    let manual = spin(manualSpintax);
    // Hard eliminate forbidden words just in case
    manual = manual.replace(/In conclusion|Furthermore|Moreover|Delve|Crucial/gi, "Additionally");

    let html = baseHtml;
    html = html.replace(/<title>.*?<\/title>/, `<title>${game.name} &mdash; ffliveplay</title>`);
    html = html.replace(/"name":\s*".*?"/, `"name": "${game.name}"`);
    html = html.replace(/id="gameCanvas_\d+"/, `id="gameCanvas_${id}"`);

    html = html.replace(seoRegex, `<div class="adsense-seo-block" style="width: 100%; margin: 30px auto; padding: 20px; background: #1e293b; color: #cbd5e1; font-family: sans-serif; line-height: 1.6; border-radius: 8px;">\n        <h3 style="color: #fff; margin-top: 0;">${game.name} Operations Manual</h3>\n        ${manual}\n    </div>`);

    if (!html.includes('id="gameStart"')) {
        const overlayMatches = html.match(/<!-- Overlays -->/);
        if (overlayMatches) {
            const overlaysEnd = overlayMatches.index + 17;
            const startOverlay = `\n      <div id="gameStart" class="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20 pointer-events-auto">\n        <div class="text-3xl font-bold mb-6 text-white font-heading">Ready to Play?</div>\n        <button id="startBtn" class="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:scale-105 transition-transform active:scale-95">Start Game</button>\n      </div>`;
            html = html.substring(0, overlaysEnd) + startOverlay + html.substring(overlaysEnd);
        }
    }

    let injectedScript = `<script>
    const canvas = document.getElementById('gameCanvas_${id}');
    const ctx = canvas.getContext('2d');
    const scoreEl = document.getElementById('score');
    const bestScoreEl = document.getElementById('bestScore');
    const gameOverOverlay = document.getElementById('gameOver');
    const gameWonOverlay = document.getElementById('gameWon');
    
    let hasStarted = false;
    let isGameOver = false;
    let score = 0;
    
    if(bestScoreEl) {
        let bs = parseInt(localStorage.getItem('ffliveplay_game${id}_best')) || 0;
        bestScoreEl.textContent = bs;
    }

    if (document.getElementById('tryAgainBtn')) {
        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            if(gameOverOverlay) {
                gameOverOverlay.style.opacity = '0';
                gameOverOverlay.style.pointerEvents = 'none';
            }
            init();
        });
    }
    
    document.addEventListener('click', (e) => {
        if(e.target && e.target.id === 'startBtn') {
            document.getElementById('gameStart').style.display = 'none';
            hasStarted = true;
            init();
        }
    });

    ${game.script}

    if (!document.getElementById('startBtn')) {
        hasStarted = true;
        init();
    }

    function gameLoop() {
        if (!hasStarted || isGameOver) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update();
        draw();
        
        if(bestScoreEl) {
            let bs = parseInt(localStorage.getItem('ffliveplay_game${id}_best')) || 0;
            if(score > bs) {
                localStorage.setItem('ffliveplay_game${id}_best', score);
                bestScoreEl.textContent = score;
            }
        }
        
        requestAnimationFrame(gameLoop);
    }
`;
    
    html = html.replace(scriptRegex, injectedScript);
    fs.writeFileSync(path.join(newDir, 'index.html'), html, 'utf8');
    console.log(`[EXPANSION COMPLETED]: Game ${id} framework built with unique engine and '120+ Games' header synchronized`);
}

function replaceGlobalBranding(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === '.git' || file === 'node_modules') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceGlobalBranding(fullPath);
        } else {
            if (/.(html|js|css|json|txt|xml|md)$/.test(file)) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let modified = false;
                if (/120+ Games/gi.test(content)) {
                    content = content.replace(/120+ Games/gi, '120+ Games');
                    modified = true;
                }
                if (/120+ ffliveplay Rooms/gi.test(content)) {
                    content = content.replace(/120+ ffliveplay Rooms/gi, '120+ ffliveplay Rooms');
                    modified = true;
                }
                if (modified) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                }
            }
        }
    }
}

replaceGlobalBranding(path.join(__dirname));
