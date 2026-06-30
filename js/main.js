/* ============================================
   ffliveplay — Main Portal JavaScript
   ============================================ */

// ---- Game Registry (all 30 titles) ----
const GAMES = [
  // Category 1 — Brain & Logic
  { id: 1,  title: '2048',             category: 'brain',   desc: 'Slide and merge numbered tiles to reach 2048.',               icon: '🔢', color: '#eab308' },
  { id: 2,  title: 'Minesweeper',      category: 'brain',   desc: 'Uncover the grid without hitting any hidden mines.',           icon: '💣', color: '#ef4444' },
  { id: 3,  title: 'Sudoku',           category: 'brain',   desc: 'Fill the 9×9 grid using pure logical deduction.',              icon: '🧩', color: '#8b5cf6' },
  { id: 4,  title: 'Memory Match',     category: 'brain',   desc: 'Flip cards and find every matching pair.',                     icon: '🃏', color: '#06b6d4' },
  { id: 5,  title: 'Slider Puzzle',    category: 'brain',   desc: 'Slide tiles back into the correct sequence.',                  icon: '🔲', color: '#f97316' },

  // Category 2 — Action & Physics
  { id: 6,  title: 'Brick Breaker',    category: 'action',  desc: 'Smash bricks with a bouncing ball and your paddle.',           icon: '🧱', color: '#ec4899' },
  { id: 7,  title: 'Gravity Flip',     category: 'action',  desc: 'Flip gravity to dodge obstacles in an endless run.',           icon: '🔄', color: '#14b8a6' },
  { id: 8,  title: 'Sky Bounce',       category: 'action',  desc: 'Tap to fly through narrow gaps in this physics scroller.',     icon: '🐦', color: '#22c55e' },
  { id: 9,  title: 'Asteroids',        category: 'action',  desc: 'Pilot a ship through space and blast apart rocks.',            icon: '☄️', color: '#94a3b8' },
  { id: 10, title: 'Space Invaders',   category: 'action',  desc: 'Defend Earth from descending waves of alien invaders.',        icon: '👾', color: '#a855f7' },

  // Category 3 — Mystery & Detective
  { id: 11, title: 'Mansion Scanner',  category: 'mystery', desc: 'Find hidden evidence scattered across the detective\'s mansion.', icon: '🔍', color: '#b45309' },
  { id: 12, title: 'Necklace Maze',    category: 'mystery', desc: 'Navigate a pitch-dark maze with only a small flashlight.',       icon: '🔦', color: '#1e40af' },
  { id: 13, title: 'Interrogation',    category: 'mystery', desc: 'Crack the case with Mastermind-style deduction clues.',          icon: '🕵️', color: '#7c3aed' },
  { id: 14, title: 'Crime Scramble',   category: 'mystery', desc: 'Reassemble the crime scene photo in a timed jigsaw.',            icon: '🧩', color: '#dc2626' },
  { id: 15, title: 'Cipher Decoder',   category: 'mystery', desc: 'Break the cryptogram cipher to reveal the hidden message.',      icon: '🔐', color: '#059669' },

  // Category 4 — Cinematic & Rhythm
  { id: 16, title: 'Beat Dancer',      category: 'rhythm',  desc: 'Tap falling arrows right on the beat for high combos.',        icon: '🎵', color: '#e11d48' },
  { id: 17, title: 'Lip-Sync Match',   category: 'rhythm',  desc: 'Catch moving waveform segments inside the target zone.',       icon: '🎤', color: '#f472b6' },
  { id: 18, title: 'Spotlight',        category: 'rhythm',  desc: 'Match colors as the cinematic stage lights shift.',             icon: '🎭', color: '#fbbf24' },
  { id: 19, title: 'Camera Snap',      category: 'rhythm',  desc: 'Tap the exact moment the framing box aligns perfectly.',       icon: '📸', color: '#38bdf8' },
  { id: 20, title: 'Director\'s Cut',  category: 'rhythm',  desc: 'Repeat clapperboard sequences from memory, Simon-Says style.', icon: '🎬', color: '#4ade80' },

  // Category 5 — Classic Arcade
  { id: 21, title: 'Retro Snake',      category: 'arcade',  desc: 'Grow your snake longer without crashing into yourself.',       icon: '🐍', color: '#22c55e' },
  { id: 22, title: 'Pac Chase',        category: 'arcade',  desc: 'Eat dots and dodge smart ghosts in the classic maze.',         icon: '👻', color: '#facc15' },
  { id: 23, title: 'Tic-Tac-Toe',      category: 'arcade',  desc: 'Challenge an unbeatable Minimax AI opponent.',                 icon: '❌', color: '#3b82f6' },
  { id: 24, title: 'Pong',             category: 'arcade',  desc: 'Classic paddle duel against a dynamic AI opponent.',            icon: '🏓', color: '#e2e8f0' },
  { id: 25, title: 'Block Stacker',    category: 'arcade',  desc: 'Stack falling tetrominoes and clear completed lines.',          icon: '🟦', color: '#06b6d4' },

  // Category 6 — Casual Tap & Reflex
  { id: 26, title: 'Whack-a-Mole',    category: 'casual',  desc: 'Tap the moles before they vanish back underground.',           icon: '🔨', color: '#a16207' },
  { id: 27, title: 'Fruit Slicer',     category: 'casual',  desc: 'Swipe to slice flying fruits before they fall.',                icon: '🍉', color: '#16a34a' },
  { id: 28, title: 'Cookie Tycoon',    category: 'casual',  desc: 'Click cookies, buy upgrades, build a baking empire.',           icon: '🍪', color: '#d97706' },
  { id: 29, title: 'Hex Connect',      category: 'casual',  desc: 'Link matching colored hexagons across the board.',              icon: '⬡',  color: '#6366f1' },
  { id: 30, title: 'Color Jump',       category: 'casual',  desc: 'Bounce through rings that match your current color.',           icon: '🌈', color: '#f43f5e' },
  
  // Category 7 — Expansion Phase (Games 31-50)
  { id: 31, title: 'Auto-Rickshaw Weaver', category: 'action',  desc: 'Weave through heavy traffic in a high-speed auto-rickshaw chase.', icon: '🛺', color: '#f59e0b' },
  { id: 32, title: 'Choreography Master',  category: 'rhythm',  desc: 'Memorize and execute complex dance moves on the beat.',             icon: '💃', color: '#ec4899' },
  { id: 33, title: 'Film Reel Splicer',    category: 'brain',   desc: 'Connect the broken film strips in the editing room.',             icon: '🎞️', color: '#6b7280' },
  { id: 34, title: 'Stunt Coordinator',    category: 'action',  desc: 'Calculate the physics to safely launch your stunt driver.',       icon: '🏍️', color: '#ef4444' },
  { id: 35, title: 'Lighting Operator',    category: 'rhythm',  desc: 'Mix RGB values instantly to match the stage lighting cues.',      icon: '💡', color: '#3b82f6' },

  { id: 36, title: 'Alibi Audio Analyzer', category: 'mystery', desc: 'Find the spliced visual anomaly in the suspect\'s audio waveform.', icon: '🎙️', color: '#06b6d4' },
  { id: 37, title: 'Crime Board Connector',category: 'mystery', desc: 'Untangle the strings on the detective\'s crime board.',             icon: '📌', color: '#dc2626' },
  { id: 38, title: 'Mansion Safe Cracker', category: 'mystery', desc: 'Listen for the subtle click to crack the multi-dial safe.',       icon: '🗄️', color: '#d97706' },
  { id: 39, title: 'Fingerprint Forensics',category: 'mystery', desc: 'Rotate and overlay partial prints to find the perfect match.',    icon: '☝️', color: '#14b8a6' },
  { id: 40, title: 'Antidote Mixer',       category: 'brain',   desc: 'Sort the volatile chemical liquids to formulate the antidote.',   icon: '🧪', color: '#84cc16' },

  { id: 41, title: 'Face-Swap Memory',     category: 'brain',   desc: 'Match the original face to its altered deepfake version.',        icon: '🎭', color: '#d946ef' },
  { id: 42, title: 'Render Pipeline',      category: 'brain',   desc: 'Rotate server nodes to complete the render farm pipeline.',       icon: '🖥️', color: '#3b82f6' },
  { id: 43, title: 'Lip-Sync Editor',      category: 'rhythm',  desc: 'Align the vocal track with the visual cues in this rhythm game.', icon: '👄', color: '#a855f7' },
  { id: 44, title: 'VFX Particle Catcher', category: 'action',  desc: 'Catch the correct visual effects layers before they hit the floor!', icon: '✨', color: '#f97316' },
  { id: 45, title: 'Deepfake Detective',   category: 'mystery', desc: 'Spot the subtle visual glitch in two side-by-side images.',       icon: '🕵️', color: '#ef4444' },

  { id: 46, title: 'Neon Vector Racer',    category: 'arcade',  desc: 'Master the drift in this top-down neon vector racing game.',      icon: '🏎️', color: '#d946ef' },
  { id: 47, title: 'Quantum Orbiters',     category: 'action',  desc: 'Use gravity wells to steer the quantum particle to the target.',  icon: '⚛️', color: '#38bdf8' },
  { id: 48, title: 'Synthesizer Defense',  category: 'arcade',  desc: 'Place nodes to filter out the incoming visual noise viruses.',    icon: '🛡️', color: '#10b981' },
  { id: 49, title: 'Laser Reflection',     category: 'brain',   desc: 'Position the mirrors to reflect the energy beam into the receiver.', icon: '🪞', color: '#34d399' },
  { id: 50, title: 'The Final Core',       category: 'action',  desc: 'Survive the ultimate bullet hell against the rogue system core.', icon: '🔥', color: '#ef4444' },
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
  { id: 100, title: 'Space Asteroids Culler', category: 'action', desc: 'Clear the asteroid field using your spaceship blasters.', icon: '☄️', color: '#94a3b8' },
  // Category 9 — Expansion Phase 3 (Games 101-120)
  { id: 101, title: 'Solar Orbit Collector', category: 'action', desc: 'Navigate orbits to collect energy cores.', icon: '☀️', color: '#facc15' },
  { id: 102, title: 'Neon Cyber Runner', category: 'action', desc: 'Dodge obstacles in a retro-futuristic grid.', icon: '🏃', color: '#06b6d4' },
  { id: 103, title: 'Grid Block Sorter', category: 'brain', desc: 'Sort falling blocks into matching slots.', icon: '🔲', color: '#a855f7' },
  { id: 104, title: 'Space Dasher', category: 'action', desc: 'Dash between stars while avoiding asteroids.', icon: '🚀', color: '#ef4444' },
  { id: 105, title: 'Geometry Defense', category: 'action', desc: 'Defend your core from geometric enemies.', icon: '🔺', color: '#22c55e' },
  { id: 106, title: 'Color Switcher', category: 'casual', desc: 'Match your color to pass through barriers.', icon: '🎨', color: '#ec4899' },
  { id: 107, title: 'Gravity Flip', category: 'action', desc: 'Invert gravity to survive the endless tunnel.', icon: '🔄', color: '#8b5cf6' },
  { id: 108, title: 'Flappy Cube', category: 'action', desc: 'Keep your cube airborne through tight gaps.', icon: '🧊', color: '#3b82f6' },
  { id: 109, title: 'Ping Pong Solo', category: 'arcade', desc: 'Master the paddle in this solo reflex challenge.', icon: '🏓', color: '#f97316' },
  { id: 110, title: 'Target Tap', category: 'casual', desc: 'React quickly to tap shrinking targets.', icon: '🎯', color: '#ef4444' },
  { id: 111, title: 'Asteroid Dodger', category: 'action', desc: 'Weave through a chaotic asteroid field.', icon: '☄️', color: '#64748b' },
  { id: 112, title: 'Snake Classic', category: 'arcade', desc: 'The original growing serpent survival game.', icon: '🐍', color: '#10b981' },
  { id: 113, title: 'Jumper', category: 'action', desc: 'Leap across floating platforms to ascend.', icon: '🦘', color: '#facc15' },
  { id: 114, title: 'Maze Escape', category: 'mystery', desc: 'Find the exit before the walls close in.', icon: '🚪', color: '#dc2626' },
  { id: 115, title: 'Orbit Catcher', category: 'casual', desc: 'Catch falling particles in your orbital ring.', icon: '⭕', color: '#38bdf8' },
  { id: 116, title: 'Avoidance', category: 'action', desc: 'Evade an ever-growing swarm of trackers.', icon: '🚫', color: '#ef4444' },
  { id: 117, title: 'Tile Tap', category: 'casual', desc: 'Tap the correct fading tiles in sequence.', icon: '📱', color: '#22c55e' },
  { id: 118, title: 'Shooter', category: 'action', desc: 'Lock and fire in a classic retro blaster.', icon: '🔫', color: '#8b5cf6' },
  { id: 119, title: 'Column Matcher', category: 'brain', desc: 'Align columns rapidly to clear the board.', icon: '📊', color: '#0ea5e9' },
  { id: 120, title: 'Survival Zone', category: 'action', desc: 'Stay within the shrinking safe zone.', icon: '🛡️', color: '#facc15' }
];

const CATEGORIES = [
  { id: 'all',     label: 'All Games',       icon: '🎮' },
  { id: 'brain',   label: 'Brain & Logic',   icon: '🧠' },
  { id: 'action',  label: 'Action & Physics', icon: '🚀' },
  { id: 'mystery', label: 'Mystery',          icon: '🔍' },
  { id: 'rhythm',  label: 'Rhythm & Cinema',  icon: '🎵' },
  { id: 'arcade',  label: 'Classic Arcade',   icon: '👾' },
  { id: 'casual',  label: 'Casual & Reflex',  icon: '⚡' },
];

// Featured game IDs for the hero carousel
const FEATURED_IDS = [23, 14, 46, 71, 55, 74];

/* ---- Initialise on DOM ready ---- */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initCarousel();
  renderFilters();
  initSearch();
  renderGameGrid('all');
  initScrollAnimations();
  initCardGlow();
});

/* ================= SEARCH ================= */
function initSearch() {
  const searchInputs = document.querySelectorAll('input[placeholder="Search games..."]');
  searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const term = e.target.value;
      renderGameGrid(currentFilter, term);
    });
  });
}

/* ================= NAVBAR ================= */
function initNavbar() {
  const nav = document.querySelector('.navbar');
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('open');
      btn.classList.toggle('active');
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        btn.classList.remove('active');
      });
    });
  }
}

/* ================= CAROUSEL ================= */
function initCarousel() {
  const track = document.getElementById('carousel-track');
  const dotsWrap = document.getElementById('carousel-dots');
  if (!track || !dotsWrap) return;

  const featured = FEATURED_IDS.map(id => GAMES.find(g => g.id === id)).filter(Boolean);
  let current = 0;
  let autoTimer;

  // Build slides
  track.innerHTML = featured.map(game => {
    const catLabel = CATEGORIES.find(c => c.id === game.category)?.label || game.category;
    return `
      <div class="carousel-slide bg-white" style="box-shadow: 0 15px 40px rgba(0,0,0,0.12); border-radius: 1.5rem; width: 95%; max-width: 900px; margin: 0 auto; overflow: hidden; border: 1px solid rgba(0,0,0,0.05);">
        <div class="flex flex-col md:flex-row items-center justify-between p-6 md:p-12 min-h-[280px] md:min-h-[380px]">
          <div class="flex-1 text-center md:text-left mb-6 md:mb-0">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-wider"
                  style="background:${game.color}15;color:${game.color}">${catLabel}</span>
            <h2 class="text-3xl md:text-5xl font-extrabold mb-3 text-gray-900" style="font-family:var(--font-heading)">${game.title}</h2>
            <p class="text-gray-500 text-lg mb-6 max-w-md font-medium">${game.desc}</p>
            <a href="games/game${game.id}"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold !text-white transition-all hover:-translate-y-1 hover:shadow-lg hover:!text-white"
               style="background:${game.color}">▶ Play Now</a>
          </div>
          <div class="text-7xl md:text-[9rem] opacity-90 select-none drop-shadow-xl hover:scale-110 transition-transform duration-500">${game.icon}</div>
        </div>
      </div>`;
  }).join('');

  // Build dots
  dotsWrap.innerHTML = featured.map((_, i) =>
    `<button class="carousel-dot${i === 0 ? ' active' : ''}" data-i="${i}" aria-label="Slide ${i + 1}"></button>`
  ).join('');

  const dots = dotsWrap.querySelectorAll('.carousel-dot');

  function goTo(idx) {
    current = ((idx % featured.length) + featured.length) % featured.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)));

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }
  function stopAuto() { clearInterval(autoTimer); }

  const container = track.closest('.carousel-container');
  if (container) {
    container.addEventListener('mouseenter', stopAuto);
    container.addEventListener('mouseleave', startAuto);
  }
  startAuto();

  // Touch swipe
  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = touchX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) goTo(current + (dx > 0 ? 1 : -1));
  }, { passive: true });
}

/* ================= FILTERS ================= */
function renderFilters() {
  const wrap = document.getElementById('filter-buttons');
  if (!wrap) return;

  wrap.innerHTML = CATEGORIES.map(c =>
    `<button class="filter-btn${c.id === 'all' ? ' active' : ''}" data-cat="${c.id}">${c.icon} ${c.label}</button>`
  ).join('');

  wrap.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    wrap.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGameGrid(btn.dataset.cat);
  });
}

let currentFilter = 'all';
let currentSearch = '';

/* ================= GAME GRID ================= */
function renderGameGrid(filter = currentFilter, searchTerm = currentSearch) {
  currentFilter = filter;
  currentSearch = searchTerm;

  const grid = document.getElementById('game-grid');
  if (!grid) return;

  let list = currentFilter === 'all' ? [...GAMES] : GAMES.filter(g => g.category === currentFilter);
  
  if (currentSearch) {
      list = list.filter(g => g.title.toLowerCase().includes(currentSearch.toLowerCase()) || g.desc.toLowerCase().includes(currentSearch.toLowerCase()));
  }

  // Sorting Logic Rules
  // Premium: Curated list of the most interesting/best games to show first
  const premiumIds = [58, 60, 85, 79, 38, 1, 95, 92, 90, 88, 86, 77, 74, 69, 54, 55, 46, 50, 31, 34, 16, 6, 21, 24];
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
      
      // Randomize the rest so users see different interesting games instead of 1-100 ordered
      return Math.random() - 0.5; 
  });

  grid.innerHTML = list.map((game, i) => `
    <a href="games/game${game.id}/index.html" class="game-card bg-white rounded-2xl border-0 hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden animate-fade-in-up shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] group relative">
      <div class="w-full h-36 relative overflow-hidden bg-gray-50">
        <img src="/assets/thumbnails/game${game.id}.jpg?v=6" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${game.title} free online browser game thumbnail" onerror="this.onerror=null; this.src='/assets/thumbnails/default-arcade.jpg?v=6';">
      </div>
      <div class="p-4 flex flex-col flex-grow items-center text-center bg-white rounded-b-2xl">
        <span class="category-badge mb-1.5 uppercase tracking-widest font-extrabold text-[#7361F2]" style="font-size:0.65rem;">${game.category}</span>
        <h3 class="font-extrabold text-gray-800 text-[17px] mb-4 line-clamp-1" style="font-family:var(--font-heading)">${game.title}</h3>
        <button class="bg-[#ef4444] text-white rounded-xl py-2 px-6 text-sm font-bold shadow-md hover:bg-[#dc2626] hover:shadow-lg transition-all w-full mt-auto active:scale-95">Play Now</button>
      </div>
    </a>`).join('');
}

/* ================= SCROLL ANIMATIONS ================= */
function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('animate-fade-in-up');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.scroll-reveal').forEach(el => obs.observe(el));
}

/* ================= CARD GLOW ================= */
function initCardGlow() {
  document.addEventListener('mousemove', e => {
    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', ((e.clientX - r.left) / r.width * 100) + '%');
    });
  }, { passive: true });
}

/* ================= GLOBAL LOADER ================= */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 500);
  }
});


function getGameSvg(game) {
    const cats = {
        'brain': `<rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/><circle cx="12" cy="12" r="4" fill="#fff"/>`,
        'action': `<path d="M12 2L22 20H2L12 2Z" fill="currentColor"/><circle cx="12" cy="14" r="3" fill="#fff"/>`,
        'mystery': `<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="4" fill="none"/><path d="M15 15L21 21" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
        'rhythm': `<path d="M9 18V5L21 3V16" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="16" r="3" fill="currentColor"/>`,
        'arcade': `<rect x="6" y="2" width="12" height="20" rx="2" fill="currentColor"/><rect x="8" y="5" width="8" height="6" fill="#fff"/>`,
        'casual': `<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6V18M6 12H18" stroke="#fff" stroke-width="2"/>`
    };
    return `<svg class="w-16 h-16 opacity-90" style="color: ${game.color}" viewBox="0 0 24 24">${cats[game.category] || cats['casual']}</svg>`;
}