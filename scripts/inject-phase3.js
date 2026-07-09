const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '../js/main.js');
let content = fs.readFileSync(mainJsPath, 'utf8');

const anchor1 = '  if (currentSearch) {\r\n      list = list.filter(g => g.title.toLowerCase().includes(currentSearch.toLowerCase()) || g.desc.toLowerCase().includes(currentSearch.toLowerCase()));\r\n  }';

const injection1 = "\\n  if (currentFilter === 'all' && (!currentSearch || currentSearch.trim() === '')) {\\n      if (typeof window.renderHomepageSections === 'function') {\\n          window.renderHomepageSections(grid, GAMES);\\n          return;\\n      }\\n  }\\n";

if (!content.includes('typeof window.renderHomepageSections')) {
    content = content.replace(anchor1, anchor1 + injection1);
}

const anchor2Regex = /grid\.innerHTML = list\.map[^`]*\`[\s\S]*?<\/a>\`\)\.join\(''\);/;

const newGridHtml = "  const playNowText = typeof window.T === 'function' ? window.T('Play Now') : 'Play Now';\\n\\n  grid.innerHTML = '<div class=\"grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6\">' + list.map((game, i) => `\\n    <a href=\"games/${game.slug}/index.html\" onclick=\"if(typeof trackGameStart==='function') trackGameStart('${game.slug}', '${game.category}')\" class=\"game-card bg-white rounded-2xl border-0 hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden animate-fade-in-up shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] group relative\">\\n      <div class=\"w-full h-36 relative overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-110\" style=\"background:${game.color}15\">\\n        <div class=\"text-7xl opacity-90 drop-shadow-md select-none\">${game.icon}</div>\\n      </div>\\n      <div class=\"p-4 flex flex-col flex-grow items-center text-center bg-white rounded-b-2xl\">\\n        <span class=\"category-badge mb-1.5 uppercase tracking-widest font-extrabold text-[#7361F2]\" style=\"font-size:0.65rem;\">${game.category}</span>\\n        <h3 class=\"font-extrabold text-gray-800 text-[17px] mb-4 line-clamp-1\" style=\"font-family:var(--font-heading)\">${game.title}</h3>\\n        <button class=\"bg-[#ef4444] text-white rounded-xl py-2 px-6 text-sm font-bold shadow-md hover:bg-[#dc2626] hover:shadow-lg transition-all w-full mt-auto active:scale-95\">${playNowText}</button>\\n      </div>\\n    </a>`).join('') + '</div>';";

content = content.replace(anchor2Regex, newGridHtml);

fs.writeFileSync(mainJsPath, content, 'utf8');
console.log('Phase 3 logic successfully injected into js/main.js');
