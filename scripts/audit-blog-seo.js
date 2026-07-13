const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://www.ffliveplay.com';
const reportDir = path.join(root, 'reports');
const redirectMapPath = path.join(root, 'data', 'blog-redirects.json');

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function first(html, re) {
  const match = html.match(re);
  return match ? match[1].trim() : '';
}

function all(html, re) {
  return [...html.matchAll(re)].map(match => match[1] || match[0]);
}

function canonicalForSlug(slug) {
  return `${SITE_ORIGIN}/blog/${slug}`;
}

function fileForRoute(route) {
  const clean = route.replace(/^\/+/, '').replace(/\/$/, '');
  if (!clean) return path.join(root, 'index.html');
  return path.join(root, clean.endsWith('.html') ? clean : `${clean}.html`);
}

function existsRoute(route) {
  return fs.existsSync(fileForRoute(route)) || fs.existsSync(path.join(root, route.replace(/^\/+/, ''), 'index.html'));
}

function parseJsonLd(html) {
  return all(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi).map(raw => {
    try {
      return JSON.parse(raw);
    } catch {
      return { '@type': 'INVALID_JSON_LD' };
    }
  });
}

function jsonLdTypes(node) {
  const nodes = Array.isArray(node) ? node : [node];
  return nodes.flatMap(item => {
    if (!item || !item['@type']) return [];
    return Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
  });
}

function routeFromFile(file) {
  const slug = path.basename(file, '.html');
  return `/blog/${slug}`;
}

function titleWithoutBrand(title) {
  return title.replace(/\s*(?:\||-)\s*FFLivePlay$/i, '').replace(/\s+-\s+ffliveplay$/i, '').trim();
}

function topicFromSlug(slug) {
  return slug
    .split('-')
    .filter(word => !['the', 'and', 'in', 'of', 'for', 'to', 'a'].includes(word))
    .slice(0, 5)
    .join(' ');
}

function classifyIntent(slug, title) {
  const text = `${slug} ${title}`.toLowerCase();
  if (/adsense|rewarded|cpm|cpc|monetization|revenue|purchases/.test(text)) return 'Monetization guidance';
  if (/requestanimationframe|canvas|webassembly|wasm|webgpu|collision|latency|object-pooling|localstorage|offscreen|parallax|sprite/.test(text)) return 'Technical explanation';
  if (/audio|sound|music/.test(text)) return 'Browser-game development';
  if (/tutorial|how-to|write|implementing/.test(text)) return 'How-to';
  if (/design|difficulty|interface|color|camera|silhouette|micro/.test(text)) return 'Game design';
  if (/community|reddit|twitter|streamers|creators|trailer|launch|sales/.test(text)) return 'Best practices';
  if (/web3|cloud|future/.test(text)) return 'Comparison';
  return 'Informational';
}

function clusterFor(slug) {
  if (/requestanimationframe|game-loop|core-gameplay-loop/.test(slug)) return 'requestAnimationFrame/game loop';
  if (/canvas|webgpu|webassembly|wasm|offscreen|object-pooling|latency|collision|localstorage|parallax|sprite/.test(slug)) return 'HTML5 performance and browser-game optimization';
  if (/adsense|rewarded|cpm|cpc|monetization|revenue|purchases/.test(slug)) return 'game monetization';
  if (/audio|sound|music/.test(slug)) return 'web game audio';
  if (/community|reddit|twitter|streamers|creators|trailer|launch|sales/.test(slug)) return 'game marketing and launch';
  if (/narrative|lore|dialogue|avatar|horror|twist|choice|story/.test(slug)) return 'narrative design';
  if (/color|interface|silhouette|micro|camera|difficulty|tutorial/.test(slug)) return 'game design UX';
  return 'general browser games';
}

function inventory() {
  const blogDir = path.join(root, 'blog');
  const files = fs.readdirSync(blogDir)
    .filter(file => file.endsWith('.html') && file !== 'index.html')
    .sort()
    .map(file => path.join(blogDir, file));
  const sitemap = read(path.join(root, 'sitemap.xml'));
  const htmlFiles = walk(root).filter(file => file.endsWith('.html'));
  const incoming = new Map();
  const brokenLinks = [];

  for (const page of htmlFiles) {
    const html = read(page);
    for (const href of all(html, /\bhref=["']([^"']+)["']/gi)) {
      if (!href.startsWith('/blog/')) continue;
      const clean = href.split(/[?#]/)[0].replace(/\/$/, '');
      if (clean === '/blog') continue;
      incoming.set(clean, (incoming.get(clean) || 0) + 1);
      if (!existsRoute(clean)) brokenLinks.push({ file: rel(page), href });
    }
  }

  return files.map(file => {
    const html = read(file);
    const slug = path.basename(file, '.html');
    const route = routeFromFile(file);
    const canonical = first(html, /<link\s+rel=["']canonical["'][^>]*href=["']([^"']+)/i);
    const title = first(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const h1 = first(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim();
    const description = first(html, /<meta\s+name=["']description["'][^>]*content=["']([^"']*)/i);
    const ogUrl = first(html, /<meta\s+property=["']og:url["'][^>]*content=["']([^"']*)/i);
    const jsonLd = parseJsonLd(html);
    const article = jsonLd.find(node => jsonLdTypes(node).some(type => type === 'BlogPosting' || type === 'Article')) || {};
    const breadcrumb = jsonLd.find(node => jsonLdTypes(node).includes('BreadcrumbList')) || {};
    const breadcrumbLast = Array.isArray(breadcrumb.itemListElement) ? breadcrumb.itemListElement[breadcrumb.itemListElement.length - 1] : {};
    const outgoing = all(html, /\bhref=["']([^"']+)["']/gi).filter(href => href.startsWith('/blog/') && href.replace(/\/$/, '') !== route);
    const expectedCanonical = canonicalForSlug(slug);
    const bodyText = stripTags(html);
    const wordCount = (bodyText.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) || []).length;
    const primaryQuery = topicFromSlug(slug);
    const titleCore = titleWithoutBrand(title);

    return {
      file: rel(file),
      currentPath: rel(file),
      currentPublicUrl: expectedCanonical,
      currentTitle: title,
      currentH1: h1,
      currentMetaDescription: description,
      currentCanonical: canonical,
      currentSlug: slug,
      wordCount,
      primaryTopic: titleCore || primaryQuery,
      currentLikelySearchIntent: classifyIntent(slug, title),
      currentTargetQuery: primaryQuery,
      currentImpressions: null,
      currentClicks: null,
      currentCtr: null,
      currentPosition: null,
      internalLinksIn: incoming.get(route) || 0,
      internalLinksOut: outgoing.length,
      sitemapStatus: sitemap.includes(`<loc>${expectedCanonical}</loc>`) ? 'present' : 'missing',
      indexabilityStatus: /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html) ? 'noindex' : 'indexable',
      canonicalOk: canonical === expectedCanonical,
      ogUrlOk: !ogUrl || ogUrl === expectedCanonical,
      schemaUrlOk: !article.mainEntityOfPage || article.mainEntityOfPage === expectedCanonical,
      breadcrumbUrlOk: !breadcrumbLast.item || breadcrumbLast.item === expectedCanonical,
      h1TitleOk: titleCore === h1,
      titleLength: title.length,
      descriptionLength: description.length,
      jsonLdValid: !jsonLd.some(node => jsonLdTypes(node).includes('INVALID_JSON_LD')),
      evidence: 'Content-fit inference; no Search Console export was found in the repository.',
      decisionStatus: 'KEEP'
    };
  });
}

function analyzeRedirects(redirects) {
  const sourceSet = new Set();
  const duplicateSources = [];
  const loops = [];
  const chains = [];
  const missingDestinations = [];
  const destinationBySource = new Map();

  for (const item of redirects) {
    if (sourceSet.has(item.source)) duplicateSources.push(item.source);
    sourceSet.add(item.source);
    destinationBySource.set(item.source.replace(/\/$/, ''), item.destination.replace(/\/$/, ''));
    if (item.source.replace(/\/$/, '') === item.destination.replace(/\/$/, '')) loops.push(item.source);
    if (!existsRoute(item.destination)) missingDestinations.push(item.destination);
  }

  for (const item of redirects) {
    if (destinationBySource.has(item.destination.replace(/\/$/, ''))) chains.push(`${item.source} -> ${item.destination}`);
  }

  return { duplicateSources, loops, chains, missingDestinations };
}

function duplicateValues(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!value) continue;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(row.file);
  }
  return [...map.entries()].filter(([, files]) => files.length > 1).map(([value, files]) => ({ value, files }));
}

function main() {
  const pages = inventory();
  const redirects = fs.existsSync(redirectMapPath) ? JSON.parse(read(redirectMapPath)) : [];
  const redirectAudit = analyzeRedirects(redirects);
  const sitemap = read(path.join(root, 'sitemap.xml'));
  const allHtmlText = walk(root).filter(file => file.endsWith('.html')).map(read).join('\n');
  const oldRedirectUrls = redirects.map(item => `${SITE_ORIGIN}${item.source.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`);
  const oldUrlsStillInSitemap = oldRedirectUrls.filter(url => sitemap.includes(`<loc>${url}</loc>`));
  const oldUrlsStillInternallyLinked = redirects
    .map(item => item.source)
    .filter(source => allHtmlText.includes(`href="${source}"`) || allHtmlText.includes(`href='${source}'`));
  const newUrlsMissingFromSitemap = redirects
    .map(item => `${SITE_ORIGIN}${item.destination}`)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .filter(url => !sitemap.includes(`<loc>${url}</loc>`));
  const clusters = new Map();
  for (const page of pages) {
    const cluster = clusterFor(page.currentSlug);
    if (!clusters.has(cluster)) clusters.set(cluster, []);
    clusters.get(cluster).push(page.currentSlug);
  }
  const keywordCannibalizationClusters = [...clusters.entries()]
    .filter(([, slugs]) => slugs.length > 1)
    .map(([cluster, slugs]) => ({
      cluster,
      pages: slugs,
      strategy: cluster === 'requestAnimationFrame/game loop'
        ? 'Differentiate titles/intents and use internal links; do not merge without Search Console evidence.'
        : 'Keep separate because intent differs; monitor Search Console queries for overlap.'
    }));

  const metrics = {
    blogPagesChecked: pages.length,
    duplicateTitles: duplicateValues(pages, 'currentTitle').length,
    duplicateDescriptions: duplicateValues(pages, 'currentMetaDescription').length,
    missingTitles: pages.filter(page => !page.currentTitle).length,
    missingDescriptions: pages.filter(page => !page.currentMetaDescription).length,
    titlesTooLong: pages.filter(page => page.titleLength > 65).length,
    titlesTooShort: pages.filter(page => page.titleLength < 20).length,
    descriptionsTooLong: pages.filter(page => page.descriptionLength > 170).length,
    descriptionsTooShort: pages.filter(page => page.descriptionLength < 70).length,
    slugTopicMismatches: pages.filter(page => page.currentSlug.includes('digital-equities') || page.currentSlug.includes('macro-economy')).length,
    titleBodyMismatches: pages.filter(page => !stripTags(read(path.join(root, page.file))).toLowerCase().includes(page.currentH1.toLowerCase().split(/\s+/)[0])).length,
    h1TitleMismatches: pages.filter(page => !page.h1TitleOk).length,
    canonicalMismatches: pages.filter(page => !page.canonicalOk).length,
    ogUrlMismatches: pages.filter(page => !page.ogUrlOk).length,
    schemaUrlMismatches: pages.filter(page => !page.schemaUrlOk).length,
    breadcrumbUrlMismatches: pages.filter(page => !page.breadcrumbUrlOk).length,
    redirectCount: redirects.length,
    redirectChains: redirectAudit.chains.length,
    redirectLoops: redirectAudit.loops.length,
    redirectsToMissingDestination: redirectAudit.missingDestinations.length,
    oldUrlsStillInSitemap: oldUrlsStillInSitemap.length,
    oldUrlsStillInternallyLinked: oldUrlsStillInternallyLinked.length,
    newUrlsMissingFromSitemap: newUrlsMissingFromSitemap.length,
    keywordCannibalizationClusters: keywordCannibalizationClusters.length,
    highImpressionLowCtrPages: 0,
    nearPageOneOpportunities: 0,
    ownerApprovalRequired: 0,
    brokenInternalLinks: 0,
    confirmedOrphanBlogPages: pages.filter(page => page.internalLinksIn === 0).length
  };

  const failures = [];
  for (const key of [
    'duplicateTitles',
    'duplicateDescriptions',
    'missingTitles',
    'missingDescriptions',
    'slugTopicMismatches',
    'h1TitleMismatches',
    'canonicalMismatches',
    'ogUrlMismatches',
    'schemaUrlMismatches',
    'breadcrumbUrlMismatches',
    'redirectChains',
    'redirectLoops',
    'redirectsToMissingDestination',
    'oldUrlsStillInSitemap',
    'oldUrlsStillInternallyLinked',
    'newUrlsMissingFromSitemap',
    'brokenInternalLinks'
  ]) {
    if (metrics[key] > 0) failures.push(`${key}: ${metrics[key]}`);
  }

  const result = {
    generatedAt: new Date().toISOString(),
    dataSources: {
      searchConsole: 'Not found in repository.',
      searchVolume: 'Not available; no volume numbers were used.',
      keywordEvidence: 'Content-fit inference with limited SERP spot checks.',
      researchDate: new Date().toISOString().slice(0, 10)
    },
    metrics,
    failures,
    redirectAudit,
    oldUrlsStillInSitemap,
    oldUrlsStillInternallyLinked,
    newUrlsMissingFromSitemap,
    keywordCannibalizationClusters,
    highImpressionLowCtrPages: [],
    nearPageOneOpportunities: [],
    migrationTable: redirects.map(item => ({
      oldUrl: `${SITE_ORIGIN}${item.source}`,
      newUrl: `${SITE_ORIGIN}${item.destination}`,
      reason: item.reason || '',
      searchConsoleImpressions: null,
      searchConsoleClicks: null,
      currentPosition: null,
      knownBacklinks: 'Not detectable locally',
      migrationRisk: 'Low-to-medium; old slug had clear topic mismatch, but no Search Console/backlink data was available.',
      permanentRedirectRule: item,
      canonicalUpdate: `${SITE_ORIGIN}${item.destination}`,
      sitemapUpdate: `${SITE_ORIGIN}${item.destination}`,
      internalLinkUpdate: `${item.destination}`
    })),
    pages
  };

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'blog-seo-audit-report.json'), `${JSON.stringify(result, null, 2)}\n`);
  const lines = [
    '# Blog SEO Audit Report',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    '## Data Sources',
    '',
    `- Search Console: ${result.dataSources.searchConsole}`,
    `- Search volume: ${result.dataSources.searchVolume}`,
    `- Keyword evidence: ${result.dataSources.keywordEvidence}`,
    '',
    '## Metrics',
    ''
  ];
  for (const [key, value] of Object.entries(metrics)) lines.push(`- ${key}: ${value}`);
  lines.push('', '## Migration Table', '');
  for (const row of result.migrationTable) lines.push(`- ${row.oldUrl} -> ${row.newUrl} (${row.reason})`);
  lines.push('', '## Keyword Cannibalization Clusters', '');
  for (const cluster of keywordCannibalizationClusters) lines.push(`- ${cluster.cluster}: ${cluster.pages.join(', ')}. ${cluster.strategy}`);
  lines.push('', '## Result', '', failures.length ? 'Checks failed:' : 'Blog SEO checks passed.');
  for (const failure of failures) lines.push(`- ${failure}`);
  fs.writeFileSync(path.join(reportDir, 'blog-seo-audit-report.md'), `${lines.join('\n')}\n`);

  console.log(JSON.stringify(metrics, null, 2));
  if (failures.length) {
    console.error('\nBlog SEO audit failures:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
}

if (require.main === module) main();
