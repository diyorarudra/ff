const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

// --- THE TRIPLE BASE ENGINE ARCHITECTURE POOL ---
const genericEngines = {
    "action": `
        // --- ADAPTIVE ACTION/ARCADE ENGINE ---
        const canvas = document.getElementById('canvas_node');
        const ctx = canvas.getContext('2d');
        let playerX = 400, playerY = 430, score = 0, isOver = false, items = [];
        function spawnGeometry() { if(!isOver) { items.push({ x: Math.random()*(canvas.width-30), y: -20, size: 20+Math.random()*15, speed: 3+Math.random()*3 }); setTimeout(spawnGeometry, 800); } }
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='28px sans-serif'; ctx.textAlign='center'; ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#6366f1'; ctx.fillRect(playerX - 20, playerY - 20, 40, 40); // Player Node
            for(let i=items.length-1; i>=0; i--) {
                let m = items[i]; m.y += m.speed;
                ctx.fillStyle = '#f43f5e'; ctx.fillRect(m.x, m.y, m.size, m.size);
                if(m.y > canvas.height) { items.splice(i,1); score += 5; }
                if(m.x < playerX + 20 && m.x + m.size > playerX - 20 && m.y < playerY + 20 && m.y + m.size > playerY - 20) isOver = true;
            }
            ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.textAlign='left'; ctx.fillText('Score: ' + score, 30, 40);
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); const scaleX = canvas.width/r.width; playerX = (e.clientX - r.left)*scaleX; });
        spawnGeometry(); loop();
    `,
    "brain": `
        // --- ADAPTIVE BRAIN/MYSTERY ENGINE ---
        const canvas = document.getElementById('canvas_node');
        const ctx = canvas.getContext('2d');
        let tiles = [], selected = [], score = 0, pairsFound = 0;
        function initMatrix() {
            let values = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8];
            values.sort(() => Math.random() - 0.5);
            // Dynamic centering based on standard 400x400 canvas
            for(let i=0; i<16; i++) {
                tiles.push({ id: i, val: values[i], open: false, x: 20 + (i%4)*90, y: 30 + Math.floor(i/4)*90, w: 80, h: 80 });
            }
        }
        function drawMatrix() {
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            tiles.forEach(t => {
                ctx.fillStyle = t.open ? '#1e293b' : '#3b82f6';
                ctx.fillRect(t.x, t.y, t.w, t.h);
                if(t.open) { ctx.fillStyle='#fff'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText(t.val, t.x+40, t.y+45); }
            });
            ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.textAlign='left'; ctx.fillText('Matches: ' + pairsFound + '/8', 10, 20);
        }
        canvas.addEventListener('click', (e) => {
            if(selected.length >= 2) return;
            const r = canvas.getBoundingClientRect();
            const scaleX = canvas.width / r.width;
            const scaleY = canvas.height / r.height;
            const mx = (e.clientX - r.left) * scaleX, my = (e.clientY - r.top) * scaleY;
            tiles.forEach(t => {
                if(!t.open && mx > t.x && mx < t.x + t.w && my > t.y && my < t.y + t.h) {
                    t.open = true; selected.push(t); drawMatrix();
                    if(selected.length === 2) {
                        setTimeout(() => {
                            if(selected[0].val === selected[1].val) { pairsFound++; }
                            else { selected[0].open = false; selected[1].open = false; }
                            selected = []; drawMatrix();
                        }, 600);
                    }
                }
            });
        });
        initMatrix(); drawMatrix();
    `,
    "casual": `
        // --- ADAPTIVE CASUAL/RHYTHM ENGINE ---
        const canvas = document.getElementById('canvas_node');
        const ctx = canvas.getContext('2d');
        let targetX = 200, targetY = 200, radius = 40, score = 0;
        function relocateTarget() { targetX = Math.random()*(canvas.width-80)+40; targetY = Math.random()*(canvas.height-80)+40; radius = 40; }
        function tick() {
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            radius -= 0.5;
            if(radius <= 5) relocateTarget();
            ctx.beginPath(); ctx.arc(targetX, targetY, radius, 0, Math.PI*2); ctx.fillStyle = '#10b981'; ctx.fill(); ctx.closePath();
            ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.textAlign='left'; ctx.fillText('Score: ' + score, 10, 25);
            requestAnimationFrame(tick);
        }
        canvas.addEventListener('mousedown', (e) => {
            const r = canvas.getBoundingClientRect();
            const scaleX = canvas.width / r.width;
            const scaleY = canvas.height / r.height;
            let dist = Math.hypot(((e.clientX - r.left)*scaleX) - targetX, ((e.clientY - r.top)*scaleY) - targetY);
            if(dist < radius + 10) { score += 10; relocateTarget(); }
        });
        tick();
    `
};

// --- CORE PROGRAMMATIC LOGIC HYDRATION ARRAYS ---
const customPayloads = {
    "game_51": `
        const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
        let planeY = 250, velocity = 0, gravity = 0.4, score = 0, isOver = false, pipes = [];
        function loop() {
            if(isOver) { ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#ef4444'; ctx.font='24px sans-serif'; ctx.textAlign='center'; ctx.fillText('Game Over', canvas.width/2, canvas.height/2); return; }
            velocity += gravity; planeY += velocity;
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(100, planeY, 25, 15);
            if(pipes.length === 0 || pipes[pipes.length-1].x < canvas.width - 250) pipes.push({ x: canvas.width, gapTop: 100 + Math.random()*150, passed: false });
            for(let i=pipes.length-1; i>=0; i--) {
                let p = pipes[i]; p.x -= 3;
                ctx.fillStyle = '#334155'; ctx.fillRect(p.x, 0, 50, p.gapTop); ctx.fillRect(p.x, p.gapTop+130, 50, canvas.height);
                if(p.x < 100 && !p.passed) { score++; p.passed = true; }
                if(p.x < -60) pipes.splice(i,1);
                if(100 > p.x && 100 < p.x+50 && (planeY < p.gapTop || planeY+15 > p.gapTop+130)) isOver = true;
            }
            if(planeY > canvas.height || planeY < 0) isOver = true;
            ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.textAlign='left'; ctx.fillText('Score: ' + score, 10, 25); requestAnimationFrame(loop);
        }
        canvas.addEventListener('click', () => { velocity = -6.5; }); loop();
    `,
    "game_52": `
        const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
        let pixelGrid = Array(16).fill().map(() => Array(16).fill('#131a26'));
        function redraw() {
            ctx.clearRect(0,0,canvas.width,canvas.height);
            // Centered 16x16 grid with 20px size
            for(let r=0; r<16; r++) { for(let c=0; c<16; c++) { ctx.fillStyle=pixelGrid[r][c]; ctx.fillRect(c*20+40, r*20+40, 19, 19); } }
        }
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
            const c = Math.floor(((e.clientX - rect.left)*scaleX - 40)/20), r = Math.floor(((e.clientY - rect.top)*scaleY - 40)/20);
            if(r>=0 && r<16 && c>=0 && c<16) { pixelGrid[r][c] = '#8b5cf6'; redraw(); }
        });
        redraw();
    `,
    "game_55": `
        const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
        let bx = 150, by = 300, active = false, vx = 0, vy = 0, score = 0, sx, sy;
        function run() {
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(320, 150, 60, 6);
            if(active) { vy += 0.35; bx += vx; by += vy; if(bx > 310 && bx < 380 && by > 140 && by < 170 && vy > 0) { score++; active = false; bx = 150; by = 300; } if(by > 450) { active = false; bx = 150; by = 300; } }
            ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.textAlign='left'; ctx.fillText('Score: ' + score, 10, 25); requestAnimationFrame(run);
        }
        canvas.addEventListener('mousedown', (e) => { if(!active) { const r=canvas.getBoundingClientRect(); sx=e.clientX-r.left; sy=e.clientY-r.top; } });
        canvas.addEventListener('mouseup', (e) => { if(!active && sx) { const r=canvas.getBoundingClientRect(); const scX=canvas.width/r.width, scY=canvas.height/r.height; vx=(sx-(e.clientX-r.left))*scX*0.12; vy=(sy-(e.clientY-r.top))*scY*0.12; active=true; } });
        run();
    `,
    "game_56": `
        const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
        const bank = [{ q: "What is standard corporate GST slab?", a: ["5%", "12%", "18%", "40%"], c: 2 }];
        let score = 0, completed = false;
        function render() {
            ctx.fillStyle = '#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            if(completed) { ctx.fillStyle='#10b981'; ctx.font='22px sans-serif'; ctx.textAlign='center'; ctx.fillText('Correct Answer Logged!', canvas.width/2, 250); return; }
            ctx.fillStyle='#fff'; ctx.font='18px sans-serif'; ctx.textAlign='center'; ctx.fillText(bank[0].q, canvas.width/2, 80);
            for(let i=0; i<4; i++) { ctx.fillStyle='#1e293b'; ctx.fillRect(50, 120+i*60, 300, 40); ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.fillText(bank[0].a[i], 70, 146+i*60); }
        }
        canvas.addEventListener('click', (e) => { const r=canvas.getBoundingClientRect(); const scY=canvas.height/r.height; let y=(e.clientY-r.top)*scY; for(let i=0; i<4; i++) { if(y>=120+i*60 && y<=160+i*60 && i===2) { completed=true; render(); } } });
        render();
    `,
    "game_60": `
        const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
        let board = Array(8).fill().map(() => Array(8).fill('')); board[0][4] = '♔'; board[7][3] = '♛';
        function draw() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            for(let r=0; r<8; r++) { for(let c=0; c<8; c++) { ctx.fillStyle=(r+c)%2===0?'#f1f5f9':'#475569'; ctx.fillRect(20+c*45, 20+r*45, 45, 45); if(board[r][c]) { ctx.fillStyle='#000'; ctx.font='28px sans-serif'; ctx.textAlign='center'; ctx.fillText(board[r][c], 20+c*45+22.5, 20+r*45+35); } } }
        }
        draw();
    `,
    "game_67": `
        const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
        let actx = null;
        function play(f) { if(!actx) actx = new(window.AudioContext||window.webkitAudioContext)(); let o=actx.createOscillator(), g=actx.createGain(); o.frequency.value=f; g.gain.setValueAtTime(0.3, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, actx.currentTime+0.3); o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+0.3); }
        function layout() { ctx.fillStyle='#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height); for(let i=0; i<5; i++) { ctx.fillStyle='#fff'; ctx.fillRect(25+i*70, 80, 60, 220); } }
        canvas.addEventListener('mousedown', (e) => { const r=canvas.getBoundingClientRect(); const scX=canvas.width/r.width; let x=(e.clientX-r.left)*scX; for(let i=0; i<5; i++) { if(x>=25+i*70 && x<=85+i*70) play(261.63 + i*30); } });
        layout();
    `,
    "game_71": `
        const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d');
        let list = [];
        class Item { constructor(x) { this.x=x; this.y=40; this.r=20; this.vy=2; } update() { this.y+=this.vy; if(this.y>canvas.height-this.r) { this.y=canvas.height-this.r; this.vy=0; } } }
        function step() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            list.forEach(f => { f.update(); ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.fillStyle='#e11d48'; ctx.fill(); });
            for(let i=0; i<list.length; i++) { for(let j=i+1; j<list.length; j++) { if(Math.hypot(list[i].x-list[j].x, list[i].y-list[j].y) < 40) { list.splice(j,1); list[i].r=35; } } }
            requestAnimationFrame(step);
        }
        canvas.addEventListener('click', (e) => { const r=canvas.getBoundingClientRect(); const scX=canvas.width/r.width; list.push(new Item((e.clientX-r.left)*scX)); });
        step();
    `
};

// --- BATCH ITERATION WORKSPACE LOOP ---
const activeMapping = [
    { id: 51, engine: "custom" }, { id: 52, engine: "custom" },
    { id: 53, engine: "action" }, { id: 54, engine: "action" },
    { id: 55, engine: "custom" }, { id: 56, engine: "custom" },
    { id: 57, engine: "brain" },  { id: 58, engine: "brain" },
    { id: 59, engine: "action" }, { id: 60, engine: "custom" },
    { id: 61, engine: "casual" }, { id: 62, engine: "brain" },
    { id: 63, engine: "brain" },  { id: 64, engine: "casual" },
    { id: 65, engine: "brain" },  { id: 66, engine: "casual" },
    { id: 67, engine: "custom" }, { id: 68, engine: "brain" },
    { id: 71, engine: "custom" }, { id: 79, engine: "brain" }
];

// Hydrate remaining array definitions out to game index 100 dynamically
for (let i = 51; i <= 100; i++) {
    if (!activeMapping.some(m => m.id === i)) {
        const engineType = i % 3 === 0 ? "action" : i % 3 === 1 ? "brain" : "casual";
        activeMapping.push({ id: i, engine: engineType });
    }
}

let modifiedCount = 0;

activeMapping.forEach(map => {
    // We target game51.html in games/ directory, not games/game_51/index.html
    const fileLoc = path.join(targetDir, `game${map.id}.html`);
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');

        // Target using strict document parsing algorithms
        const scriptMarker = '<script>';
        const closingMarker = '</script>';
        const startIdx = text.lastIndexOf(scriptMarker);
        const endIdx = text.lastIndexOf(closingMarker);

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            let enginePayload = "";
            if (map.engine === "custom") {
                enginePayload = customPayloads[`game_${map.id}`];
                if(!enginePayload) {
                    if (map.id === 79) enginePayload = customPayloads["game_56"]; // Fallback to Quiz template
                    else if (map.id === 66) enginePayload = customPayloads["game_67"]; // Fallback to Piano template
                    else enginePayload = genericEngines["casual"].replace(/canvas_node/g, 'gameCanvas'); // Safest default
                }
            } else {
                // Inline parameter sanitization for localized base engines
                enginePayload = genericEngines[map.engine].replace(/canvas_node/g, 'gameCanvas');
            }

            const rewrittenContent = text.substring(0, startIdx) + scriptMarker + '\\n' + enginePayload + '\\n  ' + closingMarker + text.substring(endIdx + closingMarker.length);
            fs.writeFileSync(fileLoc, rewrittenContent, { encoding: 'utf8' });
            modifiedCount++;
        }
    }
});

console.log("[Antigravity Process Matrix]: Category-based architecture sweep executed successfully over " + modifiedCount + " document nodes.");
