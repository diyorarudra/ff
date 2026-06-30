const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

const target = `<main>`;
const replacement = `<main>
    <!-- ===== HERO CAROUSEL ===== -->
    <section class="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-4" aria-label="Featured Games">
      <div class="carousel-container glass-card">
        <div id="carousel-track" class="carousel-track">
          <!-- JS populates slides -->
        </div>
      </div>
      <div id="carousel-dots" class="carousel-dots" role="tablist" aria-label="Carousel navigation"></div>
    </section>`;

if (content.includes(target) && !content.includes('HERO CAROUSEL')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Restored HERO CAROUSEL in index.html');
}

const jsPath = path.join(__dirname, 'js', 'main.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

const targetJs = `// initCarousel(); // Removed for premium grid layout`;
const replacementJs = `initCarousel();`;

if (jsContent.includes(targetJs)) {
    jsContent = jsContent.replace(targetJs, replacementJs);
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log('Uncommented initCarousel() in js/main.js');
}
