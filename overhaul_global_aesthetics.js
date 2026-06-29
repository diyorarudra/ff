const fs = require('fs');
const path = require('path');

const NAV_TEMPLATE = `<nav class="navbar px-4 py-3 bg-white shadow-sm sticky top-0 z-50">
  <div class="max-w-7xl mx-auto flex items-center justify-between">
    <a href="/index.html" class="flex items-center gap-2 font-bold font-heading text-gray-900">
      <svg class="w-8 h-8 text-[#7361F2]" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="6" width="20" height="12" rx="4"></rect><circle cx="17" cy="12" r="1" fill="#fff"></circle><circle cx="14" cy="12" r="1" fill="#fff"></circle><path d="M6 12h4m-2-2v4" stroke="#fff" stroke-width="2"></path></svg>
      <span class="text-xl font-extrabold tracking-tight" style="color: #7361F2;">GamiDay</span>
    </a>
    <div class="hidden md:flex items-center gap-8 font-semibold text-[#111]">
      <a href="/index.html" class="hover:text-[#7361F2] transition-colors">Home</a>
      <a href="#" class="hover:text-[#7361F2] transition-colors">Affiliates</a>
      <a href="#" class="hover:text-[#7361F2] transition-colors">Developers</a>
      <a href="/compliance/about-us.html" class="hover:text-[#7361F2] transition-colors">About Us</a>
      <a href="#" class="hover:text-[#7361F2] transition-colors">Contact Us</a>
    </div>
    <div class="flex items-center gap-4">
      <div class="relative hidden sm:block">
        <input type="text" placeholder="Search games..." class="border border-gray-200 rounded-full py-1.5 pl-9 pr-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7361F2] text-gray-800 w-48 transition-all">
        <svg class="w-4 h-4 text-gray-400 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>
      <button class="w-8 h-8 rounded-full bg-[#FFC42C] flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
      </button>
    </div>
  </div>
</nav>`;

function replaceNav(content) {
    return content.replace(/<nav class="navbar[\s\S]*?<\/nav>/, NAV_TEMPLATE);
}

// 1. Update CSS
const cssPath = path.join(__dirname, 'css', 'style.css');
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    css = css.replace(/body\s*\{[\s\S]*?background-color:\s*#06060e;[\s\S]*?\}/, (match) => {
        return match.replace(/background-color:\s*#06060e;/, 'background: linear-gradient(135deg, #7361F2 0%, #7C67DD 100%);\n  background-attachment: fixed;');
    });
    fs.writeFileSync(cssPath, css, 'utf8');
    console.log('[THEME OVERHAUL COMPLETED]: File css/style.css successfully refactored to Premium Light Mode');
}

// 2. Update js/main.js
const mainJsPath = path.join(__dirname, 'js', 'main.js');
if (fs.existsSync(mainJsPath)) {
    let js = fs.readFileSync(mainJsPath, 'utf8');
    
    const svgFunc = `
function getGameSvg(game) {
    const cats = {
        'brain': \`<rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/><circle cx="12" cy="12" r="4" fill="#fff"/>\`,
        'action': \`<path d="M12 2L22 20H2L12 2Z" fill="currentColor"/><circle cx="12" cy="14" r="3" fill="#fff"/>\`,
        'mystery': \`<circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="4" fill="none"/><path d="M15 15L21 21" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>\`,
        'rhythm': \`<path d="M9 18V5L21 3V16" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="16" r="3" fill="currentColor"/>\`,
        'arcade': \`<rect x="6" y="2" width="12" height="20" rx="2" fill="currentColor"/><rect x="8" y="5" width="8" height="6" fill="#fff"/>\`,
        'casual': \`<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6V18M6 12H18" stroke="#fff" stroke-width="2"/>\`
    };
    return \`<svg class="w-16 h-16 opacity-90" style="color: \${game.color}" viewBox="0 0 24 24">\${cats[game.category] || cats['casual']}</svg>\`;
}`;
    if (!js.includes('function getGameSvg')) {
        js = js + '\n' + svgFunc;
    }
    
    js = js.replace(/grid\.innerHTML = list\.map[\s\S]*?join\(''\);/, `
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(180px, 1fr))';
  grid.style.gap = '1.5rem';
  grid.style.padding = '2rem 0';
  
  grid.innerHTML = list.map((game, i) => \`
    <a href="games/game\${game.id}/index.html" class="game-card bg-white rounded-lg drop-shadow-sm border border-gray-100 hover:shadow-lg transition-all animate-fade-in-up flex flex-col overflow-hidden" style="animation-delay:\${(i % 10) * 0.04}s;">
      <div class="w-full h-32 object-cover rounded-t-xl flex items-center justify-center bg-white/10" style="background: linear-gradient(135deg, \${game.color}22, \${game.color}44)">
        \${getGameSvg(game)}
      </div>
      <div class="p-4 flex flex-col flex-grow items-center text-center">
        <h3 class="font-bold text-gray-900 text-base mb-3" style="font-family:var(--font-heading)">\${game.title}</h3>
        <button class="play-now-btn bg-[#FFC42C] text-white rounded-lg py-2 px-5 font-bold hover:bg-[#eab308] transition-colors w-full mt-auto drop-shadow-sm">Play Now</button>
      </div>
    </a>\`).join('');`);
    
    fs.writeFileSync(mainJsPath, js, 'utf8');
    console.log('[THEME OVERHAUL COMPLETED]: File js/main.js successfully refactored to Premium Light Mode');
}

// 3. Update index.html
const indexHtmlPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let content = fs.readFileSync(indexHtmlPath, 'utf8');
    content = replaceNav(content);
    content = content.replace(/bg-\[#06060e\]/g, 'bg-[#7361F2]');
    content = content.replace(/<body class="([^"]*?)"/, (m, p1) => {
        let cls = p1.replace(/bg-\[#06060e\]/, 'bg-[#7361F2]').replace(/text-white/, 'text-gray-900');
        return `<body class="${cls}" style="background: linear-gradient(135deg, #7361F2 0%, #7C67DD 100%); background-attachment: fixed;"`;
    });
    fs.writeFileSync(indexHtmlPath, content, 'utf8');
    console.log('[THEME OVERHAUL COMPLETED]: File index.html successfully refactored to Premium Light Mode');
}

// 4. Update Games
const gamesDir = path.join(__dirname, 'games');
if (fs.existsSync(gamesDir)) {
    const folders = fs.readdirSync(gamesDir);
    for (const folder of folders) {
        const indexPath = path.join(gamesDir, folder, 'index.html');
        if (fs.existsSync(indexPath)) {
            let content = fs.readFileSync(indexPath, 'utf8');
            content = replaceNav(content);
            
            content = content.replace(/<body class="([^"]*?)"/, (m, p1) => {
                let cls = p1.replace(/text-white/, 'text-gray-900').replace(/bg-\[#06060e\]/, 'bg-[#7361F2]');
                return `<body class="${cls}" style="background: linear-gradient(135deg, #7361F2 0%, #7C67DD 100%); background-attachment: fixed;"`;
            });

            content = content.replace(/<div class="game-header[\s\S]*?<\/div>\s*<\/div>/, (match) => {
                let replaced = match.replace(/class="game-header[^"]*"/, 'class="game-header w-full max-w-3xl flex justify-between items-center bg-white rounded-lg p-3 mb-4 shadow-sm border border-gray-200"');
                replaced = replaced.replace(/text-white/g, 'text-gray-900').replace(/text-fuchsia-500/g, 'text-[#7361F2]');
                replaced = replaced.replace(/class="game-btn[^"]*"/g, 'class="game-btn bg-[#FFC42C] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-[#eab308] transition-colors drop-shadow-sm"');
                replaced = replaced.replace(/id="newGameBtn" class="game-btn"/g, 'id="newGameBtn" class="game-btn bg-[#FFC42C] text-white px-4 py-1.5 rounded-lg font-bold hover:bg-[#eab308] transition-colors drop-shadow-sm"');
                return replaced;
            });
            
            content = content.replace(/class="([^"]*bg-\[#131a26\][^"]*)"/g, (m, p1) => {
                return `class="${p1.replace('bg-[#131a26]', 'bg-[#FFFFFF]').replace(/border-white\/[0-9]+/, 'border-gray-200').replace('shadow-[0_0_20px_rgba(0,0,0,0.5)]', 'drop-shadow-sm')}"`;
            });
            content = content.replace(/class="([^"]*bg-\[#030712\][^"]*)"/g, (m, p1) => {
                return `class="${p1.replace('bg-[#030712]', 'bg-[#FFFFFF]').replace(/border-fuchsia-900\/30/, 'border-gray-200').replace('shadow-[0_0_50px_rgba(217,70,239,0.15)]', 'drop-shadow-sm')}"`;
            });

            content = content.replace(/bg-nexus-elevated/g, 'bg-white drop-shadow-sm text-gray-800');
            content = content.replace(/border-white\/5/g, 'border-gray-200');

            fs.writeFileSync(indexPath, content, 'utf8');
            console.log(`[THEME OVERHAUL COMPLETED]: File games/${folder}/index.html successfully refactored to Premium Light Mode`);
        }
    }
}

// 5. Update Blogs
const blogDir = path.join(__dirname, 'blog');
if (fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir);
    for (const file of files) {
        if (file.endsWith('.html')) {
            const filepath = path.join(blogDir, file);
            let content = fs.readFileSync(filepath, 'utf8');
            content = replaceNav(content);
            
            content = content.replace(/<body class="([^"]*?)"/, (m, p1) => {
                let cls = p1.replace(/bg-nexus-dark/, 'bg-[#7361F2]')
                            .replace(/bg-\[#06060e\]/, 'bg-[#7361F2]')
                            .replace(/text-gray-300/, 'text-gray-900')
                            .replace(/text-white/, 'text-gray-900');
                return `<body class="${cls}" style="background: linear-gradient(135deg, #7361F2 0%, #7C67DD 100%); background-attachment: fixed;"`;
            });

            content = content.replace(/bg-nexus-elevated/g, 'bg-white drop-shadow-sm text-gray-800');
            content = content.replace(/border-white\/5/g, 'border-gray-200');
            
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`[THEME OVERHAUL COMPLETED]: File blog/${file} successfully refactored to Premium Light Mode`);
        }
    }
}
