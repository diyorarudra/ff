const fs = require('fs');
const path = require('path');
const vm = require('vm');

const targetDir = path.join(__dirname, 'games');
let errors = [];

for (let i = 51; i <= 100; i++) {
    const fileLoc = path.join(targetDir, 'game'+i, 'index.html');
    if (!fs.existsSync(fileLoc)) {
        errors.push("Game " + i + ": index.html missing");
        continue;
    }

    const text = fs.readFileSync(fileLoc, 'utf8');

    // 1. Check canvas ID
    const expectedId = "gameCanvas_" + i;
    if (!text.includes('id="' + expectedId + '"') && !text.includes("id='" + expectedId + "'")) {
        errors.push("Game " + i + ": Missing " + expectedId + " in HTML layout.");
    }

    // 2. Check script targeting
    if (!text.includes("getElementById('" + expectedId + "')") && !text.includes('getElementById("' + expectedId + '")')) {
        errors.push("Game " + i + ": Script does not target " + expectedId + ".");
    }

    // 3. Syntax check the inner script
    const scriptMarker = '<script>';
    const closingMarker = '</script>';
    let scriptStart = text.lastIndexOf(scriptMarker);
    let scriptEnd = text.lastIndexOf(closingMarker);

    if (scriptStart === -1 || scriptEnd === -1 || scriptEnd <= scriptStart) {
        errors.push("Game " + i + ": Missing or broken script tags.");
    } else {
        const code = text.substring(scriptStart + scriptMarker.length, scriptEnd);
        try {
            new vm.Script(code);
        } catch (e) {
            errors.push("Game " + i + ": Syntax Error in JS: " + e.message);
        }
    }
}

if (errors.length > 0) {
    console.log('Errors found:');
    errors.forEach(e => console.log(e));
} else {
    console.log('All 50 games (51-100) passed layout binding and JS syntax validation! Zero errors found.');
}
