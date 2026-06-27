const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'games');

const upgradedLogic = {
    "game51": `
        // --- FLAPPY PAPER PLANE PRODUCTION ENGINE ---
        const canvas = document.getElementById('gameCanvas_51');
        const ctx = canvas.getContext('2d');
        const restartBtn = document.getElementById('restartBtn') || document.querySelector('.btn-primary') || { addEventListener: () => {} };
        
        let planeY, velocity, score, isOver, pipes;
        const gravity = 0.35, jumpForce = -6.5;

        function init() {
            planeY = 200; velocity = 0; score = 0; isOver = false; pipes = [];
            updateScoreUI();
        }
        function updateScoreUI() {
            const scoreNode = document.querySelector('[id*="score"]') || { textContent: "" };
            scoreNode.textContent = score;
        }
        function spawnPipe() {
            let gap = 140;
            let minH = 50, maxH = canvas.height - gap - 50;
            let topH = Math.floor(Math.random() * (maxH - minH)) + minH;
            pipes.push({ x: canvas.width, top: topH, bottom: canvas.height - topH - gap, passed: false });
        }
        function loop() {
            if (isOver) {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#ef4444'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
                ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
                ctx.fillStyle = '#94a3b8'; ctx.font = '16px sans-serif';
                ctx.fillText('Click New Game to Fly Again', canvas.width/2, canvas.height/2 + 25);
                return;
            }
            velocity += gravity; planeY += velocity;
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Cinematic Paper Plane Vector
            ctx.save(); ctx.translate(120, planeY);
            ctx.fillStyle = '#38bdf8'; ctx.beginPath();
            ctx.moveTo(25, 0); ctx.lineTo(-15, -12); ctx.lineTo(-5, 0); ctx.lineTo(-15, 12); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(-5, 0); ctx.lineTo(-15, 12); ctx.closePath(); ctx.fill();
            ctx.restore();

            if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 260) spawnPipe();

            for (let i = pipes.length - 1; i >= 0; i--) {
                let p = pipes[i]; p.x -= 3.2;
                ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
                ctx.fillRect(p.x, 0, 65, p.top); ctx.strokeRect(p.x, 0, 65, p.top);
                ctx.fillRect(p.x, canvas.height - p.bottom, 65, p.bottom); ctx.strokeRect(p.x, canvas.height - p.bottom, 65, p.bottom);

                if (p.x < 120 && !p.passed) { score++; p.passed = true; updateScoreUI(); }
                if (p.x < -70) pipes.splice(i, 1);
                if ((120 + 20 > p.x && 120 - 10 < p.x + 65) && (planeY - 10 < p.top || planeY + 10 > canvas.height - p.bottom)) isOver = true;
            }
            if (planeY > canvas.height || planeY < 0) isOver = true;
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('click', () => { if(!isOver) velocity = jumpForce; });
        window.addEventListener('keydown', (e) => { if(e.code === 'Space' && !isOver) { velocity = jumpForce; e.preventDefault(); } });
        restartBtn.addEventListener('click', () => { init(); loop(); });
        init(); loop();
    `,
    "game52": `
        // --- DRAW PIXELS GRID PRODUCTION INTERFACE ---
        const canvas = document.getElementById('gameCanvas_52');
        const ctx = canvas.getContext('2d');
        const restartBtn = document.getElementById('restartBtn') || { addEventListener: () => {} };
        
        const gridOffset = 160, gridSize = 16, cellSize = 24;
        let pixelMatrix = Array(gridSize).fill().map(() => Array(gridSize).fill('#131a26'));
        let palette = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ffffff', '#131a26'];
        let activeColor = '#3b82f6', isDrawing = false;

        function drawBoard() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            // Draw Color Palette Sidebar
            ctx.fillStyle = '#1e293b'; ctx.fillRect(30, 50, 70, canvas.height - 100);
            palette.forEach((color, i) => {
                ctx.fillStyle = color; ctx.fillRect(45, 70 + i*45, 40, 35);
                ctx.strokeStyle = activeColor === color ? '#fff' : '#475569'; ctx.lineWidth = activeColor === color ? 3 : 1;
                ctx.strokeRect(45, 70 + i*45, 40, 35);
            });
            // Draw Canvas Drawing Grid Core
            for(let r=0; r<gridSize; r++) {
                for(let c=0; c<gridSize; c++) {
                    ctx.fillStyle = pixelMatrix[r][c]; ctx.fillRect(gridOffset + c*cellSize, 50 + r*cellSize, cellSize, cellSize);
                    ctx.strokeStyle = '#334155'; ctx.lineWidth = 0.5; ctx.strokeRect(gridOffset + c*cellSize, 50 + r*cellSize, cellSize, cellSize);
                }
            }
        }
        function fillPixel(e) {
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            if (mx > 45 && mx < 85) {
                palette.forEach((color, i) => { if(my > 70 + i*45 && my < 105 + i*45) { activeColor = color; drawBoard(); } });
                return;
            }
            const c = Math.floor((mx - gridOffset) / cellSize), r = Math.floor((my - 50) / cellSize);
            if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) { pixelMatrix[r][c] = activeColor; drawBoard(); }
        }
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; fillPixel(e); });
        canvas.addEventListener('mousemove', (e) => { if(isDrawing) fillPixel(e); });
        window.addEventListener('mouseup', () => isDrawing = false);
        restartBtn.addEventListener('click', () => { pixelMatrix = Array(gridSize).fill().map(() => Array(gridSize).fill('#131a26')); drawBoard(); });
        drawBoard();
    `,
    "game55": `
        // --- SWIPE BASKETBALL VELOCITY ENGINE ---
        const canvas = document.getElementById('gameCanvas_55');
        const ctx = canvas.getContext('2d');
        const restartBtn = document.getElementById('restartBtn') || { addEventListener: () => {} };

        let bx, by, vx, vy, isFired, score, sx, sy, mx, my, isDragging;
        const gravity = 0.38, bounce = -0.65;
        const hoopX = 640, hoopY = 180, hoopW = 60;

        function init() {
            bx = 180; by = 420; vx = 0; vy = 0; isFired = false; isDragging = false; score = 0; updateScore();
        }
        function updateScore() {
            const scoreNode = document.querySelector('[id*="score"]') || { textContent: "" };
            scoreNode.textContent = score;
        }
        function renderScene() {
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            // Draw Interactive Hoop Layout Backboard
            ctx.fillStyle = '#e2e8f0'; ctx.fillRect(hoopX + hoopW, hoopY - 50, 8, 80); // Backboard
            ctx.fillStyle = '#f97316'; ctx.fillRect(hoopX, hoopY, hoopW, 6); // Rim Bounding Box
            
            if (isDragging) {
                ctx.strokeStyle = 'rgba(254, 215, 170, 0.5)'; ctx.setLineDash([5, 5]); ctx.beginPath();
                ctx.moveTo(bx, by); ctx.lineTo(bx + (sx - mx)*1.2, by + (sy - my)*1.2); ctx.stroke(); ctx.setLineDash([]);
            }
            ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(bx, by, 16, 0, Math.PI*2); ctx.fill();
        }
        function loop() {
            if (isFired) {
                vy += gravity; bx += vx; by += vy;
                // Backboard Collision Math Checks
                if (bx + 16 > hoopX + hoopW && bx - 16 < hoopX + hoopW + 8 && by > hoopY - 50 && by < hoopY + 30) { vx = -vx * 0.8; bx = hoopX + hoopW - 18; }
                // Scoring Vector Matrix Check
                if (bx > hoopX && bx < hoopX + hoopW && by > hoopY - 5 && by < hoopY + 15 && vy > 0) { score++; updateScore(); isFired = false; resetBall(); }
                if (by > canvas.height + 20 || bx > canvas.width + 20 || bx < -20) resetBall();
            }
            renderScene(); requestAnimationFrame(loop);
        }
        function resetBall() { bx = 180; by = 420; vx = 0; vy = 0; isFired = false; }
        canvas.addEventListener('mousedown', (e) => { if(!isFired) { const r=canvas.getBoundingClientRect(); sx=e.clientX-r.left; sy=e.clientY-r.top; isDragging=true; mx=sx; my=sy; } });
        canvas.addEventListener('mousemove', (e) => { if(isDragging) { const r=canvas.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top; } });
        canvas.addEventListener('mouseup', () => { if(isDragging) { vx = (sx - mx)*0.11; vy = (sy - my)*0.11; isFired = true; isDragging = false; } });
        restartBtn.addEventListener('click', init);
        init(); loop();
    `,
    "game71": `
        // --- FRUIT MERGE PHYSICS REALIZATION ENGINE ---
        const canvas = document.getElementById('gameCanvas_71');
        const ctx = canvas.getContext('2d');
        const restartBtn = document.getElementById('restartBtn') || { addEventListener: () => {} };

        let fruitList, score, isOver;
        const fruitTiers = [
            { r: 16, color: '#f43f5e' }, { r: 24, color: '#fb923c' },
            { r: 32, color: '#facc15' }, { r: 42, color: '#4ade80' }, { r: 54, color: '#60a5fa' }
        ];
        function init() {
            fruitList = []; score = 0; isOver = false; updateUI();
        }
        function updateUI() {
            const scoreNode = document.querySelector('[id*="score"]') || { textContent: "" };
            scoreNode.textContent = score;
        }
        class SphereNode {
            constructor(x, tier=0) { this.x = x; this.y = 60; this.tier = tier; this.r = fruitTiers[tier].r; this.vy = 2; this.settled = false; }
            step() {
                if(!this.settled) { this.vy += 0.3; this.y += this.vy; if(this.y > canvas.height - this.r) { this.y = canvas.height - this.r; this.vy = 0; this.settled = true; } }
            }
        }
        function stepEngine() {
            if(isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#f43f5e'; ctx.font='bold 32px sans-serif'; ctx.textAlign='center'; ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);
            
            // Draw Critical AdSense Threat Danger Line
            ctx.strokeStyle = '#ef4444'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 110); ctx.lineTo(canvas.width, 110); ctx.stroke(); ctx.setLineDash([]);
            
            fruitList.forEach(f => { f.step(); ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.fillStyle = fruitTiers[f.tier].color; ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke(); });
            
            // Circle-to-Circle Collision Vector Optimization Passes
            for(let i=0; i<fruitList.length; i++) {
                for(let j=i+1; j<fruitList.length; j++) {
                    let f1 = fruitList[i], f2 = fruitList[j];
                    let dist = Math.hypot(f1.x - f2.x, f1.y - f2.y);
                    if (dist < f1.r + f2.r) {
                        if (f1.tier === f2.tier && f1.tier < fruitTiers.length - 1) {
                            let mx = (f1.x + f2.x)/2, my = (f1.y + f2.y)/2;
                            fruitList.splice(j, 1); fruitList.splice(i, 1);
                            score += (f1.tier + 1)*10; updateUI();
                            let upgradedFruit = new SphereNode(mx, f1.tier + 1); upgradedFruit.y = my; fruitList.push(upgradedFruit);
                            return;
                        }
                        f1.y -= 1; f2.settled = true; f1.settled = true;
                    }
                }
                if(fruitList[i].settled && fruitList[i].y - fruitList[i].r < 110) isOver = true;
            }
            requestAnimationFrame(stepEngine);
        }
        canvas.addEventListener('click', (e) => { if(!isOver) { const r = canvas.getBoundingClientRect(); fruitList.push(new SphereNode(e.clientX - r.left, 0)); } });
        restartBtn.addEventListener('click', () => { init(); stepEngine(); });
        init(); stepEngine();
    `,
    "game74": `
        // --- JO JO RUN VECTOR CONSTRAINT GRAPPLING ENGINE ---
        const canvas = document.getElementById('gameCanvas_74');
        const ctx = canvas.getContext('2d');
        const restartBtn = document.getElementById('restartBtn') || { addEventListener: () => {} };

        let px, py, vx, vy, score, isOver, anchors, activeAnchor;
        const gravity = 0.22;

        function init() {
            px = 100; py = 200; vx = 3; vy = 0; score = 0; isOver = false; activeAnchor = null;
            anchors = [{x: 250, y: 100}, {x: 450, y: 80}, {x: 650, y: 110}, {x: 850, y: 90}];
            updateScore();
        }
        function updateScore() {
            const scoreNode = document.querySelector('[id*="score"]') || { textContent: "" };
            scoreNode.textContent = score;
        }
        function loop() {
            if (isOver) { ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#f43f5e'; ctx.font='bold 32px sans-serif'; ctx.textAlign='center'; ctx.fillText('CRASH GAME OVER', canvas.width/2, canvas.height/2); return; }
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);

            // Physics Constraint Application
            if (activeAnchor) {
                let dx = px - activeAnchor.x, dy = py - activeAnchor.y;
                let dist = Math.hypot(dx, dy);
                let ropeLen = 160;
                if (dist > ropeLen) {
                    let ax = (dx / dist) * 0.45, ay = (dy / dist) * 0.45;
                    vx -= ax; vy -= ay;
                }
                ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(activeAnchor.x, activeAnchor.y); ctx.lineTo(px, py); ctx.stroke();
            } else { vy += gravity; }

            px += vx; py += vy; vx *= 0.995; // Drag Coefficient

            // Infinite Scrolling World Matrix Generation
            if(px > canvas.width - 200) { px = 100; score += 5; updateScore(); anchors.forEach(a => a.x = Math.random()*500 + 200); }

            // Draw Anchors & Player Node
            anchors.forEach(a => { ctx.fillStyle='#e2e8f0'; ctx.beginPath(); ctx.arc(a.x, a.y, 8, 0, Math.PI*2); ctx.fill(); });
            ctx.fillStyle = '#a855f7'; ctx.fillRect(px - 12, py - 12, 24, 24);

            if (py > canvas.height || py < 0 || px < 0) isOver = true;
            requestAnimationFrame(loop);
        }
        canvas.addEventListener('mousedown', () => {
            let closest = null, minDist = 9999;
            anchors.forEach(a => { let d = Math.hypot(px - a.x, py - a.y); if(d < minDist) { minDist = d; closest = a; } });
            if(minDist < 250) activeAnchor = closest;
        });
        canvas.addEventListener('mouseup', () => activeAnchor = null);
        restartBtn.addEventListener('click', () => { init(); loop(); });
        init(); loop();
    `,
    "game89": `
        // --- BALLOONS SHOOTER ARC PROJECTILE ENGINE ---
        const canvas = document.getElementById('gameCanvas_89');
        const ctx = canvas.getContext('2d');
        const restartBtn = document.getElementById('restartBtn') || { addEventListener: () => {} };

        let score, isOver, balloons, arrows;
        function init() {
            score = 0; isOver = false; balloons = []; arrows = []; updateUI();
            for(let i=0; i<6; i++) spawnBalloon();
        }
        function updateUI() {
            const scoreNode = document.querySelector('[id*="score"]') || { textContent: "" };
            scoreNode.textContent = score;
        }
        function spawnBalloon() {
            balloons.push({ x: Math.random()*(canvas.width - 150) + 50, y: canvas.height + Math.random()*200, r: 20 + Math.random()*10, speed: 1.2 + Math.random()*1.5, color: '#f43f5e' });
        }
        function step() {
            if(isOver) return;
            ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);

            // Draw Bow Platform Vector
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(40, canvas.height/2, 35, -Math.PI/2, Math.PI/2); ctx.stroke();

            // Process Active Arrow Vector Elements
            for(let i = arrows.length-1; i >= 0; i--) {
                let arr = arrows[i]; arr.vy += 0.12; arr.x += arr.vx; arr.y += arr.vy;
                ctx.fillStyle = '#cbd5e1'; ctx.fillRect(arr.x, arr.y, 18, 4);
                
                // Radius Target Precision Intersection Validation
                for(let j = balloons.length-1; j >= 0; j--) {
                    let b = balloons[j];
                    if(Math.hypot(arr.x - b.x, arr.y - b.y) < b.r) {
                        balloons.splice(j,1); arrows.splice(i,1); score += 10; updateUI(); spawnBalloon(); break;
                    }
                }
                if(arr.x > canvas.width) arrows.splice(i,1);
            }

            // Process Balloon Ascents
            balloons.forEach(b => {
                b.y -= b.speed; ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
                if(b.y < -40) { b.y = canvas.height + 40; b.x = Math.random()*(canvas.width - 150) + 50; }
            });
            requestAnimationFrame(step);
        }
        canvas.addEventListener('click', (e) => {
            const r = canvas.getBoundingClientRect();
            let tx = e.clientX - r.left, ty = e.clientY - r.top;
            let angle = Math.atan2(ty - canvas.height/2, tx - 40);
            arrows.push({ x: 40, y: canvas.height/2, vx: Math.cos(angle)*11, vy: Math.sin(angle)*11 });
        });
        restartBtn.addEventListener('click', () => { init(); });
        init(); step();
    `
};

console.log("[ArcadeNexus Engine]: Commencing physics engine realizations...");

Object.keys(upgradedLogic).forEach(gameId => {
    const fileLoc = path.join(gamesDir, gameId, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');

        const scriptStart = '<script>';
        const scriptEnd = '</script>';
        const startIdx = content.lastIndexOf(scriptStart);
        const endIdx = content.lastIndexOf(scriptEnd);

        if (startIdx !== -1 && endIdx !== -1) {
            const fullyFeaturedContent = content.substring(0, startIdx + scriptStart.length) + '\n' + upgradedLogic[gameId] + '\n' + content.substring(endIdx);
            fs.writeFileSync(fileLoc, fullyFeaturedContent, { encoding: 'utf8' });
            console.log(`[PASS]: Upgraded advanced vector math loops inside ${gameId}/index.html`);
        }
    }
});

console.log("[Antigravity Final Status]: Complete arcade experiences locked in across all target paths.");
