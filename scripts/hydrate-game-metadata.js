const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '../games');

function toTitleCase(str) {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function processGames() {
    const games = fs.readdirSync(gamesDir);
    let count = 0;

    games.forEach(slug => {
        const gamePath = path.join(gamesDir, slug);
        if (fs.statSync(gamePath).isDirectory()) {
            const indexPath = path.join(gamePath, 'index.html');
            if (fs.existsSync(indexPath)) {
                let content = fs.readFileSync(indexPath, 'utf8');
                let original = content;

                // Extract game name from existing title if possible, else derive from slug
                let gameName = toTitleCase(slug);
                const titleMatch = content.match(/<title>Play (.*?) Online/i);
                if (titleMatch && titleMatch[1]) {
                    gameName = titleMatch[1].trim();
                } else {
                    const fallbackMatch = content.match(/<title>(.*?)(?:-|\|)/i);
                    if (fallbackMatch && fallbackMatch[1]) {
                        gameName = fallbackMatch[1].trim();
                    }
                }

                // 1. Dynamic Page Titles
                content = content.replace(/<title>.*?<\/title>/gi, `<title>${gameName} - Play Free Online Game | FFLivePlay</title>`);
                content = content.replace(/<meta\s+property=["']og:title["'].*?>/gi, `<meta property="og:title" content="${gameName} - Play Free Online Game | FFLivePlay">`);
                content = content.replace(/<meta\s+name=["']twitter:title["'].*?>/gi, `<meta name="twitter:title" content="${gameName} - Play Free Online Game | FFLivePlay">`);

                // 2. Granular Meta Descriptions
                const descText = `Play ${gameName} online for free instantly on FFLivePlay. Experience high-performance, no-download ${gameName} browser gameplay directly in your viewport.`;
                content = content.replace(/<meta\s+name=["']description["'].*?>/gi, `<meta name="description" content="${descText}">`);
                content = content.replace(/<meta\s+property=["']og:description["'].*?>/gi, `<meta property="og:description" content="${descText}">`);
                content = content.replace(/<meta\s+name=["']twitter:description["'].*?>/gi, `<meta name="twitter:description" content="${descText}">`);

                // 3. Isolated Absolute Canonicals
                if (/<link\s+rel=["']canonical["'].*?>/i.test(content)) {
                    content = content.replace(/<link\s+rel=["']canonical["'].*?>/gi, `<link rel="canonical" href="https://www.ffliveplay.com/games/${slug}/" />`);
                } else {
                    // Inject if missing
                    content = content.replace(/<head>/i, `<head>\n  <link rel="canonical" href="https://www.ffliveplay.com/games/${slug}/" />`);
                }

                // 4. Targeted Card Rich Previews
                const imageUrl = `https://www.ffliveplay.com/assets/thumbnails/${slug}.png`;
                content = content.replace(/<meta\s+property=["']og:image["'].*?>/gi, `<meta property="og:image" content="${imageUrl}">`);
                content = content.replace(/<meta\s+name=["']twitter:image["'].*?>/gi, `<meta name="twitter:image" content="${imageUrl}">`);

                // 5. Icon Footprint Retention
                // Remove existing favicons to prevent duplicates
                content = content.replace(/<link[^>]*rel=["'](icon|shortcut icon|apple-touch-icon)["'][^>]*>\r?\n?/gi, '');
                
                // Inject favicons right after <head>
                const faviconTags = `\n  <link rel="icon" type="image/x-icon" href="/favicon.ico" />\n  <link rel="shortcut icon" type="image/png" href="/favicon.png" />\n  <link rel="apple-touch-icon" href="/favicon.png" />`;
                content = content.replace(/<head>/i, `<head>${faviconTags}`);

                if (content !== original) {
                    fs.writeFileSync(indexPath, content);
                    count++;
                }
            }
        }
    });
    console.log(`Successfully hydrated metadata for ${count} games.`);
}

console.log("Starting metadata hydration...");
processGames();
