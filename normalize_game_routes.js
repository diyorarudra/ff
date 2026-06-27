const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

let modifiedCount = 0;

for (let i = 1; i <= 100; i++) {
    const oldFilePath = path.join(targetDir, `game${i}.html`);
    const newDirPath = path.join(targetDir, `game${i}`);
    const newFilePath = path.join(newDirPath, 'index.html');

    if (fs.existsSync(oldFilePath)) {
        // Create the new folder if it doesn't exist
        if (!fs.existsSync(newDirPath)) {
            fs.mkdirSync(newDirPath, { recursive: true });
        }

        let content = fs.readFileSync(oldFilePath, 'utf8');

        // Update CSS and Index routes
        content = content.replace(/href="\.\.\/css\/style\.css"/g, 'href="../../css/style.css"');
        content = content.replace(/href="\.\.\/index\.html"/g, 'href="../../index.html"');

        // Dynamically bind canvas contexts
        content = content.replace(/<canvas id="gameCanvas"/g, `<canvas id="gameCanvas_${i}"`);
        content = content.replace(/getElementById\('gameCanvas'\)/g, `getElementById('gameCanvas_${i}')`);

        // Write to new path
        fs.writeFileSync(newFilePath, content, { encoding: 'utf8' });

        // Remove old file
        fs.unlinkSync(oldFilePath);

        modifiedCount++;
    } else if (fs.existsSync(newFilePath)) {
        // If it was already moved but we need to ensure the canvas binding and CSS links are correct
        let content = fs.readFileSync(newFilePath, 'utf8');
        let changed = false;

        if (content.includes('href="../css/style.css"')) {
            content = content.replace(/href="\.\.\/css\/style\.css"/g, 'href="../../css/style.css"');
            changed = true;
        }
        if (content.includes('href="../index.html"')) {
            content = content.replace(/href="\.\.\/index\.html"/g, 'href="../../index.html"');
            changed = true;
        }
        if (content.includes('<canvas id="gameCanvas"')) {
            content = content.replace(/<canvas id="gameCanvas"/g, `<canvas id="gameCanvas_${i}"`);
            changed = true;
        }
        if (content.includes("getElementById('gameCanvas')")) {
            content = content.replace(/getElementById\('gameCanvas'\)/g, `getElementById('gameCanvas_${i}')`);
            changed = true;
        }
        
        if (changed) {
            fs.writeFileSync(newFilePath, content, { encoding: 'utf8' });
            modifiedCount++;
        }
    }
}

console.log(`[Antigravity Execution]: Route normalization and context binding applied strictly across ${modifiedCount} directories.`);
