const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'games');

const sideRailAd = `
     <ins class="adsbygoogle"
          style="display:inline-block;width:160px;height:600px"
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="1111111111"></ins>
     <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
`;

const bottomAd = `
     <ins class="adsbygoogle"
          style="display:block"
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot="2222222222"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
     <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
`;

const asyncScript = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>';

let updatedCount = 0;

for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(targetDir, 'game'+i, 'index.html');
    if (!fs.existsSync(fileLoc)) continue;

    let text = fs.readFileSync(fileLoc, 'utf8');
    let changed = false;

    // 1. Inject Global Head Script
    if (text.indexOf('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js') === -1) {
        const headEnd = text.indexOf('</head>');
        if (headEnd !== -1) {
            text = text.substring(0, headEnd) + '  ' + asyncScript + '\n' + text.substring(headEnd);
            changed = true;
        }
    }

    // 2. Replace Side Rail content
    const sideRailStart = text.indexOf('<div class="adsense-side-rail');
    if (sideRailStart !== -1 && text.indexOf('data-ad-slot="1111111111"') === -1) {
        const sideRailCloseBracket = text.indexOf('>', sideRailStart);
        if (sideRailCloseBracket !== -1) {
            const nextDivClose = text.indexOf('</div>', sideRailCloseBracket);
            if (nextDivClose !== -1) {
                text = text.substring(0, sideRailCloseBracket + 1) + '\n' + sideRailAd + '  ' + text.substring(nextDivClose);
                changed = true;
            }
        }
    }

    // 3. Replace Bottom Banner content
    const bottomBannerStart = text.indexOf('<div class="ad-slot ad-slot-in-article');
    if (bottomBannerStart !== -1 && text.indexOf('data-ad-slot="2222222222"') === -1) {
        const bottomBannerCloseBracket = text.indexOf('>', bottomBannerStart);
        if (bottomBannerCloseBracket !== -1) {
            const nextDivClose = text.indexOf('</div>', bottomBannerCloseBracket);
            if (nextDivClose !== -1) {
                text = text.substring(0, bottomBannerCloseBracket + 1) + '\n' + bottomAd + '  ' + text.substring(nextDivClose);
                changed = true;
            }
        }
    }

    if (changed) {
        fs.writeFileSync(fileLoc, text, 'utf8');
        console.log("Updated AdSense units in /games/game" + i + "/index.html");
        updatedCount++;
    }
}

console.log("AdSense integration successfully verified/applied across " + updatedCount + " directories.");
