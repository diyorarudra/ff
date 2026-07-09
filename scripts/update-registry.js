const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '../js/main.js');
let content = fs.readFileSync(mainJsPath, 'utf8');

// 1. Expand CATEGORIES
const newCategories = `const CATEGORIES = [
  { id: 'all',     label: 'All Games',       icon: '🎮' },
  { id: 'brain',   label: 'Brain Games',     icon: '🧠' },
  { id: 'puzzle',  label: 'Puzzle Games',    icon: '🧩' },
  { id: 'word',    label: 'Word Games',      icon: '🔤' },
  { id: 'quiz',    label: 'Quiz & Trivia',   icon: '💡' },
  { id: 'racing',  label: 'Racing Games',    icon: '🏎️' },
  { id: 'sports',  label: 'Sports Games',    icon: '🏀' },
  { id: 'cricket', label: 'Cricket Games',   icon: '🏏' },
  { id: 'arcade',  label: 'Classic Arcade',  icon: '👾' },
  { id: 'skill',   label: 'Skill Games',     icon: '🎯' },
  { id: 'kids',    label: 'Kids Games',      icon: '🎈' },
  { id: 'action',  label: 'Action Games',    icon: '🚀' },
  { id: 'strategy',label: 'Strategy Games',  icon: '♟️' },
  { id: 'idle',    label: 'Idle Games',      icon: '⏳' },
  { id: 'merge',   label: 'Merge Games',     icon: '➕' },
  { id: 'memory',  label: 'Memory Games',    icon: '🃏' },
  { id: 'hidden',  label: 'Hidden Object',   icon: '🔍' },
  { id: 'card',    label: 'Card Games',      icon: '♠️' },
  { id: 'board',   label: 'Board Games',     icon: '🎲' },
  { id: 'adventure',label: 'Adventure',      icon: '🗺️' },
  { id: 'mystery', label: 'Mystery',         icon: '🕵️' },
  { id: 'rhythm',  label: 'Rhythm & Cinema', icon: '🎵' },
  { id: 'casual',  label: 'Casual & Reflex', icon: '⚡' },
];`;

content = content.replace(/const CATEGORIES = \[[\s\S]*?\];/, newCategories);

// 2. Expand GAMES array safely
// We will extract the GAMES array using eval, map over it, and write it back.
const gamesMatch = content.match(/const GAMES = (\[[\s\S]*?\]);\s*const CATEGORIES/);
if (gamesMatch) {
    let GAMES = eval(gamesMatch[1]);
    
    GAMES = GAMES.map(game => {
        return {
            ...game,
            tags: [game.category, 'html5', 'free'],
            difficulty: 'easy',
            estimatedPlayTime: 3,
            rewardCoins: 10,
            isExistingGame: true,
            isNewAddedGame: false,
            isTrending: Math.random() > 0.8, // roughly 20% are trending
            isNew: false,
            playCount: Math.floor(Math.random() * 1000) + 100,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5 to 5.0
            instructions: 'Tap or click to play. Follow the on-screen prompts.',
            seoTitle: `${game.title} - Play Free Online Game | FF Live Play`,
            seoDescription: `Play ${game.title} online for free instantly on FF Live Play. Experience high-performance, no-download ${game.title} browser gameplay directly in your viewport.`
        };
    });

    // Format back to a string
    const gamesString = '[\n' + GAMES.map(g => {
        return `  { id: ${g.id}, title: '${g.title.replace(/'/g, "\\'")}', category: '${g.category}', desc: '${g.desc.replace(/'/g, "\\'")}', icon: '${g.icon}', color: '${g.color}', slug: '${g.slug}', tags: ${JSON.stringify(g.tags)}, difficulty: '${g.difficulty}', estimatedPlayTime: ${g.estimatedPlayTime}, rewardCoins: ${g.rewardCoins}, isExistingGame: ${g.isExistingGame}, isNewAddedGame: ${g.isNewAddedGame}, isTrending: ${g.isTrending}, isNew: ${g.isNew}, playCount: ${g.playCount}, rating: ${g.rating}, instructions: '${g.instructions.replace(/'/g, "\\'")}', seoTitle: '${g.seoTitle.replace(/'/g, "\\'")}', seoDescription: '${g.seoDescription.replace(/'/g, "\\'")}' }`;
    }).join(',\n') + '\n]';

    content = content.replace(/const GAMES = \[[\s\S]*?\];/, `const GAMES = ${gamesString};`);
}

fs.writeFileSync(mainJsPath, content, 'utf8');
console.log('Game Registry Metadata successfully overhauled.');
