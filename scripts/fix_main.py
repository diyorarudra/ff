import sys

with open('js/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '  // Build slides\n'
end_marker = '/* ================= SCROLL ANIMATIONS ================= */'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print('Could not find markers!')
    sys.exit(1)

new_content = content[:start_idx] + '''  // Build slides
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
            <a href="play.html?game=${game.slug}"
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

let currentFilter = 'all';

/* ================= FILTERS ================= */
function renderFilters() {
  const wrap = document.getElementById('filter-buttons');
  if (!wrap) return;

  wrap.innerHTML = CATEGORIES.map(c =>
    `<button class="filter-btn${c.id === 'all' ? ' active' : ''}" data-cat="${c.id}">${c.icon} ${c.label}</button>`
  ).join('');

  const btns = wrap.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cat;
      const term = document.querySelector('input[placeholder="Search games..."]')?.value || '';
      renderGameGrid(currentFilter, term);
    });
  });
}

window.renderGameGrid = function(cat = 'all', term = '') {
  const grid = document.getElementById('game-grid');
  if (!grid) return;
  
  let list = GAMES;
  
  if (cat !== 'all') {
    list = list.filter(g => g.category === cat);
  }
  
  if (term) {
    const lowerTerm = term.toLowerCase();
    list = list.filter(g => g.title.toLowerCase().includes(lowerTerm) || g.category.toLowerCase().includes(lowerTerm));
  }

  const fixedFirstIds = [15, 65, 63, 80, 92, 77, 93, 12, 45, 77, 83, 89, 90, 91, 100]; // Array of game IDs to always show first in this exact order
  // Premium: Curated list of the most interesting/best games to show first
  const premiumIds = [58, 60, 85, 79, 38, 1, 95, 92, 90, 88, 86, 77, 74, 69, 54, 55, 46, 50, 31, 34, 16, 6, 21, 24];
  const lowIds = [84, 64, 80, 81];

  list.sort((a, b) => {
      // 1. Check fixed first games
      const aFixedIdx = fixedFirstIds.indexOf(a.id);
      const bFixedIdx = fixedFirstIds.indexOf(b.id);
      
      if (aFixedIdx !== -1 && bFixedIdx !== -1) return aFixedIdx - bFixedIdx;
      if (aFixedIdx !== -1) return -1;
      if (bFixedIdx !== -1) return 1;

      // 2. Check premium/low tier games
      const aPremium = premiumIds.includes(a.id);
      const bPremium = premiumIds.includes(b.id);
      const aLow = lowIds.includes(a.id);
      const bLow = lowIds.includes(b.id);

      if (aPremium && !bPremium) return -1;
      if (!aPremium && bPremium) return 1;
      if (aLow && !bLow) return 1;
      if (!aLow && bLow) return -1;
      
      // 3. Randomize the rest so users see different interesting games instead of 1-100 ordered
      return Math.random() - 0.5; 
  });

  const playNowText = typeof window.T === 'function' ? window.T('Play Now') : 'Play Now';

  grid.innerHTML = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">' + list.map((game, i) => `
    <a href="play.html?game=${game.slug}" onclick="if(typeof trackGameStart==='function') trackGameStart('${game.slug}', '${game.category}')" class="game-card bg-white rounded-2xl border-0 hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden animate-fade-in-up shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] group relative">
      <div class="w-full h-36 relative overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style="background:${game.color}15">
        <div class="text-7xl opacity-90 drop-shadow-md select-none">${game.icon}</div>
      </div>
      <div class="p-4 flex flex-col flex-grow items-center text-center bg-white rounded-b-2xl">
        <span class="category-badge mb-1.5 uppercase tracking-widest font-extrabold text-[#7361F2]" style="font-size:0.65rem;">${game.category}</span>
        <h3 class="font-extrabold text-gray-800 text-[17px] mb-4 line-clamp-1" style="font-family:var(--font-heading)">${game.title}</h3>
        <button class="bg-[#ef4444] text-white rounded-xl py-2 px-6 text-sm font-bold shadow-md hover:bg-[#dc2626] hover:shadow-lg transition-all w-full mt-auto active:scale-95">${playNowText}</button>
      </div>
    </a>`).join('') + '</div>';
}

\n''' + content[end_idx:]

with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Fixed js/main.js successfully!')
