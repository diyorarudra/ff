const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '../games');
const folders = fs.readdirSync(gamesDir).filter(f => fs.statSync(path.join(gamesDir, f)).isDirectory());

let allInjected = true;
let total = 0;
let missingCss = [];
let missingJs = [];
let duplicateTags = [];

folders.forEach(folder => {
    const indexPath = path.join(gamesDir, folder, 'index.html');
    if (!fs.existsSync(indexPath)) return;
    
    const html = fs.readFileSync(indexPath, 'utf8');
    total++;
    
    const hasCss = html.includes('/css/game-rewards.css');
    const hasJs = html.includes('/js/game-rewards.js');
    
    // check for duplicates
    const cssCount = (html.match(/\/css\/game-rewards\.css/g) || []).length;
    const jsCount = (html.match(/\/js\/game-rewards\.js/g) || []).length;
    
    if (!hasCss) missingCss.push(folder);
    if (!hasJs) missingJs.push(folder);
    
    if (cssCount > 1 || jsCount > 1) {
        duplicateTags.push(folder);
    }
});

console.log(`Total games checked: ${total}`);
if (missingCss.length === 0 && missingJs.length === 0 && duplicateTags.length === 0) {
    console.log("SUCCESS: All games have exactly one game-rewards.css and game-rewards.js tag.");
} else {
    console.log("ISSUES FOUND:");
    if (missingCss.length > 0) console.log("Missing CSS:", missingCss);
    if (missingJs.length > 0) console.log("Missing JS:", missingJs);
    if (duplicateTags.length > 0) console.log("Duplicate Tags:", duplicateTags);
}
