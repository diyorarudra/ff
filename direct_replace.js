const fs = require('fs');
const path = require('path');

const svgGamepad = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:auto;vertical-align:middle"><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="2"></rect></svg>`;
const svgNewspaper = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:auto;vertical-align:middle"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>`;
const svgCheck = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:auto;vertical-align:middle;color:#4ade80"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
const svgRefresh = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:middle"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`;
const svgBug = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:auto;vertical-align:middle"><rect x="8" y="6" width="8" height="14" rx="4"></rect><path d="m19 7-3 2"></path><path d="m5 7 3 2"></path><path d="m19 19-3-2"></path><path d="m5 19 3-2"></path><path d="M20 13h-4"></path><path d="M4 13h4"></path><path d="m10 4 1 2"></path><path d="m14 4-1 2"></path></svg>`;
const svgTarget = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:auto;vertical-align:middle;color:#8b5cf6"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`;

let modifiedFiles = 0;

function fixFile(fullPath) {
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Feature card empty texts
    content = content.replace(/Œ /g, '');
    content = content.replace(/­ /g, ''); // soft hyphen + space
    content = content.replace(/‘¥/g, '');
    
    // Icons
    content = content.replace(/Ž¯/g, svgTarget);
    content = content.replace(/•¹¸ /g, svgGamepad);
    content = content.replace(/“ /g, svgNewspaper); // left quote + space
    
    content = content.replace(/œ…/g, svgCheck);
    content = content.replace(/œ‰¸ /g, svgRefresh);
    content = content.replace(/> ›<\/div>/g, `>${svgBug}</div>`);

    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        modifiedFiles++;
        console.log(`Modified: ${fullPath}`);
    }
}

fixFile('./compliance/about-us.html');
fixFile('./compliance/contact.html');
fixFile('./index.html');

console.log(`Total modified files: ${modifiedFiles}`);
