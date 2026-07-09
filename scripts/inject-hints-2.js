const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, '..', 'games');

const targetGames = [
  'word-connect', 'crossword-mini', 'escape-room-mini', 'hidden-object-rooms', 'find-the-difference'
];

const wrapperStart = `document.getElementById('btn-hint').addEventListener('click', () => {
    if (window.FFRewards) {
        if (typeof hints !== 'undefined' && hints > 0) {
            // let normal logic run
        } else {
            window.FFRewards.showSpendConfirm({
                title: "Use Hint?",
                message: "Use 20 coins for a hint?",
                cost: 20,
                itemId: "hint_pack",
                onConfirm: (success) => {
                    if (success) {
                        if (typeof hints !== 'undefined') hints++; 
                        ffOriginalHintLogic();
                    }
                }
            });
            return;
        }
    }
    ffOriginalHintLogic();
});

function ffOriginalHintLogic() {
`;

function patchFileListener(slug) {
    let jsPath = path.join(gamesDir, slug, 'script.js');
    if (!fs.existsSync(jsPath)) return;
    
    let code = fs.readFileSync(jsPath, 'utf8');
    if (code.includes('FFRewards.showSpendConfirm')) return;

    let regex = /document\.getElementById\('btn-hint'\)\.addEventListener\('click',\s*\(\)\s*=>\s*\{/g;
    let match = regex.exec(code);
    if (match) {
        // Need to replace everything from match.index up to the matching closing brace.
        // But since this is hard with regex, we just replace the start and then we must append a `}` manually to close `ffOriginalHintLogic`.
        
        // Actually, replacing just the top is easy:
        let prefix = code.substring(0, match.index);
        let postfix = code.substring(match.index + match[0].length);
        
        // Find the matching brace for postfix
        let braceCount = 1;
        let i = 0;
        for (; i < postfix.length; i++) {
            if (postfix[i] === '{') braceCount++;
            if (postfix[i] === '}') braceCount--;
            if (braceCount === 0) break;
        }
        
        let functionBody = postfix.substring(0, i);
        let remainder = postfix.substring(i + 1);
        
        // Ensure trailing '});' is handled correctly. Often it's `});`
        if (remainder.trim().startsWith(');')) {
            remainder = remainder.replace(/^\s*\);/, '');
        }

        let newCode = prefix + wrapperStart + functionBody + "\n}\n" + remainder;
        fs.writeFileSync(jsPath, newCode, 'utf8');
        console.log(`Patched hint listener for: ${slug}`);
    } else {
        console.log(`Could not find hint listener for: ${slug}`);
    }
}

targetGames.forEach(patchFileListener);
