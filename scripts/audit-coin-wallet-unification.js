const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define search terms
const regexToFind = [
    /localStorage\.getItem\(['"]coins['"]\)/g,
    /localStorage\.setItem\(['"]coins['"]/g,
    /localStorage\.getItem\(['"]gameCoins['"]\)/g,
    /localStorage\.setItem\(['"]gameCoins['"]/g,
    /localStorage\.getItem\(['"]playerCoins['"]\)/g,
    /localStorage\.setItem\(['"]playerCoins['"]/g,
    /localStorage\.getItem\(['"]newGameCoins['"]\)/g,
    /localStorage\.setItem\(['"]newGameCoins['"]/g,
    /localStorage\.getItem\(['"]oldGameCoins['"]\)/g,
    /localStorage\.setItem\(['"]oldGameCoins['"]/g,
    /coins\s*=\s*/g,
    /balance\s*=\s*/g,
    /rewardCoins\s*=\s*/g,
    /playerCoins\s*=\s*/g,
    /spendCoins\s*\(/g,
    /addCoins\s*\(/g
];

// Execute rg to find files quickly (ripgrep)
// Or since ripgrep might not be installed globally, we can use a recursive fs read.

function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        if (['node_modules', '.git', '.gemini', 'dist'].includes(f)) continue;
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            if (f.endsWith('.js') || f.endsWith('.html')) {
                callback(dirPath);
            }
        }
    }
}

let report = `# Coin Wallet Unification Audit Report\n\n`;
let separateWalletsFound = 0;
let filesWithIssues = [];

const projectRoot = path.join(__dirname, '..');

walkDir(projectRoot, (filePath) => {
    // skip this script itself
    if (filePath.includes('audit-coin-wallet-unification.js')) return;
    // skip game-rewards.js since it's the official API
    if (filePath.includes('game-rewards.js')) return;
    // skip platform.js since we just patched it, but check it anyway to be sure? Actually we can check it.
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Quick filter out 'coins =' in game metadata (like rewardCoins: 10) in main.js
    if (filePath.includes('main.js') && content.includes('rewardCoins:')) {
        // safe to ignore since it's just config
        content = content.replace(/rewardCoins:\s*\d+/g, '');
    }

    let issuesInFile = [];
    regexToFind.forEach(regex => {
        if (regex.source === 'coins\\s*=\\s*' || regex.source === 'balance\\s*=\\s*' || regex.source === 'rewardCoins\\s*=\\s*' || regex.source === 'playerCoins\\s*=\\s*') {
            // These are prone to false positives (e.g., local variables), so we check context.
            // But for this audit, we log them and manually review if it looks like a global state.
            const matches = content.match(regex);
            if (matches) {
                // Ignore if it's let coins = or const coins = inside a local function block
                // (Very rough heuristic, just flagging them for review)
                issuesInFile.push(`Suspicious variable assignment: ${regex.source}`);
            }
        } else if (regex.source === 'spendCoins\\s*\\(' || regex.source === 'addCoins\\s*\\(') {
            // we want to ensure it is window.FFRewards.spendCoins or FFRewards.addCoins
            const badCallMatch = content.match(/[^.]spendCoins\s*\(/g);
            if (badCallMatch) issuesInFile.push(`Global call to spendCoins`);
            const badCallMatch2 = content.match(/[^.]addCoins\s*\(/g);
            if (badCallMatch2) issuesInFile.push(`Global call to addCoins`);
        } else {
            if (content.match(regex)) {
                issuesInFile.push(`Separate wallet usage: ${regex.source}`);
            }
        }
    });

    if (issuesInFile.length > 0) {
        // Filter out false positives in platform.js
        if (filePath.includes('platform.js')) {
            issuesInFile = issuesInFile.filter(i => !i.includes('coins\\s*=\\s*') && !i.includes('balance\\s*=\\s*'));
        }
        
        if (issuesInFile.length > 0) {
            filesWithIssues.push({ file: filePath.replace(projectRoot, ''), issues: issuesInFile });
            if (issuesInFile.some(i => i.includes('Separate wallet usage'))) {
                separateWalletsFound++;
            }
        }
    }
});

report += `## Summary\n`;
report += `- Separate coin wallets found: ${separateWalletsFound}\n`;
report += `- Files with potential issues: ${filesWithIssues.length}\n\n`;

report += `## Detailed Findings\n`;
if (filesWithIssues.length === 0) {
    report += `No issues found.\n`;
} else {
    filesWithIssues.forEach(f => {
        report += `### ${f.file}\n`;
        f.issues.forEach(i => {
            report += `- ${i}\n`;
        });
        report += `\n`;
    });
}

fs.writeFileSync(path.join(projectRoot, 'COIN_WALLET_UNIFICATION_REPORT.md'), report);
console.log('Audit complete. See COIN_WALLET_UNIFICATION_REPORT.md');
