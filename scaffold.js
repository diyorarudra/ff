const fs = require('fs');
const path = require('path');

const newGames = [
  "Flappy Paper Plane", "Draw Pixels", "Side by Side", "Space Battleship", "Swipe Basketball",
  "Millionaire Quiz", "Snake & Ladders", "Ludo", "Cube Move", "Play Chess",
  "Faster or Slower", "Quiz Game 2", "Connect the Dots", "Spider Solitaire", "Four Colors",
  "Virtual Drum", "Virtual Piano", "Guess the Song", "Car Rush", "Space Flash",
  "Fruit Merge", "Fill the Water", "Chibi Hero", "Jo Jo Run", "Tappy Dumont",
  "Hit Villains", "Weapon Strike", "Thief Challenge", "Quiz Games", "True or False",
  "Solve Math Ex", "Draggable Puzzle", "Guess Number", "Hacker Challenge", "3D Car Run",
  "Subway Run 5", "City Builder", "Classic Bowling", "Balloons Shooter", "Cannon Balls",
  "Memory Card Match", "Neon Brick Breaker", "Bubble Pop Classic", "Froggy Jump", "Tower Stack Arena",
  "Retro Tic-Tac-Toe", "Maze Escape", "Color Tap Runner", "Word Scramble Suite", "Space Asteroids Culler"
];

const templateFile = path.join(__dirname, 'games', 'game1.html');
let template = fs.readFileSync(templateFile, 'utf8');

// The template has "<title>2048 &mdash; GamiDay</title>" and other specific things we need to replace.
// We will replace "2048" with the new game title.
// We'll also inject the AdSense verification block below the canvas.
// The canvas is `<div class="game-container...><canvas id="gameCanvas"...></canvas>`

// AdSense Block generator
function getAdSenseBlock(title) {
    return `
    <div class="adsense-seo-block mt-8 p-6 bg-nexus-card border border-white/10 rounded-xl">
      <h2 class="text-2xl font-heading font-bold text-white mb-4">How to Play ${title}</h2>
      <p class="text-gray-400 text-sm leading-relaxed mb-4">
        Welcome to ${title}, one of our premium HTML5 arcade modules designed for instant, zero-download entertainment! This game leverages responsive browser mechanics to provide a smooth, engaging experience on both desktop and mobile platforms. 
        Your primary objective is to master the dynamic control scheme—whether you're tapping, swiping, or using keyboard arrows—to navigate the challenges ahead. We have optimized the rendering pipeline so that ${title} runs flawlessly at a locked 60 FPS, ensuring minimal input latency and maximum precision.
      </p>
      <p class="text-gray-400 text-sm leading-relaxed">
        As you progress, the difficulty naturally scales. We recommend starting slowly, focusing on pattern recognition, and timing your interactions carefully. Built entirely using vanilla JavaScript and the Canvas API, ${title} requires no third-party plugins. Remember, if you get stuck, take a quick break and reset your strategy. Enjoy the ultimate browser gaming experience right here!
      </p>
    </div>`;
}

for (let i = 0; i < 50; i++) {
    const gameId = i + 51;
    const title = newGames[i];
    
    // Replace title and metadata
    let content = template.replace(/<title>.*?<\/title>/, `<title>${title} &mdash; GamiDay</title>`);
    content = content.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="Play ${title} instantly in your browser. Free HTML5 game on GamiDay.">`);
    content = content.replace(/<h1 class="text-3xl font-heading font-bold text-white tracking-tight">.*?<\/h1>/, `<h1 class="text-3xl font-heading font-bold text-white tracking-tight">${title}</h1>`);
    content = content.replace(/"name": ".*?"/, `"name": "${title}"`);
    content = content.replace(/"description": ".*?"/, `"description": "Play ${title} online for free."`);
    
    // Inject AdSense block below canvas div
    // We'll find the closing tag of the game-container div. Since that's hard with regex, we can just inject it right before the ad-slot div.
    const adSlotString = '<div class="max-w-[820px] mx-auto w-full px-4 mb-8 mt-auto">';
    content = content.replace(adSlotString, getAdSenseBlock(title) + '\n\n  ' + adSlotString);
    
    // Ensure UTF-8 is first in head (it already is in the template, but let's enforce it)
    content = content.replace(/<head>[\s\S]*?<meta charset="UTF-8">/, '<head>\n  <meta charset="UTF-8">');

    const newFilePath = path.join(__dirname, 'games', `game${gameId}.html`);
    fs.writeFileSync(newFilePath, content, 'utf8');
}

console.log('Successfully generated 50 new game files with SEO blocks and UTF-8 enforcement.');
