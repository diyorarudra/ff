const fs = require('fs');
const path = require('path');

const blogDir = './blog';
let modifiedCount = 0;

fs.readdirSync(blogDir).forEach(file => {
    if (file.endsWith('.html')) {
        const filePath = path.join(blogDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if script already exists
        if (!content.includes('<script src="../js/main.js"></script>')) {
            // Insert script before </body>
            if (content.includes('</body>')) {
                content = content.replace('</body>', '  <script src="../js/main.js"></script>\n</body>');
                fs.writeFileSync(filePath, content, 'utf8');
                modifiedCount++;
            }
        }
    }
});

console.log(`Successfully added main.js to ${modifiedCount} blog files.`);
