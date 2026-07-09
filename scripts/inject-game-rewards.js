const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, '..', 'games');
const REPORT_FILE = path.join(__dirname, '..', 'REWARD_OVERLAY_REPORT.md');

const CSS_TAG = '<link rel="stylesheet" href="/css/game-rewards.css">';
const JS_TAG = '<script defer src="/js/game-rewards.js"></script>';

let totalGames = 0;
let modifiedGames = 0;
let skippedGames = 0;
let errors = 0;

let reportContent = `# Reward Overlay Injection Report\n\nGenerated at: ${new Date().toISOString()}\n\n`;

try {
    const folders = fs.readdirSync(GAMES_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const folder of folders) {
        const indexPath = path.join(GAMES_DIR, folder, 'index.html');
        if (!fs.existsSync(indexPath)) continue;

        totalGames++;
        try {
            let html = fs.readFileSync(indexPath, 'utf8');
            let isModified = false;

            // Inject CSS
            if (!html.includes('/css/game-rewards.css')) {
                // Try to inject before </head>
                if (html.includes('</head>')) {
                    html = html.replace('</head>', `  ${CSS_TAG}\n</head>`);
                } else {
                    // Inject at top if no <head>
                    html = `${CSS_TAG}\n` + html;
                }
                isModified = true;
            }

            // Inject JS
            if (!html.includes('/js/game-rewards.js')) {
                // Try to inject before </body>
                if (html.includes('</body>')) {
                    html = html.replace('</body>', `\n  ${JS_TAG}\n</body>`);
                } else if (html.includes('</html>')) {
                    html = html.replace('</html>', `\n  ${JS_TAG}\n</html>`);
                } else {
                    // Inject at bottom
                    html = html + `\n${JS_TAG}\n`;
                }
                isModified = true;
            }

            if (isModified) {
                fs.writeFileSync(indexPath, html, 'utf8');
                modifiedGames++;
                reportContent += `- [MODIFIED] ${folder}\n`;
            } else {
                skippedGames++;
                reportContent += `- [SKIPPED] ${folder} (Already present)\n`;
            }

        } catch (e) {
            errors++;
            reportContent += `- [ERROR] ${folder}: ${e.message}\n`;
        }
    }

    reportContent = `## Summary\n\n- Total Game Folders: ${totalGames}\n- Modified: ${modifiedGames}\n- Skipped: ${skippedGames}\n- Errors: ${errors}\n\n---\n\n` + reportContent;
    fs.writeFileSync(REPORT_FILE, reportContent, 'utf8');
    
    console.log(`Injection Complete.`);
    console.log(`Modified: ${modifiedGames}, Skipped: ${skippedGames}, Errors: ${errors}`);
    console.log(`Report generated at: REWARD_OVERLAY_REPORT.md`);

} catch(e) {
    console.error("Critical error:", e.message);
}
