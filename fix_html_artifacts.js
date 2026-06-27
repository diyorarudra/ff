const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

const titles = {
  51: "Flappy Paper Plane", 52: "Draw Pixels", 53: "Side by Side", 54: "Space Battleship", 55: "Swipe Basketball", 56: "Millionaire Quiz", 57: "Snake & Ladders", 58: "Ludo", 59: "Cube Move", 60: "Play Chess",
  61: "Faster or Slower", 62: "Quiz Game 2", 63: "Connect the Dots", 64: "Spider Solitaire", 65: "Four Colors", 66: "Virtual Drum", 67: "Virtual Piano", 68: "Guess the Song", 69: "Car Rush", 70: "Space Flash",
  71: "Fruit Merge", 72: "Fill the Water", 73: "Chibi Hero", 74: "Jo Jo Run", 75: "Tappy Dumont", 76: "Hit Villains", 77: "Weapon Strike", 78: "Thief Challenge", 79: "Quiz Games", 80: "True or False",
  81: "Solve Math Ex", 82: "Draggable Puzzle", 83: "Guess Number", 84: "Hacker Challenge", 85: "3D Car Run", 86: "Subway Run 5", 87: "City Builder", 88: "Classic Bowling", 89: "Balloons Shooter", 90: "Cannon Balls",
  91: "Memory Card Match", 92: "Neon Brick Breaker", 93: "Bubble Pop Classic", 94: "Froggy Jump", 95: "Tower Stack Arena", 96: "Retro Tic-Tac-Toe", 97: "Maze Escape", 98: "Color Tap Runner", 99: "Word Scramble Suite", 100: "Space Asteroids Culler"
};

function getEngineType(title) {
    const t = title.toLowerCase();
    if (t.includes('run') || t.includes('hero') || t.includes('car') || t.includes('escape') || t.includes('rush')) {
        return 'runner';
    }
    if (t.includes('shoot') || t.includes('space') || t.includes('strike') || t.includes('cannon') || t.includes('villain')) {
        return 'shooter';
    }
    if (t.includes('quiz') || t.includes('math') || t.includes('word') || t.includes('true') || t.includes('guess')) {
        return 'quiz';
    }
    if (t.includes('puzzle') || t.includes('chess') || t.includes('card') || t.includes('match') || t.includes('tic')) {
        return 'puzzle';
    }
    return 'clicker';
}

function getInstruction(type) {
    switch (type) {
        case 'runner': return "Use Space or tap to jump and avoid obstacles.";
        case 'shooter': return "Use Left/Right arrows to move, Space to shoot.";
        case 'quiz': return "Click or tap the correct option to answer.";
        case 'puzzle': return "Click or tap to interact with the board.";
        case 'clicker': return "Click or tap the targets before they disappear.";
        default: return "Play the game by interacting with the canvas.";
    }
}

let fixedCount = 0;
for (let i = 51; i <= 100; i++) {
    const fileLoc = path.join(targetDir, 'game'+i, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');

        // Fix the stray 'n'
        text = text.replace(/<\/div>n\s*<div class="w-full flex justify-center mb-6 mt-4">/, '</div>\\n    <div class="w-full flex justify-center mb-6 mt-4">');

        // Fix the instruction text
        const type = getEngineType(titles[i] || ('Game ' + i));
        const newInstr = getInstruction(type);
        
        // Find the paragraph
        const pStart = text.lastIndexOf('<p class="text-center text-gray-300 mt-2 font-medium text-lg px-4">');
        if (pStart !== -1) {
            const pEnd = text.indexOf('</p>', pStart);
            if (pEnd !== -1) {
                const newP = '<p class="text-center text-gray-300 mt-2 font-medium text-lg px-4">\\n      ' + newInstr + '\\n    </p>';
                text = text.substring(0, pStart) + newP + text.substring(pEnd + 4);
            }
        }

        fs.writeFileSync(fileLoc, text, 'utf8');
        fixedCount++;
    }
}
console.log('[Antigravity]: Successfully fixed layout artifacts and synchronized instructional text for ' + fixedCount + ' games.');
