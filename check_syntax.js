const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, 'games');

let brokenGames = [];

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, `game${i}`, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let content = fs.readFileSync(fileLoc, 'utf8');
        const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/g);
        if (scriptMatch) {
            // Find the main game script (usually the last or largest one, here we test all)
            scriptMatch.forEach(scriptTag => {
                let code = scriptTag.replace(/<script>|<\/script>/g, '');
                // The progressive difficulty script has 'let baseSpeedMultiplier'
                if (code.includes('tailwind.config')) return; // ignore tailwind
                try {
                    new Function(code);
                } catch (e) {
                    brokenGames.push({game: i, error: e.message});
                }
            });
        }
    }
}

if (brokenGames.length > 0) {
    console.log("Broken games found:");
    brokenGames.forEach(b => console.log(`Game ${b.game}: ${b.error}`));
} else {
    console.log("All games parsed successfully.");
}
