const fs = require('fs');
const mainJsContent = fs.readFileSync('js/main.js', 'utf8');
const gamesMatch = mainJsContent.match(/const GAMES = (\[[\s\S]*?\]);\s*const CATEGORIES/);
const GAMES = eval(gamesMatch[1]);
const idToSlug = {};
GAMES.forEach(game => { idToSlug[game.id] = game.slug; });

let sitemap = fs.readFileSync('sitemap.xml', 'utf8');
// Replace game IDs with slugs in sitemap
sitemap = sitemap.replace(/\/games\/game(\d+)<\ /g, (match, p1) => {
    // Wait, the tag is </loc>
});
// better regex for sitemap:
sitemap = sitemap.replace(/\/games\/game(\d+)</g, (match, p1) => {
    let id = parseInt(p1);
    if (idToSlug[id]) return `/games/${idToSlug[id]}<`;
    return match;
});

fs.writeFileSync('sitemap.xml', sitemap);
console.log('Fixed sitemap.xml');
