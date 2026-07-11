const fs = require('fs');
const path = require('path');
const { SITE_ORIGIN } = require('./site-config');

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

                // Derive from slug so variant pages such as gravity-flip-107 stay unique.
                let gameName = toTitleCase(slug);

                // 1. Dynamic Page Titles
                content = content.replace(/<title>.*?<\/title>/gi, `<title>${gameName} - Play Free Online Game | FF Live Play</title>`);
                content = content.replace(/<meta\s+property=["']og:title["'].*?>/gi, `<meta property="og:title" content="${gameName} - Play Free Online Game | FF Live Play">`);
                content = content.replace(/<meta\s+name=["']twitter:title["'].*?>/gi, `<meta name="twitter:title" content="${gameName} - Play Free Online Game | FF Live Play">`);

                // 2. Granular Meta Descriptions
                const descText = `Play ${gameName} online for free instantly on FF Live Play. Experience high-performance, no-download ${gameName} browser gameplay directly in your viewport.`;
                content = content.replace(/<meta\s+name=["']description["'].*?>/gi, `<meta name="description" content="${descText}">`);
                content = content.replace(/<meta\s+property=["']og:description["'].*?>/gi, `<meta property="og:description" content="${descText}">`);
                content = content.replace(/<meta\s+name=["']twitter:description["'].*?>/gi, `<meta name="twitter:description" content="${descText}">`);

                // 3. Isolated Absolute Canonicals
                if (/<link\s+rel=["']canonical["'].*?>/i.test(content)) {
                    content = content.replace(/<link\s+rel=["']canonical["'].*?>/gi, `<link rel="canonical" href="${SITE_ORIGIN}/games/${slug}">`);
                } else {
                    // Inject if missing
                    content = content.replace(/<head>/i, `<head>\n  <link rel="canonical" href="${SITE_ORIGIN}/games/${slug}">`);
                }

                // 4. Targeted Card Rich Previews
                const imageUrl = `${SITE_ORIGIN}/assets/thumbnails/${slug}.png`;
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
