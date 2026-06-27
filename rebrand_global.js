const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === '.git' || file === 'node_modules') return;
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.xml') || file.endsWith('.txt')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(__dirname);
let changedCount = 0;

for (let file of files) {
    if (file === __filename || file.endsWith('rebrand_global.js')) continue;
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // 1. Domains
    content = content.replace(/arcadenexus\.com/g, 'gamiday.com');
    content = content.replace(/ArcadeNexus\.com/g, 'GamiDay.com');
    // 2. Exact Title Case
    content = content.replace(/ArcadeNexus/g, 'GamiDay');
    // 3. Exact Lower Case
    content = content.replace(/arcadenexus/g, 'gamiday');
    // 4. Exact Upper Case
    content = content.replace(/ARCADENEXUS/g, 'GAMIDAY');
    
    // Add Email in contact.html if applicable
    if (file.replace(/\\/g, '/').endsWith('compliance/contact.html')) {
        content = content.replace(
            "We'd love to hear from you. Fill out the form below",
            "We'd love to hear from you. Email us directly at gamiday1@gmail.com, or fill out the form below"
        );
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
    }
}
console.log(`Global Rebrand Complete! Modified ${changedCount} files from ArcadeNexus to GamiDay.`);
