const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const files = fs.readdirSync(rootDir);

const preservedFiles = [
    'purge_workspace_artifacts.js',
    'package.json',
    'package-lock.json',
    'vercel.json',
    'ads.txt',
    'robots.txt'
];

files.forEach(file => {
    const filePath = path.join(rootDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        
        if (!preservedFiles.includes(file)) {
            if (ext === '.js' || ext === '.txt' || ext === '.json') {
                fs.unlinkSync(filePath);
                console.log(`[CLEANUP LOCK]: Redundant artifact ${file} successfully removed from workspace`);
            }
        }
    }
});
