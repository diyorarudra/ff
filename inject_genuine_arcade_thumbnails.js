const fs = require('fs');
const path = require('path');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');

const dir = path.join(__dirname, 'assets', 'thumbnails');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const mainJsPath = path.join(__dirname, 'js', 'main.js');
let games = [];
try {
    const content = fs.readFileSync(mainJsPath, 'utf8');
    const match = content.match(/const GAMES = \[([\s\S]*?)\];/);
    if (match) games = eval(`([${match[1]}])`);
} catch (e) {
    console.error('Failed to parse games.');
}

const totalGames = 120;
if (games.length < totalGames) {
    for (let i = games.length + 1; i <= totalGames; i++) {
        games.push({ id: i, title: `Game ${i}`, icon: '🎮', color: '#38bdf8' });
    }
}

function getTwemojiUrl(emoji) {
    let codePoint = Array.from(emoji).map(c => c.codePointAt(0).toString(16)).join('-');
    codePoint = codePoint.replace(/-fe0f/g, ''); // Twemoji strips variation selectors
    return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoint}.png`;
}

function downloadImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

async function generateAll() {
    console.log('Starting generation...');
    for (let i = 0; i < totalGames; i++) {
        const game = games[i];
        const canvas = createCanvas(400, 250);
        const ctx = canvas.getContext('2d');
        
        // 1. Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 250);

        // 2. Draw soft pastel tint based on game color
        ctx.fillStyle = game.color || '#38bdf8';
        ctx.globalAlpha = 0.12;
        ctx.fillRect(0, 0, 400, 250);
        ctx.globalAlpha = 1.0;

        // 3. Draw a subtle radial glow in the center for depth
        const gradient = ctx.createRadialGradient(200, 125, 20, 200, 125, 220);
        gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 250);

        try {
            const url = getTwemojiUrl(game.icon || '🎮');
            const imgBuffer = await downloadImage(url);
            const img = await loadImage(imgBuffer);
            
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 12;
            ctx.drawImage(img, 130, 55, 140, 140);
        } catch (e) {
            // Fallback: draw a colored circle with first letter
            ctx.fillStyle = game.color || '#38bdf8';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
            ctx.beginPath();
            ctx.arc(200, 125, 65, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 70px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(game.title.charAt(0).toUpperCase(), 200, 125);
        }

        const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
        fs.writeFileSync(path.join(dir, `game${game.id}.jpg`), buffer);
    }
    
    // Default
    const canvas = createCanvas(400, 250);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0fdfa';
    ctx.fillRect(0, 0, 400, 250);
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ffliveplay', 200, 125);
    fs.writeFileSync(path.join(dir, 'default-arcade.jpg'), canvas.toBuffer('image/jpeg'));
    console.log('Thumbnail injection pipeline completed.');
}

generateAll();
