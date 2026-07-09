const fs = require('fs');
const path = require('path');
const gamesDir = path.join(__dirname, '..', 'games');

const quizGames = ['cricket-quiz-league', 'bollywood-quiz-battle', 'gk-quiz-india'];

quizGames.forEach(slug => {
    let jsPath = path.join(gamesDir, slug, 'script.js');
    if (!fs.existsSync(jsPath)) return;
    
    let code = fs.readFileSync(jsPath, 'utf8');
    if (code.includes('FFRewards.showSpendConfirm')) return;

    code = code.replace(/function endMatch\(completed\)\s*\{/, `function ffOriginalEndMatch(completed) {`);
    
    let wrapper = `
let hasRevived = false;
function endMatch(completed) {
    if (!completed && window.FFRewards && !hasRevived) {
        window.FFRewards.showSpendConfirm({
            title: "Revive?",
            message: "Use 30 coins or a Revive Token to continue?",
            cost: 30,
            itemId: "revive_token",
            onConfirm: (success) => {
                if (success) {
                    hasRevived = true;
                    lives = 3;
                    updateUI();
                    loadQuestion();
                } else {
                    ffOriginalEndMatch(completed);
                }
            }
        });
        setTimeout(() => {
            document.getElementById('ff-confirm-btn-cancel').onclick = () => {
                document.getElementById('ff-confirm-modal').classList.add('hidden');
                ffOriginalEndMatch(completed);
            };
        }, 100);
        return;
    }
    ffOriginalEndMatch(completed);
}
`;
    
    code += "\n" + wrapper;
    code = code.replace(/function initGame\(\)\s*\{/, "function initGame() {\n    hasRevived = false;");
    
    fs.writeFileSync(jsPath, code, 'utf8');
    console.log(`Patched revive for: ${slug}`);
});
