const fs = require('fs');
const path = require('path');

function updateRoutes(filename) {
    const filePath = path.join(__dirname, '../js', filename);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace games/${game.slug}/index.html with play.html?game=${game.slug}
    // and games/${g.slug}/index.html with play.html?game=${g.slug} (if used)
    
    content = content.replace(/href="games\/\$\{game\.slug\}\/index\.html"/g, 'href="play.html?game=${game.slug}"');
    content = content.replace(/href="games\/\$\{g\.slug\}\/index\.html"/g, 'href="play.html?game=${g.slug}"');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated routes in ' + filename);
}

updateRoutes('main.js');
updateRoutes('platform.js');
