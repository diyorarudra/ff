const fs = require('fs');
const path = require('path');

// GAME 9
let file9 = path.join(__dirname, 'games', 'game9', 'index.html');
let content9 = fs.readFileSync(file9, 'utf8');

const newUI9 = `
    <!-- Mobile Controls -->
    <div class="w-full grid grid-cols-2 gap-4 md:hidden opacity-70">
      <div class="flex justify-start gap-2">
        <button id="btnLeft" class="bg-nexus-card border border-white/10 w-14 h-14 rounded-full flex items-center justify-center text-2xl active:bg-white/20">&larr;</button>
        <button id="btnRight" class="bg-nexus-card border border-white/10 w-14 h-14 rounded-full flex items-center justify-center text-2xl active:bg-white/20">&rarr;</button>
      </div>
      <div class="flex justify-end gap-2">
        <button id="btnDown" class="bg-nexus-card border border-white/10 w-14 h-14 rounded-full flex items-center justify-center text-2xl active:bg-white/20">&darr;</button>
      </div>
    </div>
`;

content9 = content9.replace(/<!-- Mobile Controls -->[\s\S]*?<\/div>\s*<\/div>/, newUI9.trim());

const logicToReplace9 = `const keys = {left: false, right: false, down: false};`;
const replacementLogic9 = `const keys = {left: false, right: false, down: false};
['btnLeft', 'btnRight', 'btnDown'].forEach(id => {
    let el = document.getElementById(id);
    if(el) {
        el.addEventListener('touchstart', e => { e.preventDefault(); if(id==='btnLeft') keys.left=true; if(id==='btnRight') keys.right=true; if(id==='btnDown') keys.down=true; });
        el.addEventListener('touchend', e => { e.preventDefault(); if(id==='btnLeft') keys.left=false; if(id==='btnRight') keys.right=false; if(id==='btnDown') keys.down=false; });
    }
});`;
content9 = content9.replace(logicToReplace9, replacementLogic9);
fs.writeFileSync(file9, content9, 'utf8');

// GAME 10
let file10 = path.join(__dirname, 'games', 'game10', 'index.html');
let content10 = fs.readFileSync(file10, 'utf8');

const newUI10 = `
    <!-- Mobile Controls -->
    <div class="w-full flex justify-center gap-8 md:hidden opacity-70 px-4">
        <button id="btnLeft" class="bg-nexus-card border border-white/10 w-20 h-20 rounded-lg flex items-center justify-center text-4xl active:bg-white/20">&larr;</button>
        <button id="btnRight" class="bg-nexus-card border border-white/10 w-20 h-20 rounded-lg flex items-center justify-center text-4xl active:bg-white/20">&rarr;</button>
    </div>
`;
content10 = content10.replace(/<!-- Mobile Controls -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newUI10.trim() + "\n  </div>");

const logicToReplace10 = `const keys = {left: false, right: false};`;
const replacementLogic10 = `const keys = {left: false, right: false};
['btnLeft', 'btnRight'].forEach(id => {
    let el = document.getElementById(id);
    if(el) {
        el.addEventListener('touchstart', e => { e.preventDefault(); if(id==='btnLeft') keys.left=true; if(id==='btnRight') keys.right=true; });
        el.addEventListener('touchend', e => { e.preventDefault(); if(id==='btnLeft') keys.left=false; if(id==='btnRight') keys.right=false; });
    }
});`;
content10 = content10.replace(logicToReplace10, replacementLogic10);
fs.writeFileSync(file10, content10, 'utf8');
