const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('games/game10/index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

setTimeout(() => {
    try {
        console.log("Game State:", dom.window.gameState);
        dom.window.startGame();
        console.log("Started. Game State:", dom.window.gameState);
        dom.window.update();
        console.log("Update OK.");
        dom.window.draw();
        console.log("Draw OK.");
        console.log("Aliens active:", dom.window.aliens.filter(a => a.active).length);
        console.log("SUCCESS!");
    } catch(e) {
        console.error("ERROR:", e);
    }
}, 500);
