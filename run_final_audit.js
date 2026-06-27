const fs = require('fs');
const path = require('path');

const root = process.cwd();
const results = { 
    infrastructure: {}, 
    ui: { 
        audioBtnDefects: [], 
        seoBlockDefects: [], 
        cushionCount: 0 
    }, 
    nlp: { 
        totalBlogs: 0, 
        flaggedBlogs: [] 
    } 
};

// 1. CORE INFRASTRUCTURE
try {
    const ads = fs.readFileSync(path.join(root, 'ads.txt'), 'utf8');
    results.infrastructure.adsTxt = ads.includes('google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0');
} catch(e) { results.infrastructure.adsTxt = false; }

try {
    const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
    results.infrastructure.robotsTxt = robots.includes('Mediapartners-Google');
} catch(e) { results.infrastructure.robotsTxt = false; }

try {
    const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
    const gameMatches = (sitemap.match(/\/games\/game/g) || []).length;
    const blogMatches = (sitemap.match(/\/blog\//g) || []).length;
    results.infrastructure.sitemap = { games: gameMatches, blogs: blogMatches };
} catch(e) { results.infrastructure.sitemap = false; }

try {
    const pp = fs.readFileSync(path.join(root, 'privacy-policy.html'), 'utf8').toLowerCase();
    results.infrastructure.privacy = pp.includes('gdpr') && pp.includes('ccpa');
} catch(e) { results.infrastructure.privacy = false; }

try {
    const tos = fs.readFileSync(path.join(root, 'terms-of-service.html'), 'utf8').toLowerCase();
    results.infrastructure.tos = tos.includes('scrap');
} catch(e) { results.infrastructure.tos = false; }

// 2. UI ALIGNMENT
for(let i=1; i<=100; i++) {
    try {
        const gPath = path.join(root, 'games', 'game'+i, 'index.html');
        if(fs.existsSync(gPath)) {
            const content = fs.readFileSync(gPath, 'utf8');
            const btnMatches = (content.match(/id="audioToggleBtn"/g) || []).length;
            if(btnMatches !== 1) results.ui.audioBtnDefects.push(i);
            
            const seoMatches = (content.match(/class="adsense-seo-block"/g) || []).length;
            if(seoMatches !== 1) results.ui.seoBlockDefects.push(i);
            
            if(content.includes('TAP TO START')) results.ui.cushionCount++;
        }
    } catch(e) {}
}

// 3. ADVANCED NLP HUMANITY HEURISTIC SWEEP
const blogPath = path.join(root, 'blog');
if(fs.existsSync(blogPath)) {
    const blogs = fs.readdirSync(blogPath).filter(f => f.endsWith('.html') && f !== 'index.html');
    results.nlp.totalBlogs = blogs.length;
    const badPhrases = ['in conclusion', 'furthermore', 'moreover', 'delve', 'crucial', 'testament', 'vital', 'not only... but also'];
    blogs.forEach(b => {
        const content = fs.readFileSync(path.join(blogPath, b), 'utf8').toLowerCase();
        let flags = [];
        badPhrases.forEach(p => {
            if(content.includes(p)) flags.push(p);
        });
        if(flags.length > 0) results.nlp.flaggedBlogs.push({ file: b, flags: flags });
    });
}

fs.writeFileSync('adsense_audit_results_final.json', JSON.stringify(results, null, 2));
console.log("Audit complete. Results saved.");
