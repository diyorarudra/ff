const fs = require('fs');
const path = require('path');

const g9 = `
const canvas = document.querySelector('canvas') || document.getElementById('gameCanvas_9');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 600;
let animFrame, score = 0, isGameOver = false;
const cols = 20, rows = 15, size = 40;
let grid = Array(rows).fill().map(() => Array(cols).fill(0));
let piece = {x: 10, y: 0, color: '#f0f'};

const keys = {left: false, right: false, down: false};
window.addEventListener('keydown', e => {
  if (isGameOver) return;
  if(e.code==='ArrowLeft') { piece.x = Math.max(0, piece.x-1); }
  if(e.code==='ArrowRight') { piece.x = Math.min(cols-1, piece.x+1); }
  if(e.code==='ArrowDown') { piece.y = Math.min(rows-1, piece.y+1); }
});

let lastTime = 0;
let dropCounter = 0;

function startGame() {
  window.hasStarted = true;
  if(document.getElementById('startOverlay')) document.getElementById('startOverlay').style.display = 'none';
  if(document.getElementById('gameOver')) document.getElementById('gameOver').style.display = 'none';
  score = 0; isGameOver = false;
  grid = Array(rows).fill().map(() => Array(cols).fill(0));
  piece = {x: 10, y: 0, color: '#0ff'};
  lastTime = performance.now();
  if (animFrame) cancelAnimationFrame(animFrame);
  gameLoop(lastTime);
}

function gameLoop(time) {
  if (isGameOver) {
      if(document.getElementById('gameOver')) document.getElementById('gameOver').style.display = 'flex';
      return;
  }
  const dt = time - lastTime;
  lastTime = time;
  dropCounter += dt;
  if (dropCounter > 500) {
      if (piece.y + 1 < rows && grid[piece.y+1][piece.x] === 0) {
          piece.y++;
      } else {
          grid[piece.y][piece.x] = 1;
          // check line
          let lines = 0;
          for(let r=0; r<rows; r++) {
              if (grid[r].every(c => c === 1)) {
                  grid.splice(r, 1);
                  grid.unshift(Array(cols).fill(0));
                  lines++;
              }
          }
          if (lines > 0) {
             score += lines * 100;
             if(document.getElementById('score')) document.getElementById('score').innerText = score;
          }
          piece = {x: 10, y: 0, color: Math.random() > 0.5 ? '#f0f' : '#0ff'};
          if (grid[0][10] !== 0) isGameOver = true;
      }
      dropCounter = 0;
  }

  ctx.fillStyle = '#06060e'; ctx.fillRect(0, 0, 800, 600);
  ctx.strokeStyle = '#222';
  for(let r=0; r<rows; r++) {
      for(let c=0; c<cols; c++) {
          if (grid[r][c]) {
              ctx.fillStyle = '#f90';
              ctx.fillRect(c*size, r*size, size-2, size-2);
          } else {
              ctx.strokeRect(c*size, r*size, size, size);
          }
      }
  }
  ctx.fillStyle = piece.color;
  ctx.fillRect(piece.x*size, piece.y*size, size-2, size-2);
  
  animFrame = requestAnimationFrame(gameLoop);
}

document.querySelectorAll('button').forEach(b => {
    if(b.textContent.includes('Start') || b.textContent.includes('Play') || b.textContent.includes('Try')) {
        b.addEventListener('click', startGame);
    }
});
`;

const g10 = `
const canvas = document.querySelector('canvas') || document.getElementById('gameCanvas_10');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 600;
let animFrame, score = 0, isGameOver = false;
let shieldAngle = 0;
let meteors = [];

const keys = {left: false, right: false};
window.addEventListener('keydown', e => { 
    if(e.code==='KeyA' || e.code==='ArrowLeft') keys.left = true; 
    if(e.code==='KeyD' || e.code==='ArrowRight') keys.right = true; 
});
window.addEventListener('keyup', e => { 
    if(e.code==='KeyA' || e.code==='ArrowLeft') keys.left = false; 
    if(e.code==='KeyD' || e.code==='ArrowRight') keys.right = false; 
});

function startGame() {
  window.hasStarted = true;
  if(document.getElementById('startOverlay')) document.getElementById('startOverlay').style.display = 'none';
  if(document.getElementById('gameOver')) document.getElementById('gameOver').style.display = 'none';
  score = 0; isGameOver = false;
  shieldAngle = 0; meteors = [];
  if (animFrame) cancelAnimationFrame(animFrame);
  gameLoop();
}

function gameLoop() {
  if (isGameOver) {
      if(document.getElementById('gameOver')) document.getElementById('gameOver').style.display = 'flex';
      return;
  }
  ctx.fillStyle = '#06060e'; ctx.fillRect(0, 0, 800, 600);
  
  if (keys.left) shieldAngle -= 0.1;
  if (keys.right) shieldAngle += 0.1;
  
  if (Math.random() < 0.03) {
      let angle = Math.random() * Math.PI * 2;
      meteors.push({x: 400 + Math.cos(angle)*500, y: 300 + Math.sin(angle)*500, angle: angle, color: Math.random()>0.5 ? '#f00' : '#00f', speed: 2});
  }
  
  meteors.forEach((m, i) => {
      m.x -= Math.cos(m.angle) * m.speed;
      m.y -= Math.sin(m.angle) * m.speed;
      ctx.fillStyle = m.color;
      ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, Math.PI*2); ctx.fill();
      
      let dist = Math.hypot(m.x - 400, m.y - 300);
      if (dist < 60) {
          let diff = Math.abs(Math.atan2(Math.sin(shieldAngle - m.angle), Math.cos(shieldAngle - m.angle)));
          if (diff < 0.5) {
              score++; if(document.getElementById('score')) document.getElementById('score').innerText = score;
              meteors.splice(i, 1);
          } else {
              isGameOver = true;
          }
      }
  });
  
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(400, 300, 50, 0, Math.PI*2); ctx.fill();
  
  ctx.strokeStyle = '#0ff'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(400, 300, 60, shieldAngle - 0.5, shieldAngle + 0.5); ctx.stroke();
  
  animFrame = requestAnimationFrame(gameLoop);
}

document.querySelectorAll('button').forEach(b => {
    if(b.textContent.includes('Start') || b.textContent.includes('Play') || b.textContent.includes('Defend') || b.textContent.includes('Try')) {
        b.addEventListener('click', startGame);
    }
});
`;

const targets = {
    '9': {
        title: 'Cyber Neon Forge',
        manual: 'Cyber Neon Forge Operations Manual: Align falling energy cells with matching furnace terminals. Use Left and Right Arrow keys or touch side grids to navigate positions horizontally. Clear complete horizontal thermal tracks before energy components overload the canvas buffer matrix.',
        code: g9
    },
    '10': {
        title: 'Orbit Velocity Defender',
        manual: 'Orbit Velocity Defender Operations Manual: Safeguard your central core structure from high-velocity orbital debris matrices. Press A and D or tap your mobile direction buttons to pivot the exterior defensive plating 360 degrees. Match the color matrix of the shield block with incoming impact vectors to survive.',
        code: g10
    }
};

['9', '10'].forEach(gameNum => {
    const file = path.join(__dirname, 'games', 'game' + gameNum, 'index.html');
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Replace main script logic
        content = content.replace(/<script>\s*(?:const|let|var)\s+(?:canvas|roundEl)[\s\S]*?<\/script>/i, '<script>\n' + targets[gameNum].code + '\n</script>');

        // Wrap AdSense calls in try-catch
        content = content.replace(/\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\(\{\}\);/g, 'try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) { console.warn("Layout safe:", e); }');

        // Inject Operations Manual block
        const existingManualRegex = /<div style="background:#1a1a2e;[^>]*>(?:Neon Helix Jumper|Deep Sea Sub Hunter|Cyber Grid Cybercycle).*?<\/div>/i;
        if (existingManualRegex.test(content)) {
            content = content.replace(existingManualRegex, '<div style="background:#1a1a2e; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #333; color:#aaa; font-size:13px; text-align:center;">' + targets[gameNum].manual + '</div>');
        } else if (!content.includes('Operations Manual:')) {
            content = content.replace(/(<div class="game-container[^>]*>)/i, '$1\n<div style="background:#1a1a2e; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #333; color:#aaa; font-size:13px; text-align:center;">' + targets[gameNum].manual + '</div>\n');
        }

        // Update Title and Overlay Title
        content = content.replace(/<title>.*?<\/title>/i, '<title>' + targets[gameNum].title + ' &mdash; GamiDay</title>');
        content = content.replace(/<div class="text-[345]xl[^>]*>.*?<\/div>/i, '<div class="text-4xl font-bold font-heading text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse mb-4">' + targets[gameNum].title.toUpperCase() + '</div>');

        fs.writeFileSync(file, content, 'utf8');
        console.log(`[REPLACE LOCKED]: New unique core mechanics initialized for Game ${gameNum}`);
    } else {
        console.log(`Error: file not found for Game ${gameNum}`);
    }
});
