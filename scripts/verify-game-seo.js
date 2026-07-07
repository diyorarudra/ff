const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, '../games');

function verifyGames() {
    console.log("Starting Metadata Sanity Check...\n");
    const games = fs.readdirSync(gamesDir);
    let totalChecked = 0;
    let errorsFound = 0;

    games.forEach(slug => {
        const gamePath = path.join(gamesDir, slug);
        if (fs.statSync(gamePath).isDirectory()) {
            const indexPath = path.join(gamePath, 'index.html');
            if (fs.existsSync(indexPath)) {
                totalChecked++;
                let content = fs.readFileSync(indexPath, 'utf8');
                let errors = [];

                // 1. Check for duplicates
                const matchCount = (regex) => (content.match(regex) || []).length;

                if (matchCount(/<link\s+rel=["']canonical["']/gi) > 1) errors.push("Duplicate canonical tag");
                if (matchCount(/<meta\s+property=["']og:title["']/gi) > 1) errors.push("Duplicate og:title tag");
                if (matchCount(/<meta\s+property=["']og:description["']/gi) > 1) errors.push("Duplicate og:description tag");
                if (matchCount(/<meta\s+property=["']og:image["']/gi) > 1) errors.push("Duplicate og:image tag");
                if (matchCount(/<meta\s+name=["']twitter:image["']/gi) > 1) errors.push("Duplicate twitter:image tag");
                
                // Icon duplicates check (should be exactly 1 of each injected)
                if (matchCount(/<link\s+rel=["']icon["']/gi) > 1) errors.push("Duplicate icon tag");
                if (matchCount(/<link\s+rel=["']shortcut icon["']/gi) > 1) errors.push("Duplicate shortcut icon tag");
                if (matchCount(/<link\s+rel=["']apple-touch-icon["']/gi) > 1) errors.push("Duplicate apple-touch-icon tag");

                // 2. Structural Alignment
                const expectedCanonical = `https://www.ffliveplay.com/games/${slug}/`;
                const canonicalRegex = new RegExp(`<link\\s+rel=["']canonical["']\\s+href=["']${expectedCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
                if (!canonicalRegex.test(content)) {
                    errors.push(`Missing or incorrect canonical tag (Expected: ${expectedCanonical})`);
                }

                // 3. Asset Match Check
                const expectedImage = `https://www.ffliveplay.com/assets/thumbnails/${slug}.png`;
                const ogImageRegex = new RegExp(`<meta\\s+property=["']og:image["']\\s+content=["']${expectedImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
                if (!ogImageRegex.test(content)) {
                    errors.push(`Missing or incorrect og:image tag (Expected: ${expectedImage})`);
                }

                if (errors.length > 0) {
                    console.error(`[FAIL] ${slug}`);
                    errors.forEach(err => console.error(`   - ${err}`));
                    errorsFound++;
                }
            }
        }
    });

    console.log("\n==============================");
    console.log("  VERIFICATION REPORT  ");
    console.log("==============================");
    console.log(`Total Games Checked: ${totalChecked}`);
    console.log(`Failed Validations:  ${errorsFound}`);
    
    if (errorsFound > 0) {
        console.error("\nSanity Check FAILED. Please review the errors above.");
        process.exit(1);
    } else {
        console.log("\nSanity Check PASSED. All metadata is perfectly aligned and 100% compliant.");
    }
}

verifyGames();
