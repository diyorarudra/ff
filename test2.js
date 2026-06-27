const fs = require('fs');

const code = fs.readFileSync('games/game9/index.html', 'utf8');
const scripts = code.match(/<script>([\s\S]*?)<\/script>/g);
const headCode = scripts[0].replace(/<\/?script>/g, '').replace('tailwind.config', 'let tailwind = {}; tailwind.config');

try {
    eval('let score = 0; let wave = 1; ' + headCode + '; ' + 
    'let speedMult = 1; let baseVelocity = speedMult * (wave * 0.2 + 1); ' +
    'let dynamicVelocity = typeof getDynamicVelocity === "function" ? getDynamicVelocity(baseVelocity) : baseVelocity; ' +
    'console.log("SUCCESS! dynamicVelocity:", dynamicVelocity);');
} catch(e) {
    console.error('EVAL ERROR:', e);
}
