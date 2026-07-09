const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, '../games');
const MAIN_JS_PATH = path.join(__dirname, '../js/main.js');

function extractGamesArray() {
    try {
        const content = fs.readFileSync(MAIN_JS_PATH, 'utf8');
        const match = content.match(/const GAMES = (\[[\s\S]*?\]);/);
        if (match) {
            return eval(match[1]); // using eval is safe here for this controlled audit script
        }
    } catch(e) {
        console.error("Error reading js/main.js", e);
    }
    return [];
}

function runAudit() {
    console.log("=== FINAL QA AUDIT ===");
    const gamesFolders = fs.readdirSync(GAMES_DIR).filter(f => fs.statSync(path.join(GAMES_DIR, f)).isDirectory());
    const registeredGames = extractGamesArray();
    
    console.log(`1. Total game folders found in /games: ${gamesFolders.length}`);
    console.log(`2. Total games registered in js/main.js: ${registeredGames.length}`);
    
    const registeredSlugs = registeredGames.map(g => g.slug);
    
    const missingFolders = registeredSlugs.filter(slug => !gamesFolders.includes(slug));
    const extraFolders = gamesFolders.filter(folder => !registeredSlugs.includes(folder));
    
    console.log(`3. Missing folders from registry: ${missingFolders.length > 0 ? missingFolders.join(', ') : 'None'}`);
    console.log(`4. Extra folders not in registry: ${extraFolders.length > 0 ? extraFolders.join(', ') : 'None'}`);
    
    const duplicateSlugs = registeredSlugs.filter((item, index) => registeredSlugs.indexOf(item) !== index);
    console.log(`5. Duplicate slugs in registry: ${duplicateSlugs.length > 0 ? duplicateSlugs.join(', ') : 'None'}`);
    
    let missingMetadata = 0;
    const requiredKeys = ['id', 'title', 'category', 'desc', 'icon', 'color', 'slug', 'tags', 'difficulty', 'estimatedPlayTime', 'rewardCoins', 'isExistingGame', 'isNewAddedGame', 'isTrending', 'isNew', 'playCount', 'rating', 'instructions', 'seoTitle', 'seoDescription'];
    
    registeredGames.forEach(g => {
        let missing = [];
        requiredKeys.forEach(k => {
            if (g[k] === undefined || g[k] === null || g[k] === '') {
                missing.push(k);
            }
        });
        if (missing.length > 0) {
            console.log(` - Metadata missing for ${g.slug}: ${missing.join(', ')}`);
            missingMetadata++;
        }
    });
    console.log(`6. Games with missing metadata: ${missingMetadata}`);
    
    console.log(`7. Gujarati Word Challenge check:`);
    console.log(`   - Registered: ${registeredSlugs.includes('gujarati-word-challenge') ? 'YES (FAIL)' : 'NO (PASS)'}`);
    console.log(`   - Folder Exists: ${gamesFolders.includes('gujarati-word-challenge') ? 'YES (FAIL)' : 'NO (PASS)'}`);
    
    console.log(`8. English Word Challenge check:`);
    console.log(`   - Registered: ${registeredSlugs.includes('english-word-challenge') ? 'YES (PASS)' : 'NO (FAIL)'}`);
    console.log(`   - Folder Exists: ${gamesFolders.includes('english-word-challenge') ? 'YES (PASS)' : 'NO (FAIL)'}`);
    
    console.log("=== AUDIT COMPLETE ===");
}

runAudit();
