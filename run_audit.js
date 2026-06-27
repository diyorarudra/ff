const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gamesDir = path.join(rootDir, 'games');
const blogDir = path.join(rootDir, 'blog');

let log = [];

// 1. MONETIZATION REGISTRY VALIDATION
const adsTxtPath = path.join(rootDir, 'ads.txt');
const robotsTxtPath = path.join(rootDir, 'robots.txt');
const sitemapPath = path.join(rootDir, 'sitemap.xml');
const privacyPath = path.join(rootDir, 'privacy-policy.html');
const termsPath = path.join(rootDir, 'terms-of-service.html');

function checkFile(filePath, reqStrings) {
    if(!fs.existsSync(filePath)) return "[CRITICAL DEFECT]: Missing";
    const content = fs.readFileSync(filePath, 'utf8');
    for(let str of reqStrings) {
        if(!content.includes(str)) return `[CRITICAL DEFECT]: Missing string "${str}"`;
    }
    return "[PASSED]";
}

log.push("--- 1. MONETIZATION REGISTRY VALIDATION ---");
log.push("privacy-policy.html: " + checkFile(privacyPath, ["tracking cookie", "third-party", "AdSense"]));
log.push("terms-of-service.html: " + checkFile(termsPath, ["terms of use", "scraping"]));
log.push("ads.txt: " + checkFile(adsTxtPath, ["google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"]));
log.push("sitemap.xml: " + checkFile(sitemapPath, ["/games/game100/"])); // Just a loose check to see if it reaches 100
log.push("robots.txt: " + checkFile(robotsTxtPath, ["Mediapartners-Google", "Allow: /"]));


// 2. HTML5 ARCADE INFRASTRUCTURE INTEGRITY CHECK
log.push("\n--- 2. HTML5 ARCADE INFRASTRUCTURE INTEGRITY CHECK ---");
let gamesChecked = 0;
let legacyTemplates = 0;
let missingHooks = 0;
let missingSeo = 0;

for(let i=1; i<=100; i++) {
    let p = path.join(gamesDir, `game${i}`, 'index.html');
    if(fs.existsSync(p)) {
        gamesChecked++;
        let content = fs.readFileSync(p, 'utf8');
        if(content.includes('2048') && !content.includes('GAME 1: 2048')) {
            // Check if it's the exact legacy template vs actual 2048
            if(i !== 1 && i !== 24 && content.includes('score-container')) legacyTemplates++;
        }
        if(!content.includes('gameCanvas_') || !content.includes('restartBtn')) missingHooks++;
        if(!content.includes('adsense-seo-block')) missingSeo++;
    }
}
log.push(`Games Scanned: ${gamesChecked}/100`);
log.push(`Legacy 2048 Templates Detected: ${legacyTemplates}`);
log.push(`Missing Canvas/Reset Hooks: ${missingHooks}`);
log.push(`Missing SEO Blocks: ${missingSeo}`);
if(legacyTemplates === 0 && missingHooks === 0 && missingSeo === 0) {
    log.push("Infrastructure Integrity: [PASSED]");
} else {
    log.push("Infrastructure Integrity: [CRITICAL DEFECT]");
}


// 3. BLOG ARCHIVE NLP HUMANITY HEURISTIC SWEEP
log.push("\n--- 3. BLOG ARCHIVE NLP HUMANITY HEURISTIC SWEEP ---");
const targetPatterns = ["in conclusion", "furthermore", "moreover", "delve", "crucial", "testament", "vital"];
let articlesChecked = 0;
let flaggedArticles = [];

if(fs.existsSync(blogDir)) {
    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));
    articlesChecked = files.length;
    files.forEach(f => {
        let p = path.join(blogDir, f);
        let content = fs.readFileSync(p, 'utf8').toLowerCase();
        let matches = 0;
        targetPatterns.forEach(pattern => {
            if(content.includes(pattern)) matches++;
        });
        if(matches >= 3) flaggedArticles.push(f);
    });
}
log.push(`Articles Scanned: ${articlesChecked}`);
if(flaggedArticles.length > 0) {
    log.push(`Flagged Articles (High AI Entropy): ${flaggedArticles.length}`);
    log.push(`List: ${flaggedArticles.join(', ')}`);
    log.push("NLP Heuristic: [CRITICAL DEFECT]");
} else {
    log.push("Flagged Articles: 0");
    log.push("NLP Heuristic: [PASSED]");
}

fs.writeFileSync(path.join(__dirname, 'audit_results.txt'), log.join('\n'));
console.log("Audit complete.");
