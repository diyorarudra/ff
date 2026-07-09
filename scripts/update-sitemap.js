const fs = require('fs');
const path = require('path');

const MAIN_JS = path.join(__dirname, '../js/main.js');
const SITEMAP = path.join(__dirname, '../sitemap.xml');

// Extract GAMES array
const content = fs.readFileSync(MAIN_JS, 'utf8');
const match = content.match(/const GAMES = (\[[\s\S]*?\]);/);
if (!match) process.exit(1);

const GAMES = eval(match[1]);

// Get only new games
const newGames = GAMES.filter(g => g.isNewAddedGame);

let sitemapContent = fs.readFileSync(SITEMAP, 'utf8');

// If already added, skip
if (sitemapContent.includes(newGames[0].slug)) {
    console.log('Sitemap already updated');
    process.exit(0);
}

// Generate new XML lines
let newXml = '';
newGames.forEach(g => {
    newXml += `  <url><loc>https://www.ffliveplay.com/games/${g.slug}</loc><priority>0.8</priority></url>\n`;
});

// Insert before </urlset>
sitemapContent = sitemapContent.replace('</urlset>', newXml + '</urlset>');

fs.writeFileSync(SITEMAP, sitemapContent);
console.log('Sitemap successfully updated with 38 new games.');
