const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname);

let report = {
    registry: {},
    games: {},
    blog: {},
    score: 0
};

const filesToCheck = ['privacy-policy.html', 'terms-of-service.html', 'ads.txt', 'sitemap.xml', 'robots.txt'];
let registryPassCount = 0;

filesToCheck.forEach(file => {
    const fileLoc = path.join(targetDir, file);
    if (!fs.existsSync(fileLoc)) {
        report.registry[file] = '[CRITICAL FIX REQUIRED] File physically missing.';
    } else {
        const text = fs.readFileSync(fileLoc, 'utf8');
        if (file === 'privacy-policy.html') {
            if (text.toLowerCase().includes('google adsense') || text.toLowerCase().includes('cookie') || text.toLowerCase().includes('third-party')) {
                report.registry[file] = '[PASS] Contains third-party/cookie disclosures.';
                registryPassCount++;
            } else {
                report.registry[file] = '[CRITICAL FIX REQUIRED] Missing explicit AdSense/cookie disclosures.';
            }
        } else if (file === 'terms-of-service.html') {
            if (text.toLowerCase().includes('scraping') || text.toLowerCase().includes('terms')) {
                report.registry[file] = '[PASS] Contains terms/anti-scraping parameters.';
                registryPassCount++;
            } else {
                report.registry[file] = '[CRITICAL FIX REQUIRED] Missing anti-scraping/terms of use parameters.';
            }
        } else if (file === 'ads.txt') {
            if (text.includes('google.com, pub-') && text.includes('DIRECT') && text.includes('f08c47fec0942fa0')) {
                report.registry[file] = '[PASS] Valid authorized distributor string syntax.';
                registryPassCount++;
            } else {
                report.registry[file] = '[CRITICAL FIX REQUIRED] Invalid ads.txt syntax.';
            }
        } else if (file === 'sitemap.xml') {
            let valid = true;
            for (let i = 1; i <= 100; i++) {
                if (!text.includes('/games/game' + i + '/')) {
                    valid = false; break;
                }
            }
            if (valid) {
                report.registry[file] = '[PASS] Schema covers all 100 game deep routes.';
                registryPassCount++;
            } else {
                report.registry[file] = '[CRITICAL FIX REQUIRED] Schema does not cover all 100 game deep routes.';
            }
        } else if (file === 'robots.txt') {
            if (text.includes('Allow: /') && text.toLowerCase().includes('mediapartners-google')) {
                report.registry[file] = '[PASS] Mediapartners-Google crawler allowed explicitly.';
                registryPassCount++;
            } else {
                report.registry[file] = '[CRITICAL FIX REQUIRED] Mediapartners-Google crawler agent rules missing.';
            }
        }
    }
});

let gamePassCount = 0;
let missingSeoCount = 0;
for (let i = 1; i <= 100; i++) {
    const fileLoc = path.join(targetDir, 'games', 'game'+i, 'index.html');
    if (!fs.existsSync(fileLoc)) {
        continue;
    }
    const text = fs.readFileSync(fileLoc, 'utf8');
    let gameValid = true;
    
    if (!text.includes('id="gameCanvas_' + i + '"') && !text.includes("id='gameCanvas_" + i + "'")) {
        gameValid = false;
    }
    if (text.includes('Swipe or use arrows to combine the same numbers.') || text.includes('>Platformer<')) {
        gameValid = false;
    }
    if (!text.includes('class="adsense-seo-block')) {
        missingSeoCount++;
        gameValid = false;
    }

    if (gameValid) gamePassCount++;
}
report.games.summary = 'Checked 100 games. ' + gamePassCount + ' passed all checks. ' + missingSeoCount + ' are missing the mandatory adsense-seo-block text elements.';

const blogDir = path.join(targetDir, 'blog');
const aiWords = ["In conclusion", "Furthermore", "Moreover", "Delve", "Crucial", "Testament", "Vital"];
let blogChecked = 0;
let blogFlagged = [];

if (fs.existsSync(blogDir)) {
    const readBlogDir = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) {
                readBlogDir(p);
            } else if (p.endsWith('.html')) {
                blogChecked++;
                const content = fs.readFileSync(p, 'utf8');
                let wordCount = 0;
                aiWords.forEach(w => {
                    const regex = new RegExp(w, 'gi');
                    const matches = content.match(regex);
                    if (matches) wordCount += matches.length;
                });
                if (wordCount > 3) {
                    blogFlagged.push(path.basename(p) + ' (' + wordCount + ' flagged terms)');
                }
            }
        });
    };
    readBlogDir(blogDir);
}
report.blog.summary = 'Scanned ' + blogChecked + ' blog files. ' + blogFlagged.length + ' files flagged for AI-pattern remediation.';
report.blog.flagged = blogFlagged;

let totalPossible = 5 + 100 + blogChecked;
let totalAchieved = registryPassCount + gamePassCount + (blogChecked - blogFlagged.length);
report.score = Math.round((totalAchieved / Math.max(1, totalPossible)) * 100);

fs.writeFileSync(path.join(targetDir, 'adsense_audit_results.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('Audit complete.');
