const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const shortGameSlugs = new Set([
  'archery-master', 'asteroids', 'ball-sort-puzzle', 'bike-stunt-challenge',
  'bollywood-quiz-battle', 'bus-driver-route', 'color-sort-puzzle',
  'cricket-batting-challenge', 'cricket-quiz-league', 'crime-scramble',
  'crossword-mini', 'daily-brain-training', 'daily-word-puzzle',
  'emoji-movie-guess', 'english-word-challenge', 'escape-room-mini',
  'find-the-difference', 'gk-quiz-india', 'guess-the-city',
  'hexa-block-puzzle', 'hidden-object-rooms', 'idle-farm-tycoon',
  'idle-restaurant-tycoon', 'idle-shop-manager', 'letter-hunt',
  'logo-guess-game', 'match-3-gems', 'merge-animals', 'merge-cars',
  'merge-numbers', 'minesweeper', 'nonogram-picture-puzzle',
  'number-memory-challenge', 'parking-master', 'penalty-shootout',
  'reaction-speed-test', 'riddle-master', 'traffic-control',
  'water-sort-puzzle', 'wood-block-puzzle', 'word-connect'
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'reports'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraph(html) {
  const source = (html.match(/<div class="prose[\s\S]*?<\/div>\s*<\/article>/i) || [html])[0];
  const match = source.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  return match ? stripHtml(match[1]).toLowerCase() : '';
}

function lastParagraph(html) {
  const source = (html.match(/<div class="prose[\s\S]*?<\/div>\s*<\/article>/i) || [html])[0];
  const matches = [...source.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  const last = matches[matches.length - 1];
  return last ? stripHtml(last[1]).toLowerCase() : '';
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(match => {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  });
}

function schemaMismatch(file, html) {
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim();
  const article = jsonLdBlocks(html).find(data => data && ['BlogPosting', 'Article'].includes(data['@type']));
  if (!article) return false;
  return article.headline && h1 && article.headline.trim() !== h1;
}

function visibleArticleText(html) {
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  return stripHtml(article ? article[0] : html);
}

function duplicateValues(items, key) {
  const counts = new Map();
  for (const item of items) counts.set(item[key], (counts.get(item[key]) || 0) + 1);
  return items.filter(item => item[key] && counts.get(item[key]) > 1).map(item => item.file);
}

function audit() {
  const files = walk(root).map(rel);
  const blogPages = files.filter(file => /^blog\/[^/]+\.html$/.test(file) && file !== 'blog/index.html');
  const gamePages = files.filter(file => /^games\/[^/]+\/index\.html$/.test(file));
  const blogData = blogPages.map(file => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    return {
      file,
      opening: firstParagraph(html),
      conclusion: lastParagraph(html),
      unsupportedFutureTerms: /\b(guaranteed|will dominate|certain to|investment advice|digital equities|macroeconomy|2026 macro)\b/i.test(visibleArticleText(html)),
      schemaMismatch: schemaMismatch(file, html)
    };
  });
  const gameRisks = gamePages.filter(file => shortGameSlugs.has(file.split('/')[1])).filter(file => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const guidance = (html.match(/<section\b[^>]*data-game-guidance=["']true["'][\s\S]*?<\/section>/i) || [''])[0];
    return !/Goal:|Objective:/i.test(guidance)
      || !/Controls:/i.test(guidance)
      || !/Progress:|Scoring:/i.test(guidance)
      || !/Restart:/i.test(guidance)
      || !/Tip:/i.test(guidance);
  });
  const result = {
    blogPagesChecked: blogPages.length,
    gamePagesChecked: gamePages.length,
    duplicateBlogOpenings: duplicateValues(blogData, 'opening'),
    duplicateBlogConclusions: duplicateValues(blogData, 'conclusion'),
    blogPostsWithUnsupportedHighRiskTerms: blogData.filter(item => item.unsupportedFutureTerms).map(item => item.file),
    blogPostsWithSchemaContentMismatch: blogData.filter(item => item.schemaMismatch).map(item => item.file),
    gamePagesMissingGuidanceElements: gameRisks,
    passed: true
  };
  result.passed = !result.duplicateBlogOpenings.length
    && !result.duplicateBlogConclusions.length
    && !result.blogPostsWithUnsupportedHighRiskTerms.length
    && !result.blogPostsWithSchemaContentMismatch.length
    && !result.gamePagesMissingGuidanceElements.length;
  return result;
}

if (require.main === module) {
  const result = audit();
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exit(1);
}

module.exports = { audit };
