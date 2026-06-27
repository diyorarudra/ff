const fs = require('fs');
const html = fs.readFileSync('games/game9/index.html', 'utf8');
const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/g);
const codeHead = scriptMatches[0].replace(/<\/?script>/g, '');
const codeBody = scriptMatches[2].replace(/<\/?script>/g, '');

const js = `
    const window = {
        addEventListener: () => {},
        removeEventListener: () => {},
    };
    const document = {
        getElementById: (id) => {
            if (id === 'gameCanvas_9') return {
                getContext: () => ({
                    fillRect: () => {},
                    beginPath: () => {},
                    moveTo: () => {},
                    lineTo: () => {},
                    closePath: () => {},
                    stroke: () => {},
                    arc: () => {},
                    fill: () => {}
                }),
                width: 800,
                height: 600,
                addEventListener: () => {}
            };
            return {
                textContent: '',
                innerHTML: '',
                style: {},
                addEventListener: () => {}
            };
        },
        addEventListener: () => {}
    };
    let requestAnimationFrame = () => {};
    let cancelAnimationFrame = () => {};
    let Date = global.Date;
    let Math = global.Math;

    ${codeHead}
    ${codeBody}
    
    // Simulate game frames
    init();
    startGame(); // transition to playing
    keys.space = true;
    keys.up = true;
    keys.left = true;
    for(let i=0; i<100; i++) {
        update();
    }
    console.log("Bullets count:", bullets.length);
    console.log("Asteroids count:", asteroids.length);
    console.log("Ship cooldown:", ship.shootCooldown);
    console.log("Score:", score);
    console.log("Lives:", lives);
`;

try {
    eval(js);
    console.log("SIMULATION SUCCESSFUL");
} catch(e) {
    console.error("SIMULATION ERROR:", e);
}
