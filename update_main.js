const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'js', 'main.js');
let content = fs.readFileSync(mainJsPath, 'utf8');

// The new games string
const newGamesStr = `
  // Category 8 — Expansion Phase 2 (Games 51-100)
  { id: 51, title: 'Flappy Paper Plane', category: 'action', desc: 'Endless precision vector-flapper.', icon: '✈️', color: '#38bdf8' },
  { id: 52, title: 'Draw Pixels', category: 'casual', desc: 'Grid-based coloring and art board canvas.', icon: '🎨', color: '#ec4899' },
  { id: 53, title: 'Side by Side', category: 'brain', desc: 'Split-screen double coordination control tracking.', icon: '🎛️', color: '#14b8a6' },
  { id: 54, title: 'Space Battleship', category: 'action', desc: 'Classic horizontal retro space arcade shooter.', icon: '🚀', color: '#8b5cf6' },
  { id: 55, title: 'Swipe Basketball', category: 'action', desc: 'Touch/mouse drag physics velocity projectile thrower.', icon: '🏀', color: '#f97316' },
  { id: 56, title: 'Millionaire Quiz', category: 'brain', desc: 'Multiple-choice trivia matrix with prize-tier score tracking.', icon: '💰', color: '#eab308' },
  { id: 57, title: 'Snake & Ladders', category: 'arcade', desc: 'Turn-based random-number array board engine.', icon: '🎲', color: '#22c55e' },
  { id: 58, title: 'Ludo', category: 'arcade', desc: '4-quadrant local client player token movement array.', icon: '🔴', color: '#ef4444' },
  { id: 59, title: 'Cube Move', category: 'action', desc: 'Isometric directional grid obstacle dodging.', icon: '🧊', color: '#06b6d4' },
  { id: 60, title: 'Play Chess', category: 'brain', desc: 'Fully interactive 8x8 standard piece positioning loop.', icon: '♟️', color: '#1e40af' },
  { id: 61, title: 'Faster or Slower', category: 'casual', desc: 'Speed perception test comparing moving vector nodes.', icon: '⏱️', color: '#f59e0b' },
  { id: 62, title: 'Quiz Game 2', category: 'brain', desc: 'Advanced timer-based category trivia array.', icon: '❓', color: '#8b5cf6' },
  { id: 63, title: 'Connect the Dots', category: 'brain', desc: 'Vector node coordinate path-linking matrix.', icon: '✏️', color: '#10b981' },
  { id: 64, title: 'Spider Solitaire', category: 'brain', desc: 'Multi-row drag-and-drop card logic layout.', icon: '🕷️', color: '#dc2626' },
  { id: 65, title: 'Four Colors', category: 'casual', desc: 'Uno-inspired strategic card numerical matching loop.', icon: '🌈', color: '#f43f5e' },
  { id: 66, title: 'Virtual Drum', category: 'rhythm', desc: 'AudioContext API tactile beat-pad synthesizer interface.', icon: '🥁', color: '#d97706' },
  { id: 67, title: 'Virtual Piano', category: 'rhythm', desc: 'Responsive multi-octave physical polyphonic soundboard.', icon: '🎹', color: '#6366f1' },
  { id: 68, title: 'Guess the Song', category: 'rhythm', desc: 'Audio snippet validation trivia matrix.', icon: '🎵', color: '#a855f7' },
  { id: 69, title: 'Car Rush', category: 'action', desc: 'Retro pseudo-3D scaling canvas vertical road racer.', icon: '🏎️', color: '#f43f5e' },
  { id: 70, title: 'Space Flash', category: 'casual', desc: 'Reaction-time pattern matching stellar visual reflex test.', icon: '⚡', color: '#facc15' },
  { id: 71, title: 'Fruit Merge', category: 'casual', desc: 'Physics drop-and-stack collision mass enlargement loop.', icon: '🍉', color: '#22c55e' },
  { id: 72, title: 'Fill the Water', category: 'brain', desc: 'Line-drawing physics gravity path fluid simulator.', icon: '💧', color: '#3b82f6' },
  { id: 73, title: 'Chibi Hero', category: 'action', desc: 'Lightweight 2D side-scroller tile platformer.', icon: '🦸', color: '#ef4444' },
  { id: 74, title: 'Jo Jo Run', category: 'action', desc: 'Continuous fast-paced endless rhythmic lane runner.', icon: '🏃', color: '#14b8a6' },
  { id: 75, title: 'Tappy Dumont', category: 'action', desc: 'Rhythmic timing tap interaction physics arcade target.', icon: '🎯', color: '#f97316' },
  { id: 76, title: 'Hit Villains', category: 'casual', desc: 'Tactile mole-smashing reaction target selector.', icon: '🦹', color: '#a16207' },
  { id: 77, title: 'Weapon Strike', category: 'action', desc: 'Knife-throwing rotating circle physics collision block.', icon: '🗡️', color: '#94a3b8' },
  { id: 78, title: 'Thief Challenge', category: 'mystery', desc: 'Stealth puzzle path navigation grid grid-runner.', icon: '🥷', color: '#1e40af' },
  { id: 79, title: 'Quiz Games', category: 'brain', desc: 'General knowledge high-speed multiple choice array.', icon: '💡', color: '#eab308' },
  { id: 80, title: 'True or False', category: 'brain', desc: 'Rapid-fire boolean confirmation logic engine.', icon: '✅', color: '#22c55e' },
  { id: 81, title: 'Solve Math Ex', category: 'brain', desc: 'High-speed equation solver container.', icon: '🧮', color: '#3b82f6' },
  { id: 82, title: 'Draggable Puzzle', category: 'brain', desc: 'Grid tile bounding-box jigsaw array snapping engine.', icon: '🧩', color: '#8b5cf6' },
  { id: 83, title: 'Guess Number', category: 'brain', desc: 'High/Low binary search algorithmic numeric game.', icon: '🔢', color: '#facc15' },
  { id: 84, title: 'Hacker Challenge', category: 'mystery', desc: 'Terminal-themed pattern matching matrix mini-game.', icon: '💻', color: '#10b981' },
  { id: 85, title: '3D Car Run', category: 'action', desc: 'Three-lane depth scaling canvas velocity racer.', icon: '🚗', color: '#ef4444' },
  { id: 86, title: 'Subway Run 5', category: 'action', desc: 'Dynamic endless obstacle dodge reflex tile runner.', icon: '🚇', color: '#ec4899' },
  { id: 87, title: 'City Builder', category: 'casual', desc: 'Grid placement tile-stacking balance physics manager.', icon: '🏙️', color: '#0ea5e9' },
  { id: 88, title: 'Classic Bowling', category: 'arcade', desc: 'Horizontal swipe angle tracking pin collision system.', icon: '🎳', color: '#d97706' },
  { id: 89, title: 'Balloons Shooter', category: 'casual', desc: 'High-density mouse-click floating color balloon popper.', icon: '🎈', color: '#f43f5e' },
  { id: 90, title: 'Cannon Balls', category: 'action', desc: 'Angle target explosive building destruction physics grid.', icon: '💣', color: '#64748b' },
  { id: 91, title: 'Memory Card Match', category: 'brain', desc: 'Classic card-flipping memory match logic.', icon: '🃏', color: '#8b5cf6' },
  { id: 92, title: 'Neon Brick Breaker', category: 'arcade', desc: 'Neon-infused paddle and ball brick breaker arcade.', icon: '🧱', color: '#f472b6' },
  { id: 93, title: 'Bubble Pop Classic', category: 'casual', desc: 'Match 3 colored bubbles before they reach the bottom.', icon: '🫧', color: '#38bdf8' },
  { id: 94, title: 'Froggy Jump', category: 'casual', desc: 'Cross the dangerous vector river and road.', icon: '🐸', color: '#22c55e' },
  { id: 95, title: 'Tower Stack Arena', category: 'action', desc: 'Stack moving blocks as high as possible.', icon: '🏢', color: '#a855f7' },
  { id: 96, title: 'Retro Tic-Tac-Toe', category: 'arcade', desc: 'Nostalgic 8-bit styling for the classic logic grid.', icon: '❌', color: '#ef4444' },
  { id: 97, title: 'Maze Escape', category: 'mystery', desc: 'Navigate the procedurally generated labyrinth.', icon: '🏃', color: '#14b8a6' },
  { id: 98, title: 'Color Tap Runner', category: 'rhythm', desc: 'Tap the matching color lanes to keep the runner moving.', icon: '🚥', color: '#facc15' },
  { id: 99, title: 'Word Scramble Suite', category: 'brain', desc: 'Unscramble letters to find the hidden vocabulary words.', icon: '🔤', color: '#ec4899' },
  { id: 100, title: 'Space Asteroids Culler', category: 'action', desc: 'Clear the asteroid field using your spaceship blasters.', icon: '☄️', color: '#94a3b8' }
`;

// Insert the new games into GAMES array
content = content.replace(
    `{ id: 50, title: 'The Final Core',       category: 'action',  desc: 'Survive the ultimate bullet hell against the rogue system core.', icon: '🔥', color: '#ef4444' }\n];`,
    `{ id: 50, title: 'The Final Core',       category: 'action',  desc: 'Survive the ultimate bullet hell against the rogue system core.', icon: '🔥', color: '#ef4444' },${newGamesStr}\n];`
);

// Update FEATURED_IDS array
// Populating with Fruit Merge (71), Flappy Paper Plane (51), Swipe Basketball (55), Draw Pixels (52), Jo Jo Run (74), and Balloons Shooter (89).
content = content.replace(
    `const FEATURED_IDS = [1, 6, 16, 21, 28];`,
    `const FEATURED_IDS = [71, 51, 55, 52, 74, 89];`
);

// Update renderGameGrid sorting logic
const newRenderGameGrid = `
function renderGameGrid(filter) {
  const grid = document.getElementById('game-grid');
  if (!grid) return;

  let list = filter === 'all' ? [...GAMES] : GAMES.filter(g => g.category === filter);

  // Sorting Logic Rules
  // Premium: Ludo (58), Play Chess (60), 3D Car Run (85), Quiz Games (79), Safe Cracker (38), 2048 (1)
  // Low-Ranked: Hacker Challenge (84), Spider Solitaire (64), True or False (80), Solve Math Ex (81)
  const premiumIds = [58, 60, 85, 79, 38, 1];
  const lowIds = [84, 64, 80, 81];

  list.sort((a, b) => {
      const aPremium = premiumIds.includes(a.id);
      const bPremium = premiumIds.includes(b.id);
      const aLow = lowIds.includes(a.id);
      const bLow = lowIds.includes(b.id);

      if (aPremium && !bPremium) return -1;
      if (!aPremium && bPremium) return 1;
      if (aLow && !bLow) return 1;
      if (!aLow && bLow) return -1;
      return a.id - b.id; // Keep default ID sorting for the rest
  });

  grid.innerHTML = list.map((game, i) => \`
    <a href="games/game\${game.id}.html" class="game-card animate-fade-in-up" style="animation-delay:\${(i % 10) * 0.04}s;opacity:0">
      <div class="card-glow"></div>
      <div class="card-thumbnail" style="background:linear-gradient(135deg, \${game.color}12, \${game.color}04)">
        <span class="text-5xl md:text-6xl select-none">\${game.icon}</span>
        <div class="play-overlay"><span>▶</span></div>
      </div>
      <div class="p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-white text-base" style="font-family:var(--font-heading)">\${game.title}</h3>
          <span class="category-badge" style="background:\${game.color}1a;color:\${game.color}">\${game.category}</span>
        </div>
        <p class="text-sm text-gray-400 leading-relaxed line-clamp-2">\${game.desc}</p>
      </div>
    </a>\`).join('');
}
`;

content = content.replace(/function renderGameGrid\(filter\) \{[\s\S]*?\n\}/, newRenderGameGrid.trim());

// We also need to add premium styling to the carousel. 
// "use wide cards, vibrant glowing neon drop shadows (box-shadow: 0 0 20px #8b5cf6), and cheerful rounded layout styles (border-radius: 1rem)."
// In initCarousel:
// <div class="carousel-slide" style="background:linear-gradient(135deg, ${game.color}18, ${game.color}06)">
const carouselRegex = /<div class="carousel-slide" style="background:linear-gradient\(135deg, \$\{game\.color\}18, \$\{game\.color\}06\)">/;
content = content.replace(carouselRegex, `<div class="carousel-slide" style="background:linear-gradient(135deg, \${game.color}18, \${game.color}06); box-shadow: 0 0 20px #8b5cf6; border-radius: 1rem; width: 95%; max-width: 900px; margin: 0 auto; overflow: hidden;">`);


fs.writeFileSync(mainJsPath, content, 'utf8');
console.log('Successfully updated main.js with new games and sorting logic.');
