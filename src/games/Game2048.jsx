import React, { useState, useEffect, useRef } from 'react';

let nextTileId = 1;

export default function Game2048() {
  const [tiles, setTiles] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('game2048_best_react');
    if (saved) setBestScore(parseInt(saved, 10));
    initGame();
  }, []);

  const initGame = () => {
    let positions = [];
    for(let r = 0; r < 4; r++) {
      for(let c = 0; c < 4; c++) {
        positions.push({r, c});
      }
    }
    positions.sort(() => Math.random() - 0.5);
    
    // Initial state spawns exactly two '2' tiles as requested
    const t1 = { id: nextTileId++, val: 2, r: positions[0].r, c: positions[0].c, isNew: true };
    const t2 = { id: nextTileId++, val: 2, r: positions[1].r, c: positions[1].c, isNew: true };

    setTiles([t1, t2]);
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!gameOver) handleMove(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tiles, gameOver]);

  const touchStartRef = useRef(null);
  
  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current || gameOver) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) handleMove(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    } else {
      if (Math.abs(dy) > 30) handleMove(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    }
    touchStartRef.current = null;
  };

  const handleMove = (dir) => {
    let grid = Array(4).fill(null).map(() => Array(4).fill(null));
    let currentTiles = tiles.map(t => ({...t, merged: false, isNew: false, willDie: false}));
    
    currentTiles.forEach(t => { 
      if(!t.willDie) grid[t.r][t.c] = t; 
    });

    let moved = false;
    let points = 0;

    const moveVector = {
      'ArrowUp': { dr: -1, dc: 0 },
      'ArrowDown': { dr: 1, dc: 0 },
      'ArrowLeft': { dr: 0, dc: -1 },
      'ArrowRight': { dr: 0, dc: 1 }
    }[dir];

    let rTraverse = [0, 1, 2, 3];
    let cTraverse = [0, 1, 2, 3];
    if (moveVector.dr === 1) rTraverse.reverse();
    if (moveVector.dc === 1) cTraverse.reverse();

    rTraverse.forEach(r => {
      cTraverse.forEach(c => {
        let tile = grid[r][c];
        if (tile) {
          let tr = r;
          let tc = c;
          while (
            tr + moveVector.dr >= 0 && tr + moveVector.dr < 4 &&
            tc + moveVector.dc >= 0 && tc + moveVector.dc < 4 &&
            !grid[tr + moveVector.dr][tc + moveVector.dc]
          ) {
            tr += moveVector.dr;
            tc += moveVector.dc;
          }

          let nextTile = null;
          if (
            tr + moveVector.dr >= 0 && tr + moveVector.dr < 4 &&
            tc + moveVector.dc >= 0 && tc + moveVector.dc < 4
          ) {
            nextTile = grid[tr + moveVector.dr][tc + moveVector.dc];
          }

          if (nextTile && nextTile.val === tile.val && !nextTile.merged) {
            tr += moveVector.dr;
            tc += moveVector.dc;
            grid[r][c] = null;
            
            nextTile.willDie = true; 
            
            tile.r = tr;
            tile.c = tc;
            tile.val = tile.val * 2;
            tile.merged = true;
            
            grid[tr][tc] = tile;
            
            points += tile.val;
            moved = true;
          } else {
            if (tr !== r || tc !== c) {
              moved = true;
              grid[r][c] = null;
              grid[tr][tc] = tile;
              tile.r = tr;
              tile.c = tc;
            }
          }
        }
      });
    });

    if (moved) {
      let empty = [];
      for(let r = 0; r < 4; r++) {
        for(let c = 0; c < 4; c++) {
          if(!grid[r][c]) empty.push({r, c});
        }
      }
      
      if (empty.length > 0) {
        let {r, c} = empty[Math.floor(Math.random() * empty.length)];
        // Standard progression spawn (90% chance of 2, 10% chance of 4)
        let newTile = { id: nextTileId++, val: Math.random() < 0.9 ? 2 : 4, r, c, isNew: true };
        currentTiles.push(newTile);
        grid[r][c] = newTile;
      }
      
      setTiles(currentTiles);
      setScore(s => {
        const newScore = s + points;
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('game2048_best_react', newScore);
        }
        return newScore;
      });
      
      setTimeout(() => {
        setTiles(prev => prev.filter(t => !t.willDie));
      }, 150);
      
      let canMove = false;
      for(let r = 0; r < 4; r++){
        for(let c = 0; c < 4; c++){
          if(!grid[r][c]) canMove = true;
          if(r < 3 && grid[r][c] && grid[r+1][c] && grid[r][c].val === grid[r+1][c].val) canMove = true;
          if(c < 3 && grid[r][c] && grid[r][c+1] && grid[r][c].val === grid[r][c+1].val) canMove = true;
        }
      }
      if (!canMove) setGameOver(true);
    }
  };

  const getTileStyle = (r, c) => {
    const gap = 2; 
    const size = 22.5; 
    const top = gap + r * (size + gap);
    const left = gap + c * (size + gap);
    return {
      top: `${top}%`,
      left: `${left}%`,
      width: `${size}%`,
      height: `${size}%`
    };
  };

  const TILE_STYLES = {
    2: 'bg-slate-200 text-slate-800',
    4: 'bg-slate-300 text-slate-800',
    8: 'bg-orange-300 text-white',
    16: 'bg-orange-400 text-white',
    32: 'bg-orange-500 text-white',
    64: 'bg-red-500 text-white',
    128: 'bg-yellow-400 text-white shadow-[0_0_10px_rgba(250,204,21,0.5)]',
    256: 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.6)]',
    512: 'bg-yellow-600 text-white shadow-[0_0_20px_rgba(202,138,4,0.7)]',
    1024: 'bg-yellow-700 text-white shadow-[0_0_25px_rgba(161,98,7,0.8)]',
    2048: 'bg-yellow-800 text-white shadow-[0_0_30px_rgba(113,63,18,0.9)]',
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-200 py-10 px-4 flex flex-col items-center selection:bg-cyan-500/30">
      <style>{`
        @keyframes tile-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        .animate-pop { animation: tile-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        @keyframes tile-merge {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-merge { animation: tile-merge 0.15s ease-out forwards; }
      `}</style>

      {/* HEADER PANEL */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl shadow-xl mb-8 w-full max-w-[500px] border border-slate-700/50">
        <div className="flex gap-3">
          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-700/50 flex flex-col items-center shadow-inner min-w-[80px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Score</span>
            <span className="text-xl font-black text-cyan-400 leading-none">{score}</span>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-700/50 flex flex-col items-center shadow-inner min-w-[80px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Best</span>
            <span className="text-xl font-black text-purple-400 leading-none">{bestScore}</span>
          </div>
        </div>
        <button 
          onClick={initGame} 
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-95 whitespace-nowrap"
        >
          New Game
        </button>
      </div>

      {/* GRID LAYOUT */}
      <div 
        className="relative w-full max-w-[450px] aspect-square bg-slate-800 rounded-2xl mx-auto overflow-hidden shadow-2xl border-4 border-slate-800 touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Empty Cells */}
        {Array.from({length: 16}).map((_, i) => (
          <div key={i} className="absolute bg-slate-700 rounded-xl" style={getTileStyle(Math.floor(i/4), i%4)} />
        ))}

        {/* Active Tiles */}
        {tiles.map(tile => (
          <div
            key={tile.id}
            className={`absolute rounded-xl flex items-center justify-center font-bold text-3xl sm:text-4xl transition-all duration-150 ease-in-out ${TILE_STYLES[tile.val] || 'bg-slate-950 text-white shadow-2xl'} ${tile.isNew ? 'animate-pop' : ''} ${tile.merged ? 'animate-merge' : ''}`}
            style={{
              ...getTileStyle(tile.r, tile.c),
              zIndex: tile.willDie ? 10 : 20
            }}
          >
            {tile.val}
          </div>
        ))}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 transition-opacity duration-300">
            <h2 className="text-5xl font-black text-white drop-shadow-lg mb-2">Game Over!</h2>
            <p className="text-slate-300 mb-8 font-medium">No more moves available.</p>
            <button 
              onClick={initGame}
              className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-transform active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* EXPLICIT TEXT BLOCK INJECTION */}
      <div className="w-full max-w-[500px] mt-8 bg-slate-800 border border-slate-700/50 rounded-2xl p-6 text-slate-300 text-sm sm:text-base leading-relaxed shadow-lg text-center">
        <h2>How to Move</h2>
        <p className="mb-2"><strong className="text-cyan-400 font-bold">On Desktop:</strong> Use your keyboard's Arrow Keys (Up, Down, Left, Right).</p>
        <p className="mb-2"><strong className="text-purple-400 font-bold">On Mobile:</strong> Swipe your finger in the direction you want the tiles to slide.</p>
        <p className="text-slate-400 italic mt-4">When you make a move, every single tile on the board slides as far as it can in that direction.</p>
      </div>

      {/* SEO EXPLANATION */}
      <div className="w-full max-w-[500px] mt-8 text-slate-400 text-sm leading-relaxed space-y-4 pb-12">
        <h3 className="text-lg font-bold text-slate-200">2048 Grid Strategies and Techniques</h3>
        <p>Mastering the 2048 puzzle requires more than random swiping; it demands systematic matrix management and calculated risk assessment. The fundamental approach centers around corner locking. By designating a specific corner—often the bottom-right or bottom-left—for your highest numerical tile, you establish a gravitational anchor. This limits chaotic shifting and ensures your primary combinations develop sequentially along a designated edge.</p>
        <p>Building a successful sequence means maintaining a strict numerical gradient. If your maximum tile sits at 1024 in the corner, the adjacent cell should hold 512, followed by 256, and so on. This descending chain reaction allows for massive, sweeping merges when the board becomes crowded. Consistently pushing tiles against your anchor wall prevents newly spawned '2' or '4' blocks from interrupting your gradient.</p>
        <p>Navigating the endgame introduces high tension as open cells disappear. During these restricted phases, directional discipline is mandatory. Committing to only three movement directions (for example, Down, Left, and Right) keeps your anchor tile securely pinned against the perimeter. Breaking this rule and moving Up often dislodges the anchor, instantly introducing fatal fragmentation into your carefully constructed board. Practicing these spatial organizational patterns transforms the sliding block mechanics from a game of chance into a predictable, highly solvable mathematical challenge.</p>
      </div>
    </div>
  );
}
