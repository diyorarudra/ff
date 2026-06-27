const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<body><canvas width="800" height="600"></canvas></body>
<script>
        if (typeof window.__cushionInjected === 'undefined') {
            window.__cushionInjected = true;
            let __hasStarted = false;
            let __cushionFrames = 0;
            let __realRAF = window.requestAnimationFrame || function(cb) { setTimeout(cb, 16); return 1; };
            window.requestAnimationFrame = function(cb) {
                if (!__hasStarted && __cushionFrames++ > 0) {
                    console.log("Cushion intercepting frame", __cushionFrames);
                    let poller = function() {
                        if (__hasStarted) {
                            __realRAF(cb);
                        } else {
                            setTimeout(poller, 50);
                        }
                    };
                    setTimeout(poller, 50);
                    return;
                }
                return __realRAF(cb);
            };
            let startHandler = function() { __hasStarted = true; };
            window.addEventListener('mousedown', startHandler);
        }

        let frames = 0;
        function gameLoop() {
            frames++;
            console.log("Game loop executed, frame:", frames);
            window.requestAnimationFrame(gameLoop);
        }
        window.requestAnimationFrame(gameLoop);
        
        setTimeout(() => {
            console.log("Simulating click...");
            const event = new dom.window.MouseEvent('mousedown');
            dom.window.dispatchEvent(event);
        }, 100);
        
        setTimeout(() => {
            console.log("Total frames executed:", frames);
            if (frames > 1) {
                console.log("SUCCESS!");
            }
        }, 300);
</script>
`, { runScripts: "dangerously" });
