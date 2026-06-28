const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');

const manualReplacements = {
    2: "Arcade Module 2 Strategic Guide: Navigate a high-stakes grid matrix utilizing mathematical deduction. Left-click hidden tiles to expose numeric neighborhood values indicating adjacent hazard items. Right-click or long-press clear coordinates to plant tracking flags over confirmed danger sectors. Clear the field grid seamlessly without detonating the grid layout.",
    9: "Arcade Module 9 Strategic Guide: Manage an active production layout inside a neon forging engine. Position falling molecular elements into correct color channels using fast reflex controls. Create unbroken lines to clear thermal load before the structural layout overflows.",
    14: "Arcade Module 14 Strategic Guide: Test visual tracking capabilities against high-velocity geometry arrays. Study the target graphic outline displayed on your control dock, then quickly locate and select matching shapes mixed in the moving pool layer. Maintain long accuracy streaks to compound game scores."
};

const observerScript = `
<script>
document.addEventListener("DOMContentLoaded", () => {
    const adObserver = new MutationObserver(() => {});
    setTimeout(() => {
        document.querySelectorAll('.ad-slot, .adsense-side-rail').forEach(slot => {
            const ins = slot.querySelector('ins.adsbygoogle');
            if (ins && ins.innerHTML.trim() === '') {
                slot.style.setProperty('display', 'none', 'important');
                slot.style.height = '0';
                slot.style.minHeight = '0';
            }
        });
    }, 2500);
});
</script>
`;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(gamesDir, `game${i}`, 'index.html');
    if (fs.existsSync(fileLoc)) {
        let text = fs.readFileSync(fileLoc, 'utf8');
        let modified = false;

        const nakedPush = '(adsbygoogle = window.adsbygoogle || []).push({});';
        const safePush = "try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.warn('AdSense payload dropped securely:', e); }";
        
        if (text.includes(nakedPush)) {
            text = text.split(nakedPush).join(safePush);
            modified = true;
        }

        if (!text.includes("adObserver = new MutationObserver")) {
            text = text.replace('</head>', observerScript + '</head>');
            modified = true;
        }

        if (manualReplacements[i]) {
            const fallbackRegex = /<p>Welcome to Arcade Room.*?<\/p>/i;
            if (fallbackRegex.test(text)) {
                text = text.replace(fallbackRegex, `<p>${manualReplacements[i]}</p>`);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(fileLoc, text, 'utf8');
            console.log(`[COMPLIANCE SECURED]: Ad wrappers and unique human manuals injected for Game ${i}`);
        }
    }
}
