const fs = require('fs');
const path = require('path');
const { SITE_ORIGIN, ADSENSE_CLIENT_ID, GA_MEASUREMENT_ID } = require('./site-config');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'reports');

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
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

function visibleWordCount(html) {
  return (stripHtml(html).match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) || []).length;
}

function firstMatch(html, re) {
  const match = html.match(re);
  return match ? match[1].trim() : '';
}

function allMatches(html, re) {
  return [...html.matchAll(re)].map((match) => match[1] || match[0]);
}

function isNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
}

function pageType(file) {
  if (file === 'index.html') return 'home';
  if (file === '404.html') return 'error';
  if (file === 'play.html' || file.startsWith('play-fallback-disabled/')) return 'player';
  if (file.startsWith('games/')) return 'game';
  if (file.startsWith('blog/')) return file === 'blog/index.html' ? 'blog-index' : 'blog-post';
  if (file.startsWith('compliance/') || file === 'terms-of-service.html') return 'compliance';
  if (file.endsWith('/index.html')) return 'category';
  return 'page';
}

function canonicalPathForFile(file) {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return `/${file.replace(/\/index\.html$/, '')}`;
  return `/${file.replace(/\.html$/, '')}`;
}

function expectedCanonical(file) {
  return `${SITE_ORIGIN}${canonicalPathForFile(file) === '/' ? '/' : canonicalPathForFile(file)}`;
}

function resolveLocal(fromFile, url) {
  if (/^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(url) || url.startsWith('//') || url.startsWith('/_vercel/')) {
    return null;
  }
  const clean = url.split(/[?#]/)[0];
  if (!clean) return null;
  return clean.startsWith('/')
    ? path.join(root, clean.replace(/^\/+/, ''))
    : path.resolve(path.dirname(path.join(root, fromFile)), clean);
}

function existsAsRoute(target) {
  return [target, `${target}.html`, path.join(target, 'index.html')].some(fs.existsSync);
}

function inventory() {
  const htmlFiles = walk(root).filter((file) => file.endsWith('.html')).map(rel).sort();
  const sitemapXml = fs.existsSync(path.join(root, 'sitemap.xml')) ? fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8') : '';
  const sitemapUrls = allMatches(sitemapXml, /<loc>([^<]+)<\/loc>/g);
  const sitemapSet = new Set(sitemapUrls);
  const pages = [];
  const brokenLinks = [];
  const missingAssets = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const desc = firstMatch(html, /<meta\s+name=["']description["'][^>]*content=["']([^"']*)/i);
    const canonicalTags = allMatches(html, /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)/gi);
    const robots = firstMatch(html, /<meta\s+name=["']robots["'][^>]*content=["']([^"']*)/i);
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const gaLoaderCount = (html.match(new RegExp(`googletagmanager\\.com/gtag/js\\?id=${GA_MEASUREMENT_ID}`, 'g')) || []).length;
    const gaConfigCount = (html.match(new RegExp(`gtag\\('config', '${GA_MEASUREMENT_ID}'\\)`, 'g')) || []).length;
    const adsenseLoaderCount = (html.match(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/gi) || []).length;
    const manualAdUnitCount = (html.match(/<ins\b[^>]*class=["'][^"']*adsbygoogle/gi) || []).length;
    const jsonLdTypes = [];
    for (const block of allMatches(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const parsed = JSON.parse(block);
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        for (const node of nodes) if (node && node['@type']) jsonLdTypes.push(node['@type']);
      } catch {
        jsonLdTypes.push('INVALID_JSON_LD');
      }
    }

    for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      const raw = match[1];
      const target = resolveLocal(file, raw);
      if (!target) continue;
      if (!existsAsRoute(target)) {
        const bucket = /\.(css|js|png|jpe?g|gif|webp|svg|ico|json|xml|txt)$/i.test(raw) ? missingAssets : brokenLinks;
        bucket.push({ file, url: raw });
      }
    }

    pages.push({
      file,
      pageType: pageType(file),
      url: expectedCanonical(file),
      title,
      metaDescription: desc,
      h1Count,
      canonical: canonicalTags[0] || '',
      canonicalCount: canonicalTags.length,
      robots,
      visibleWordCount: visibleWordCount(html),
      adsenseLoaderCount,
      manualAdUnitCount,
      googleAnalyticsCount: gaLoaderCount,
      googleAnalyticsConfigCount: gaConfigCount,
      jsonLdTypes,
      noindex: isNoindex(html),
      inSitemap: sitemapSet.has(canonicalTags[0] || expectedCanonical(file))
    });
  }

  return { pages, sitemapUrls, brokenLinks, missingAssets };
}

function analyze() {
  const { pages, sitemapUrls, brokenLinks, missingAssets } = inventory();
  const indexable = pages.filter((page) => !page.noindex && page.pageType !== 'error' && page.pageType !== 'player');
  const titleCounts = new Map();
  for (const page of indexable) titleCounts.set(page.title, (titleCounts.get(page.title) || 0) + 1);
  const duplicateTitles = indexable.filter((page) => page.title && titleCounts.get(page.title) > 1);
  const allTextFiles = walk(root).filter((file) => /\.(html|js|mjs|json|xml|txt|css)$/i.test(file));
  const placeholderPublisherIds = [];
  const developmentUrls = [];
  for (const file of allTextFiles) {
    if (rel(file) === 'scripts/audit-adsense-readiness.js') continue;
    const text = fs.readFileSync(file, 'utf8');
    if (/pub-XXXXXXXXXXXXXXXX|ca-pub-XXXXXXXXXXXXXXXX|pub-XXXXXXXXXXXXXXX|ca-pub-XXXXXXXXXXXXXXX|REPLACE_WITH_PUBLISHER_ID|YOUR_PUBLISHER_ID|YOUR_ADSENSE_ID/.test(text)) {
      placeholderPublisherIds.push(rel(file));
    }
    if (/(file:\/\/|[A-Z]:\\[\\/])/i.test(text) && !rel(file).startsWith('scripts/')) {
      developmentUrls.push(rel(file));
    }
  }

  const expectedSitemapUrls = new Set(indexable.map((page) => page.canonical || page.url));
  const missingSitemapUrls = [...expectedSitemapUrls].filter((url) => !sitemapUrls.includes(url));
  const noncanonicalSitemapUrls = sitemapUrls.filter((url) => !expectedSitemapUrls.has(url));
  const blogTopicMismatches = indexable.filter((page) => page.pageType === 'blog-post').filter((page) => {
    const slugWords = path.basename(page.file, '.html').split('-').filter((word) => word.length > 2);
    const haystack = `${page.title} ${page.metaDescription}`.toLowerCase();
    return slugWords.slice(0, 3).filter((word) => haystack.includes(word)).length < Math.min(2, slugWords.length);
  });

  const metrics = {
    totalHtmlPages: pages.length,
    indexablePages: indexable.length,
    gamePages: pages.filter((page) => page.pageType === 'game').length,
    blogPages: pages.filter((page) => page.pageType === 'blog-post').length,
    pagesWithAdSense: pages.filter((page) => page.adsenseLoaderCount > 0).length,
    pagesWithManualAdUnits: pages.filter((page) => page.manualAdUnitCount > 0).length,
    placeholderPublisherIds: [...new Set(placeholderPublisherIds)].length,
    missingTitles: indexable.filter((page) => !page.title).length,
    duplicateTitles: duplicateTitles.length,
    missingDescriptions: indexable.filter((page) => !page.metaDescription).length,
    missingCanonicals: indexable.filter((page) => !page.canonical).length,
    multipleCanonicals: indexable.filter((page) => page.canonicalCount > 1).length,
    missingH1: indexable.filter((page) => page.h1Count === 0).length,
    multipleH1: indexable.filter((page) => page.h1Count > 1).length,
    noindexPages: pages.filter((page) => page.noindex).length,
    brokenInternalLinks: brokenLinks.length,
    missingLocalAssets: missingAssets.length,
    missingSitemapUrls: missingSitemapUrls.length,
    noncanonicalSitemapUrls: noncanonicalSitemapUrls.length,
    blogTopicMismatches: blogTopicMismatches.length,
    duplicateAnalyticsTags: pages.filter((page) => page.googleAnalyticsCount !== 1 || page.googleAnalyticsConfigCount !== 1).length,
    duplicateAdSenseTags: pages.filter((page) => page.adsenseLoaderCount > 1).length,
    developmentUrls: [...new Set(developmentUrls)].length,
    jsonLdSyntaxErrors: pages.filter((page) => page.jsonLdTypes.includes('INVALID_JSON_LD')).length,
    indexable404Pages: pages.filter((page) => page.pageType === 'error' && !page.noindex).length,
    indexablePlayerPages: pages.filter((page) => page.pageType === 'player' && !page.noindex).length
  };

  const failures = [];
  for (const [key, value] of Object.entries(metrics)) {
    if (['totalHtmlPages', 'indexablePages', 'gamePages', 'blogPages', 'pagesWithAdSense', 'noindexPages'].includes(key)) continue;
    if (value > 0) failures.push(`${key}: ${value}`);
  }

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    failures,
    samples: {
      placeholderPublisherIds: [...new Set(placeholderPublisherIds)].slice(0, 50),
      missingTitles: indexable.filter((page) => !page.title).map((page) => page.file).slice(0, 50),
      duplicateTitles: duplicateTitles.map((page) => ({ file: page.file, title: page.title })).slice(0, 50),
      missingDescriptions: indexable.filter((page) => !page.metaDescription).map((page) => page.file).slice(0, 50),
      missingCanonicals: indexable.filter((page) => !page.canonical).map((page) => page.file).slice(0, 50),
      multipleH1: indexable.filter((page) => page.h1Count > 1).map((page) => page.file).slice(0, 50),
      brokenInternalLinks: brokenLinks.slice(0, 80),
      missingLocalAssets: missingAssets.slice(0, 80),
      missingSitemapUrls: missingSitemapUrls.slice(0, 80),
      noncanonicalSitemapUrls: noncanonicalSitemapUrls.slice(0, 80),
      blogTopicMismatches: blogTopicMismatches.map((page) => page.file).slice(0, 80),
      duplicateAdSenseTags: pages.filter((page) => page.adsenseLoaderCount > 1).map((page) => page.file).slice(0, 50),
      duplicateAnalyticsTags: pages.filter((page) => page.googleAnalyticsCount !== 1 || page.googleAnalyticsConfigCount !== 1).map((page) => page.file).slice(0, 50)
    },
    pages
  };
}

function writeReports(result) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'adsense-readiness-report.json'), `${JSON.stringify(result, null, 2)}\n`);
  const lines = [
    '# AdSense Readiness Report',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    '## Metrics',
    ''
  ];
  for (const [key, value] of Object.entries(result.metrics)) lines.push(`- ${key}: ${value}`);
  lines.push('', '## Result', '', result.failures.length ? 'Critical checks failed:' : 'All critical automated checks passed.');
  for (const failure of result.failures) lines.push(`- ${failure}`);
  lines.push('', '## Owner Actions', '', '- Replace the supplied placeholder-style AdSense publisher value with the real numeric publisher ID before live submission.', '- Complete Google identity, domain, and consent requirements in Google tools.');
  fs.writeFileSync(path.join(reportDir, 'adsense-readiness-report.md'), `${lines.join('\n')}\n`);
}

if (require.main === module) {
  const result = analyze();
  writeReports(result);
  console.log(JSON.stringify(result.metrics, null, 2));
  if (result.failures.length) {
    console.error('\nCritical audit failures:');
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exit(1);
  }
}

module.exports = { analyze, inventory };
