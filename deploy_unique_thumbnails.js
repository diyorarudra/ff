const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'js', 'main.js');
if (fs.existsSync(mainJsPath)) {
    let js = fs.readFileSync(mainJsPath, 'utf8');
    
    js = js.replace(/grid\.innerHTML = list\.map[\s\S]*?join\(''\);/, `
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
  grid.style.gap = '1.5rem';
  grid.style.padding = '2rem 0';
  
  grid.innerHTML = list.map((game, i) => \`
    <a href="games/game\${game.id}/index.html" class="game-card bg-white rounded-xl border border-gray-100 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden animate-fade-in-up" style="box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); animation-delay:\${(i % 10) * 0.04}s;">
      <div class="w-full h-36 bg-white">
        <img src="/assets/thumbnails/game\${game.id}.jpg" class="w-full h-36 object-cover rounded-t-xl" alt="\${game.title}" onerror="this.onerror=null; this.src='/assets/thumbnails/default-arcade.jpg';">
      </div>
      <div class="p-4 flex flex-col flex-grow items-center text-center bg-white rounded-b-xl">
        <h3 class="font-bold text-gray-900 text-lg mb-3" style="font-family:var(--font-heading)">\${game.title}</h3>
        <button class="play-now-btn bg-[#7361F2] text-white rounded-xl py-2.5 px-5 font-bold hover:bg-[#FFC42C] transition-all w-full mt-auto">Play Now</button>
      </div>
    </a>\`).join('');`);
    
    fs.writeFileSync(mainJsPath, js, 'utf8');
    console.log('[THUMBNAILS MAPPED]: Hardcoded image loops eliminated; unique structural assets assigned per game container');
}
