const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

const chessLogic = `
        const canvas = document.getElementById('gameCanvas_60'); const ctx = canvas.getContext('2d');
        let board = [
            ['♜','♞','♝','♛','♚','♝','♞','♜'], ['♟','♟','♟','♟','♟','♟','♟','♟'],
            ['','','','','','','',''], ['','','','','','','',''],
            ['','','','','','','',''], ['','','','','','','',''],
            ['♙','♙','♙','♙','♙','♙','♙','♙'], ['♖','♘','♗','♕','♔','♗','♘','♖']
        ];
        let sel = null, score = 0;
        function draw() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,canvas.width,canvas.height);
            for(let r=0; r<8; r++) { 
                for(let c=0; c<8; c++) { 
                    ctx.fillStyle=(r+c)%2===0?'#f1f5f9':'#475569'; 
                    if(sel && sel.r===r && sel.c===c) ctx.fillStyle='#facc15';
                    ctx.fillRect(180+c*55, 30+r*55, 55, 55); 
                    if(board[r][c]) { 
                        ctx.fillStyle='#000'; ctx.font='36px sans-serif'; ctx.textAlign='center'; 
                        ctx.fillText(board[r][c], 180+c*55+27.5, 30+r*55+42); 
                    } 
                } 
            }
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.textAlign='left'; ctx.fillText('Moves: '+score, 20, 40);
        }
        canvas.addEventListener('click', (e) => { 
            const r=canvas.getBoundingClientRect(); const scX=canvas.width/r.width, scY=canvas.height/r.height;
            let c=Math.floor(((e.clientX-r.left)*scX - 180)/55), ro=Math.floor(((e.clientY-r.top)*scY - 30)/55);
            if(c>=0 && c<8 && ro>=0 && ro<8) {
                if(sel) {
                    if(sel.r!==ro || sel.c!==c) { board[ro][c]=board[sel.r][sel.c]; board[sel.r][sel.c]=''; score++; document.getElementById('score').innerText=score; }
                    sel=null;
                } else if(board[ro][c]) { sel={r:ro, c:c}; }
                draw();
            }
        });
        draw();
`;

const ludoLogic = `
        const c = document.getElementById('gameCanvas_58'); const ctx = c.getContext('2d');
        let tokens = [{id:0, pos:0, c:'#ef4444'}, {id:1, pos:0, c:'#3b82f6'}, {id:2, pos:0, c:'#22c55e'}, {id:3, pos:0, c:'#facc15'}];
        let dice = 1, state = 'roll', turn = 0, score = 0;
        const track = [];
        // Generate a 40-step circular track path around the center
        for(let i=0; i<10; i++) track.push({x: 200+i*40, y: 100});
        for(let i=0; i<10; i++) track.push({x: 600, y: 100+i*40});
        for(let i=0; i<10; i++) track.push({x: 600-i*40, y: 500});
        for(let i=0; i<10; i++) track.push({x: 200, y: 500-i*40});
        
        function draw() {
            ctx.fillStyle='#131a26'; ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#334155'; track.forEach(t => ctx.fillRect(t.x, t.y, 35, 35));
            ctx.fillStyle='#fff'; ctx.font='20px sans-serif'; ctx.fillText('Turn: Player '+(turn+1), 20, 40);
            ctx.fillText('Score: '+score, 20, 70);
            ctx.fillStyle='#f8fafc'; ctx.fillRect(350, 220, 100, 100);
            ctx.fillStyle='#000'; ctx.font='40px sans-serif'; ctx.textAlign='center'; ctx.fillText(dice, 400, 280);
            if(state==='roll') { ctx.fillStyle='#ef4444'; ctx.font='16px sans-serif'; ctx.fillText('Click to Roll', 400, 210); }
            else { ctx.fillStyle='#3b82f6'; ctx.font='16px sans-serif'; ctx.fillText('Click Token', 400, 210); }
            tokens.forEach(tk => { 
                let p = track[tk.pos % track.length];
                ctx.fillStyle = tk.c; ctx.beginPath(); ctx.arc(p.x+17, p.y+17, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            });
        }
        c.addEventListener('click', (e) => { 
            const r=c.getBoundingClientRect(); const cx=(e.clientX-r.left)*c.width/r.width, cy=(e.clientY-r.top)*c.height/r.height;
            if(state==='roll') {
                if(cx>350 && cx<450 && cy>220 && cy<320) { dice = Math.floor(Math.random()*6)+1; state='move'; draw(); }
            } else {
                tokens.forEach((tk, idx) => {
                    let p = track[tk.pos % track.length];
                    if(idx===turn && Math.hypot(cx-(p.x+17), cy-(p.y+17))<20) {
                        tk.pos += dice; score+=dice; document.getElementById('score').innerText=score;
                        turn = (turn+1)%4; state='roll'; draw();
                    }
                });
            }
        });
        draw();
`;

function injectLogic(gameId, logicPayload) {
    const fileLoc = path.join(targetDir, 'game'+gameId, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');
        const scriptMarker = '<script>';
        const closingMarker = '</script>';
        const startIdx = text.lastIndexOf(scriptMarker);
        const endIdx = text.lastIndexOf(closingMarker);

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            text = text.substring(0, startIdx) + scriptMarker + '\n' + logicPayload + '\n  ' + closingMarker + text.substring(endIdx + closingMarker.length);
            fs.writeFileSync(fileLoc, text, { encoding: 'utf8' });
            console.log('Upgraded logic for Game ' + gameId);
        }
    }
}

injectLogic(58, ludoLogic);
injectLogic(60, chessLogic);
