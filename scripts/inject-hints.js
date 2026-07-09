const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, '..', 'games');

const targetGames = [
  'daily-word-puzzle', 'word-connect', 'hindi-word-master', 'english-word-challenge',
  'crossword-mini', 'color-sort-puzzle', 'water-sort-puzzle', 'ball-sort-puzzle',
  'escape-room-mini', 'hidden-object-rooms', 'find-the-difference'
];

function patchFile(slug) {
    let jsPath = path.join(gamesDir, slug, 'script.js');
    if (!fs.existsSync(jsPath)) return;
    
    let code = fs.readFileSync(jsPath, 'utf8');
    if (code.includes('FFRewards.showSpendConfirm')) {
        console.log(`Already patched hints: ${slug}`);
        return;
    }

    // Heuristics for hint function. 
    // Most games use `function showHint()` or `function useHint()` or a button listener.
    // Let's rewrite the `hints` decrement logic if it exists, or inject at the start of `useHint` / `showHint`.
    
    const replacementStr = `
    // FF Rewards Hint Hook
    if (window.FFRewards) {
        if (typeof hints !== 'undefined' && hints > 0) {
            // Free hint available, let original logic handle it
        } else {
            // Use Coin API
            window.FFRewards.showSpendConfirm({
                title: "Use Hint?",
                message: "Use 20 coins for a hint?",
                cost: 20,
                itemId: "hint_pack",
                onConfirm: (success, method) => {
                    if (success) {
                        // Temporarily bypass hints > 0 check by adding 1
                        if (typeof hints !== 'undefined') hints++;
                        // Call the core hint logic again 
                        ffPerformCoreHint();
                    }
                }
            });
            return; // Halt original logic
        }
    }
    ffPerformCoreHint();
}

function ffPerformCoreHint() {
    `;

    // Try to find the hint function
    let matched = false;
    code = code.replace(/function\s+(useHint|showHint|getHint)\s*\(\)\s*\{/g, (match, funcName) => {
        matched = true;
        return `function ${funcName}() {${replacementStr}`;
    });

    // If it's a listener like document.getElementById('btn-hint').onclick = () => {
    if (!matched) {
        code = code.replace(/(getElementById\('btn-hint'\)\.addEventListener\('click',\s*\(\)\s*=>\s*\{|getElementById\('btn-hint'\)\.onclick\s*=\s*\(\)\s*=>\s*\{)/g, (match) => {
            matched = true;
            return `${match}\n${replacementStr}`;
        });
    }

    if (matched) {
        // Because we opened `ffPerformCoreHint() {`, we must find the end of the original function and add `}`
        // This is extremely risky via regex for nested brackets, so instead we just rename the original function.
    }
}

// Better strategy for targeted rewriting without parsing brackets:
// We will rename the original hint function to `ffOriginalHint` and create a new `useHint` wrapper.
function patchFileBetter(slug) {
    let jsPath = path.join(gamesDir, slug, 'script.js');
    if (!fs.existsSync(jsPath)) return;
    
    let code = fs.readFileSync(jsPath, 'utf8');
    if (code.includes('FFRewards.showSpendConfirm')) return;

    let funcName = null;
    if (code.match(/function useHint\(/)) funcName = 'useHint';
    else if (code.match(/function showHint\(/)) funcName = 'showHint';
    else if (code.match(/function getHint\(/)) funcName = 'getHint';

    if (funcName) {
        // Rename original to ffOriginalHint
        code = code.replace(new RegExp(`function ${funcName}\\(`, 'g'), `function ffOriginalHint(`);
        
        // Expose new wrapper
        const wrapper = `
function ${funcName}() {
    if (window.FFRewards) {
        if (typeof hints !== 'undefined' && hints > 0) {
            ffOriginalHint();
        } else {
            window.FFRewards.showSpendConfirm({
                title: "Use Hint?",
                message: "Use 20 coins for a hint?",
                cost: 20,
                itemId: "hint_pack",
                onConfirm: (success) => {
                    if (success) {
                        if (typeof hints !== 'undefined') hints++; 
                        ffOriginalHint();
                    }
                }
            });
        }
    } else {
        ffOriginalHint();
    }
}
        `;
        code += "\n" + wrapper;
        fs.writeFileSync(jsPath, code, 'utf8');
        console.log(`Patched hint for: ${slug}`);
    } else {
        console.log(`Could not find hint function for: ${slug}`);
    }
}

targetGames.forEach(patchFileBetter);
