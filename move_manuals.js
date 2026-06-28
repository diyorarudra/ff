const fs = require('fs');
const path = require('path');

let f9 = path.join(__dirname, 'games', 'game9', 'index.html');
let c9 = fs.readFileSync(f9, 'utf8');

const divRegex9 = /<div style="background:#1a1a2e;[^>]+>Cyber Neon Forge Operations Manual:.*?<\/div>\n?/;
let manualText9 = "Cyber Neon Forge Operations Manual: Align falling energy cells with matching furnace terminals. Use Left and Right Arrow keys or touch side grids to navigate positions horizontally. Clear complete horizontal thermal tracks before energy components overload the canvas buffer matrix.";
if (c9.match(divRegex9)) {
    c9 = c9.replace(divRegex9, '');
}

if (!c9.includes('class="text-gray-400 text-sm mt-4 text-center">Cyber Neon Forge')) {
    c9 = c9.replace(/(<!-- Mobile Controls -->[\s\S]*?<\/div>\n\s*)(<\/div>)/, `$1<p class="text-gray-400 text-sm mt-4 text-center">\n  ${manualText9}\n</p>\n$2`);
}
fs.writeFileSync(f9, c9, 'utf8');


let f10 = path.join(__dirname, 'games', 'game10', 'index.html');
let c10 = fs.readFileSync(f10, 'utf8');
const divRegex10 = /<div style="background:#1a1a2e;[^>]+>Orbit Velocity Defender Operations Manual:.*?<\/div>\n?/;
let manualText10 = "Orbit Velocity Defender Operations Manual: Safeguard your central core structure from high-velocity orbital debris matrices. Press A and D or tap your mobile direction buttons to pivot the exterior defensive plating 360 degrees. Match the color matrix of the shield block with incoming impact vectors to survive.";
if (c10.match(divRegex10)) {
    c10 = c10.replace(divRegex10, '');
}

if (!c10.includes('class="text-gray-400 text-sm mt-4 text-center">Orbit Velocity Defender')) {
    c10 = c10.replace(/(<!-- Mobile Controls -->[\s\S]*?<\/div>\n\s*)(<\/div>)/, `$1<p class="text-gray-400 text-sm mt-4 text-center">\n  ${manualText10}\n</p>\n$2`);
}
fs.writeFileSync(f10, c10, 'utf8');
console.log("Moved manuals for Game 9 and 10.");
