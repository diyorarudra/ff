const fs = require('fs');
const path = require('path');
const {
  SITE_ORIGIN,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_CLIENT_ID,
  ADSENSE_CONFIGURED,
  VALID_PUBLISHER_ID_PATTERN,
  VALID_CLIENT_ID_PATTERN,
  MANUAL_SIDEBAR_ADS_ENABLED,
  ADSENSE_LEFT_SIDEBAR_SLOT_ID,
  ADSENSE_RIGHT_SIDEBAR_SLOT_ID,
  LEFT_SIDEBAR_SLOT_VALID,
  RIGHT_SIDEBAR_SLOT_VALID,
  MANUAL_SIDEBAR_ADS_CONFIGURED,
  GA_MEASUREMENT_ID
} = require('./site-config');
const { validate: validateJavaScriptSyntax } = require('./validate-javascript-syntax');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'reports');
const PLACEHOLDER_PUBLISHER_ID = ['pub', 'PASTE_REAL_16_DIGIT_ID_HERE'].join('-');
const PLACEHOLDER_CLIENT_ID = `ca-${PLACEHOLDER_PUBLISHER_ID}`;

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

function isAdSenseExcluded(file, html) {
  const lower = file.toLowerCase();
  return (
    lower === '404.html' ||
    lower === 'play.html' ||
    lower.startsWith('play-fallback-disabled/') ||
    lower.includes('privacy') ||
    lower.includes('terms') ||
    lower.includes('contact') ||
    lower.startsWith('compliance/') ||
    lower.includes('error') ||
    isNoindex(html) ||
    /data-adsense-eligible=["']false["']/i.test(html)
  );
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
    const leftSidebarCount = (html.match(/data-manual-sidebar-ad=["']left["']/gi) || []).length;
    const rightSidebarCount = (html.match(/data-manual-sidebar-ad=["']right["']/gi) || []).length;
    const visibleSidebarCount = (html.match(/<aside\b(?=[^>]*data-manual-sidebar-ad=["'](?:left|right)["'])(?![^>]*\bhidden\b)[^>]*>/gi) || []).length;
    const hiddenSidebarCount = (html.match(/<aside\b(?=[^>]*data-manual-sidebar-ad=["'](?:left|right)["'])(?=[^>]*\bhidden\b)[^>]*>/gi) || []).length;
    const sidebarUnitCount = (html.match(/<aside\b[^>]*data-manual-sidebar-ad=["'](?:left|right)["'][\s\S]*?<ins\b[^>]*class=["'][^"']*adsbygoogle/gi) || []).length;
    const sidebarBlankWhiteContainerCount = (html.match(/<aside\b(?=[^>]*data-manual-sidebar-ad=["'](?:left|right)["'])(?=[^>]*(?:bg-white|background:\s*#fff|background:\s*white|Advertisement))[\s\S]*?<\/aside>/gi) || []).length;
    const sidebarLayoutReservationCount = /<div\b[^>]*class=["'][^"']*\bmanual-sidebar-ads-active\b[^"']*["'][^>]*>/i.test(html) ? 1 : 0;
    const googleAdsenseAccountCount = (html.match(/<meta\b[^>]*name=["']google-adsense-account["'][^>]*>/gi) || []).length;
    const publisherIds = allMatches(html, /\b(pub-\d{16}|pub-[A-Z0-9_]+)\b/g);
    const clientIds = allMatches(html, /\b(ca-pub-\d{16}|ca-pub-[A-Z0-9_]+)\b/g);
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
      leftSidebarCount,
      rightSidebarCount,
      visibleSidebarCount,
      hiddenSidebarCount,
      sidebarUnitCount,
      sidebarBlankWhiteContainerCount,
      sidebarLayoutReservationCount,
      googleAdsenseAccountCount,
      googleAnalyticsCount: gaLoaderCount,
      googleAnalyticsConfigCount: gaConfigCount,
      publisherIds,
      clientIds,
      jsonLdTypes,
      noindex: isNoindex(html),
      adsenseExcluded: isAdSenseExcluded(file, html),
      inSitemap: sitemapSet.has(canonicalTags[0] || expectedCanonical(file))
    });
  }

  return { pages, sitemapUrls, brokenLinks, missingAssets };
}

function countInFile(file, pattern) {
  if (!fs.existsSync(file)) return 0;
  return (fs.readFileSync(file, 'utf8').match(pattern) || []).length;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toTitleCase(str) {
  return str
    .split('-')
    .map((word) => word.toLowerCase() === '3d' ? '3D' : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseJsonLdBlocks(html) {
  const blocks = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      blocks.push(null);
    }
  }
  return blocks;
}

function jsonLdTypes(data) {
  const nodes = Array.isArray(data) ? data : [data];
  return nodes.flatMap((node) => {
    if (!node || !node['@type']) return [];
    return Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
  });
}

function gameMetadataMismatch(page) {
  if (page.pageType !== 'game') return false;
  const slug = page.file.split('/')[1];
  const gameName = toTitleCase(slug);
  const html = fs.readFileSync(path.join(root, page.file), 'utf8');
  const keywords = firstMatch(html, /<meta\s+name=["']keywords["'][^>]*content=["']([^"']*)/i);
  const ogTitle = firstMatch(html, /<meta\s+property=["']og:title["'][^>]*content=["']([^"']*)/i);
  const twitterTitle = firstMatch(html, /<meta\s+name=["']twitter:title["'][^>]*content=["']([^"']*)/i);
  const jsonGame = parseJsonLdBlocks(html).find((block) => jsonLdTypes(block).includes('VideoGame'));
  const jsonName = jsonGame && jsonGame.name ? String(jsonGame.name) : '';
  const haystack = `${page.title} ${page.metaDescription} ${keywords} ${ogTitle} ${twitterTitle} ${jsonName}`.toLowerCase();
  return !haystack.includes(gameName.toLowerCase());
}

function blogSchemaMissing(page, type) {
  if (page.pageType !== 'blog-post') return false;
  if (type === 'breadcrumb') return !page.jsonLdTypes.includes('BreadcrumbList');
  return !(page.jsonLdTypes.includes('BlogPosting') || page.jsonLdTypes.includes('Article'));
}

function faviconOversizedAssets() {
  const files = ['assets/favicon.png', 'favicon.ico', 'favicon.png'];
  return files
    .map((file) => ({ file, bytes: fs.existsSync(path.join(root, file)) ? fs.statSync(path.join(root, file)).size : 0 }))
    .filter((item) => item.bytes > 100 * 1024 || item.bytes === 0);
}

function iconOnlyControlsWithoutName() {
  const files = walk(root).filter((file) => /\.(?:html|js)$/i.test(file));
  const offenders = [];
  const buttonRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(buttonRe)) {
      const attrs = match[1] || '';
      const body = match[2].replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, '').trim();
      const hasName = /\b(?:aria-label|aria-labelledby|title)\s*=/i.test(attrs);
      const hasUsefulText = /[A-Za-z0-9]/.test(body);
      if (!hasName && !hasUsefulText) offenders.push(rel(file));
    }
  }
  return [...new Set(offenders)];
}

function countPublisherPlaceholderInSourceConfig(file) {
  if (!fs.existsSync(file)) return 0;
  const source = fs.readFileSync(file, 'utf8');
  const placeholderPattern = new RegExp(`ADSENSE_PUBLISHER_ID[\\s\\S]*?${escapeRegex(PLACEHOLDER_PUBLISHER_ID)}`);
  return (source.match(placeholderPattern) || []).length;
}

function analyze(options = {}) {
  const { pages, sitemapUrls, brokenLinks, missingAssets } = inventory();
  const jsSyntax = validateJavaScriptSyntax(root);
  const indexable = pages.filter((page) => !page.noindex && page.pageType !== 'error' && page.pageType !== 'player');
  const eligiblePages = pages.filter((page) => !page.adsenseExcluded);
  const titleCounts = new Map();
  for (const page of indexable) titleCounts.set(page.title, (titleCounts.get(page.title) || 0) + 1);
  const duplicateTitles = indexable.filter((page) => page.title && titleCounts.get(page.title) > 1);
  const sourceConfig = path.join(root, 'scripts', 'site-config.js');
  const allTextFiles = walk(root).filter((file) => /\.(html|js|mjs|json|xml|txt|css)$/i.test(file));
  const developmentUrls = [];
  for (const file of allTextFiles) {
    if (rel(file).startsWith('scripts/')) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (/(file:\/\/|[A-Z]:\\[\\/])/i.test(text)) developmentUrls.push(rel(file));
  }

  const expectedSitemapUrls = new Set(indexable.map((page) => page.canonical || page.url));
  const missingSitemapUrls = [...expectedSitemapUrls].filter((url) => !sitemapUrls.includes(url));
  const noncanonicalSitemapUrls = sitemapUrls.filter((url) => !expectedSitemapUrls.has(url));
  const blogTopicMismatches = indexable.filter((page) => page.pageType === 'blog-post').filter((page) => {
    const slugWords = path.basename(page.file, '.html').split('-').filter((word) => word.length > 2);
    const haystack = `${page.title} ${page.metaDescription}`.toLowerCase();
    return slugWords.slice(0, 3).filter((word) => haystack.includes(word)).length < Math.min(2, slugWords.length);
  });

  const adsTxtPath = path.join(root, 'ads.txt');
  const adsTxt = fs.existsSync(adsTxtPath) ? fs.readFileSync(adsTxtPath, 'utf8') : '';
  const adsTxtPublisher = firstMatch(adsTxt, /google\.com,\s*(pub-[^,\s]+)/i);
  const adsTxtPlaceholderSellerLines = (adsTxt.match(/google\.com,\s*(?:pub-PASTE|pub-[A-Z0-9_]+)/gi) || []).length;
  const adsTxtMissingFinalNewline = adsTxt && !adsTxt.endsWith('\n') ? 1 : 0;
  const adsTxtPendingCommentValid = ADSENSE_CONFIGURED ? 0 : (adsTxt === '# Google AdSense publisher ID has not been configured yet.\n' ? 0 : 1);
  const placeholderInProductionHtml = pages.reduce((sum, page) => {
    const ids = [...page.publisherIds, ...page.clientIds].filter((id) => id === PLACEHOLDER_PUBLISHER_ID || id === PLACEHOLDER_CLIENT_ID);
    return sum + ids.length;
  }, 0);
  const invalidPublisherIds = ADSENSE_PUBLISHER_ID === PLACEHOLDER_PUBLISHER_ID
    ? 0
    : (VALID_PUBLISHER_ID_PATTERN.test(ADSENSE_PUBLISHER_ID) ? 0 : 1);
  const invalidClientIds = ADSENSE_CONFIGURED
    ? (VALID_CLIENT_ID_PATTERN.test(ADSENSE_CLIENT_ID) ? 0 : 1)
    : 0;
  const publisherIdMismatches = ADSENSE_CONFIGURED
    ? pages.reduce((sum, page) => sum + page.publisherIds.filter((id) => id !== ADSENSE_PUBLISHER_ID).length + page.clientIds.filter((id) => id !== ADSENSE_CLIENT_ID).length, 0)
    : pages.reduce((sum, page) => sum + page.publisherIds.length + page.clientIds.length, 0);
  const adsTxtPublisherMismatch = ADSENSE_CONFIGURED
    ? (adsTxtPublisher === ADSENSE_PUBLISHER_ID ? 0 : 1)
    : (adsTxtPublisher ? 1 : 0);
  const duplicateAdSenseTags = pages.filter((page) => page.adsenseLoaderCount > 1).length;
  const manualAdUnits = pages.reduce((sum, page) => sum + page.manualAdUnitCount, 0);
  const adsenseScriptsOnExcludedPages = pages.filter((page) => page.adsenseExcluded && page.adsenseLoaderCount > 0).length;
  const eligiblePagesWithLoader = eligiblePages.filter((page) => page.adsenseLoaderCount === 1).length;
  const eligiblePagesMissingLoader = ADSENSE_CONFIGURED ? eligiblePages.filter((page) => page.adsenseLoaderCount === 0).length : 0;
  const invalidAdSenseLoaders = ADSENSE_CONFIGURED
    ? eligiblePages.filter((page) => page.adsenseLoaderCount === 1 && !page.clientIds.includes(ADSENSE_CLIENT_ID)).length
    : pages.filter((page) => page.adsenseLoaderCount > 0).length;
  const gamePages = pages.filter((page) => page.pageType === 'game');
  const excludedPages = pages.filter((page) => page.pageType !== 'game');
  const gamePagesWithSidebarMarkup = gamePages.filter((page) => page.leftSidebarCount === 1 && page.rightSidebarCount === 1).length;
  const gamePagesWithVisibleSidebarAds = gamePages.filter((page) => page.visibleSidebarCount > 0 || page.sidebarUnitCount > 0).length;
  const gamePagesWithHiddenSidebarAds = gamePages.filter((page) => page.hiddenSidebarCount === 2 && page.sidebarUnitCount === 0).length;
  const gamePagesWithMissingSidebarMarkup = gamePages.filter((page) => page.leftSidebarCount !== 1 || page.rightSidebarCount !== 1).length;
  const gamePagesWithUnexpectedManualAds = MANUAL_SIDEBAR_ADS_CONFIGURED
    ? gamePages.filter((page) => page.sidebarUnitCount !== 2 || page.leftSidebarCount !== 1 || page.rightSidebarCount !== 1).length
    : gamePages.filter((page) => page.sidebarUnitCount > 0 || page.visibleSidebarCount > 0).length;
  const manualSidebarAdsOnExcludedPages = excludedPages.filter((page) => page.leftSidebarCount > 0 || page.rightSidebarCount > 0 || page.sidebarUnitCount > 0).length;
  const manualSidebarDuplicateUnits = gamePages.filter((page) => page.sidebarUnitCount > 2 || page.leftSidebarCount > 1 || page.rightSidebarCount > 1).length;
  const manualSidebarLayoutReservationWhileDisabled = MANUAL_SIDEBAR_ADS_CONFIGURED ? 0 : gamePages.reduce((sum, page) => sum + page.sidebarLayoutReservationCount, 0);
  const manualSidebarBlankWhiteContainers = pages.reduce((sum, page) => sum + page.sidebarBlankWhiteContainerCount, 0);
  const gameMetadataTopicMismatches = gamePages.filter(gameMetadataMismatch);
  const blogPostsMissingBreadcrumbSchema = pages.filter((page) => blogSchemaMissing(page, 'breadcrumb'));
  const blogPostsMissingArticleSchema = pages.filter((page) => blogSchemaMissing(page, 'article'));
  const oversizedFavicons = faviconOversizedAssets();
  const iconOnlyControls = iconOnlyControlsWithoutName();
  const bridgeCorruption = walk(root).filter((file) => file.endsWith('.html')).filter((file) => {
    const html = fs.readFileSync(file, 'utf8');
    return /INJECTED (?:REWARD|MILESTONE) BRIDGE|Injected Progressive Difficulty Modifiers|score\s*\+=\s*f\s*\r?\n[\s\S]{0,140}\.type\.points|ffCheckScoreMilestone[^\n]*\r?\n\s*[*/]\s*\d+/i.test(html);
  }).map(rel);

  const metrics = {
    totalHtmlPages: pages.length,
    indexablePages: indexable.length,
    gamePages: gamePages.length,
    blogPages: pages.filter((page) => page.pageType === 'blog-post').length,
    pagesWithAdSense: pages.filter((page) => page.adsenseLoaderCount > 0).length,
    pagesWithManualAdUnits: pages.filter((page) => page.manualAdUnitCount > 0).length,
    adsenseConfigurationStatus: ADSENSE_CONFIGURED ? 'CONFIGURED' : 'PENDING_REAL_PUBLISHER_ID',
    adsenseSubmissionReady: false,
    invalidPublisherIds,
    invalidClientIds,
    placeholderPublisherIdsInSourceConfig: countPublisherPlaceholderInSourceConfig(sourceConfig),
    placeholderPublisherIdsInProductionHtml: placeholderInProductionHtml,
    publisherIdMismatches,
    adsTxtPublisherMismatch,
    adsTxtPlaceholderSellerLines,
    adsTxtMissingFinalNewline,
    adsTxtPendingCommentInvalid: adsTxtPendingCommentValid,
    duplicateAdSenseTags,
    manualAdUnits,
    adsenseScriptsOnExcludedPages,
    eligiblePagesWithLoader,
    eligiblePagesMissingLoader,
    invalidAdSenseLoaders,
    manualSidebarAdsEnabled: MANUAL_SIDEBAR_ADS_ENABLED,
    manualSidebarAdsConfigured: MANUAL_SIDEBAR_ADS_CONFIGURED,
    manualSidebarLeftSlotValid: LEFT_SIDEBAR_SLOT_VALID,
    manualSidebarRightSlotValid: RIGHT_SIDEBAR_SLOT_VALID,
    gamePagesWithSidebarMarkup,
    gamePagesWithVisibleSidebarAds,
    gamePagesWithHiddenSidebarAds,
    gamePagesWithMissingSidebarMarkup,
    gamePagesWithUnexpectedManualAds,
    manualSidebarAdsOnExcludedPages,
    manualSidebarDuplicateUnits,
    manualSidebarLayoutReservationWhileDisabled,
    manualSidebarBlankWhiteContainers,
    inlineJavaScriptSyntaxErrors: jsSyntax.inlineErrors.length,
    localJavaScriptSyntaxErrors: jsSyntax.localErrors.length,
    rewardBridgeGenerationCorruption: bridgeCorruption.length,
    gameMetadataTopicMismatches: gameMetadataTopicMismatches.length,
    blogPostsMissingBreadcrumbSchema: blogPostsMissingBreadcrumbSchema.length,
    blogPostsMissingArticleSchema: blogPostsMissingArticleSchema.length,
    oversizedFaviconAssets: oversizedFavicons.length,
    iconOnlyControlsWithoutAccessibleName: iconOnlyControls.length,
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
    developmentUrls: [...new Set(developmentUrls)].length,
    jsonLdSyntaxErrors: pages.filter((page) => page.jsonLdTypes.includes('INVALID_JSON_LD')).length,
    indexable404Pages: pages.filter((page) => page.pageType === 'error' && !page.noindex).length,
    indexablePlayerPages: pages.filter((page) => page.pageType === 'player' && !page.noindex).length,
    ownerActionRequired: ADSENSE_CONFIGURED ? '' : 'Add the real AdSense publisher ID to scripts/site-config.js and rebuild.'
  };

  const zeroRequired = [
    'invalidPublisherIds',
    'invalidClientIds',
    'placeholderPublisherIdsInProductionHtml',
    'publisherIdMismatches',
    'adsTxtPublisherMismatch',
    'adsTxtPlaceholderSellerLines',
    'adsTxtMissingFinalNewline',
    'adsTxtPendingCommentInvalid',
    'duplicateAdSenseTags',
    'manualAdUnits',
    'adsenseScriptsOnExcludedPages',
    'eligiblePagesMissingLoader',
    'invalidAdSenseLoaders',
    'gamePagesWithMissingSidebarMarkup',
    'gamePagesWithUnexpectedManualAds',
    'manualSidebarAdsOnExcludedPages',
    'manualSidebarDuplicateUnits',
    'manualSidebarLayoutReservationWhileDisabled',
    'manualSidebarBlankWhiteContainers',
    'inlineJavaScriptSyntaxErrors',
    'localJavaScriptSyntaxErrors',
    'rewardBridgeGenerationCorruption',
    'gameMetadataTopicMismatches',
    'blogPostsMissingBreadcrumbSchema',
    'blogPostsMissingArticleSchema',
    'oversizedFaviconAssets',
    'iconOnlyControlsWithoutAccessibleName',
    'pagesWithManualAdUnits',
    'missingTitles',
    'duplicateTitles',
    'missingDescriptions',
    'missingCanonicals',
    'multipleCanonicals',
    'missingH1',
    'multipleH1',
    'brokenInternalLinks',
    'missingLocalAssets',
    'missingSitemapUrls',
    'noncanonicalSitemapUrls',
    'blogTopicMismatches',
    'duplicateAnalyticsTags',
    'developmentUrls',
    'jsonLdSyntaxErrors',
    'indexable404Pages',
    'indexablePlayerPages'
  ];
  const failures = [];
  for (const key of zeroRequired) {
    if (metrics[key] > 0) failures.push(`${key}: ${metrics[key]}`);
  }
  if (ADSENSE_CONFIGURED && metrics.eligiblePagesWithLoader !== eligiblePages.length) {
    failures.push(`eligiblePagesWithLoader: ${metrics.eligiblePagesWithLoader}/${eligiblePages.length}`);
  }
  if (MANUAL_SIDEBAR_ADS_CONFIGURED) {
    const badSidebarUnits = gamePages.filter((page) => {
      const html = fs.readFileSync(path.join(root, page.file), 'utf8');
      const leftOk = new RegExp(`data-manual-sidebar-ad=["']left["'][\\s\\S]*data-ad-client=["']${ADSENSE_CLIENT_ID}["'][\\s\\S]*data-ad-slot=["']${ADSENSE_LEFT_SIDEBAR_SLOT_ID}["']`, 'i').test(html);
      const rightOk = new RegExp(`data-manual-sidebar-ad=["']right["'][\\s\\S]*data-ad-client=["']${ADSENSE_CLIENT_ID}["'][\\s\\S]*data-ad-slot=["']${ADSENSE_RIGHT_SIDEBAR_SLOT_ID}["']`, 'i').test(html);
      return page.sidebarUnitCount !== 2 || !leftOk || !rightOk || page.adsenseLoaderCount !== 1;
    }).length;
    if (badSidebarUnits > 0) failures.push(`manualSidebarInvalidConfiguredUnits: ${badSidebarUnits}`);
  }
  if (MANUAL_SIDEBAR_ADS_ENABLED && !MANUAL_SIDEBAR_ADS_CONFIGURED && options.requireRealId) {
    failures.push('Manual sidebar ads were requested but are not fully configured.');
  }
  if (options.requireRealId && !ADSENSE_CONFIGURED) {
    failures.push('A real Google AdSense publisher ID is required.');
  }
  metrics.adsenseSubmissionReady = ADSENSE_CONFIGURED && failures.length === 0;

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    failures,
    samples: {
      duplicateTitles: duplicateTitles.map((page) => ({ file: page.file, title: page.title })).slice(0, 50),
      brokenInternalLinks: brokenLinks.slice(0, 80),
      missingLocalAssets: missingAssets.slice(0, 80),
      missingSitemapUrls: missingSitemapUrls.slice(0, 80),
      noncanonicalSitemapUrls: noncanonicalSitemapUrls.slice(0, 80),
      blogTopicMismatches: blogTopicMismatches.map((page) => page.file).slice(0, 80),
      gameMetadataTopicMismatches: gameMetadataTopicMismatches.map((page) => page.file).slice(0, 80),
      blogPostsMissingBreadcrumbSchema: blogPostsMissingBreadcrumbSchema.map((page) => page.file).slice(0, 80),
      blogPostsMissingArticleSchema: blogPostsMissingArticleSchema.map((page) => page.file).slice(0, 80),
      oversizedFaviconAssets: oversizedFavicons,
      iconOnlyControlsWithoutAccessibleName: iconOnlyControls.slice(0, 80),
      inlineJavaScriptSyntaxErrors: jsSyntax.inlineErrors.slice(0, 80),
      localJavaScriptSyntaxErrors: jsSyntax.localErrors.slice(0, 80),
      rewardBridgeGenerationCorruption: bridgeCorruption.slice(0, 80),
      duplicateAdSenseTags: pages.filter((page) => page.adsenseLoaderCount > 1).map((page) => page.file).slice(0, 50),
      adsenseScriptsOnExcludedPages: pages.filter((page) => page.adsenseExcluded && page.adsenseLoaderCount > 0).map((page) => page.file).slice(0, 50),
      eligiblePagesMissingLoader: ADSENSE_CONFIGURED ? eligiblePages.filter((page) => page.adsenseLoaderCount === 0).map((page) => page.file).slice(0, 50) : [],
      duplicateAnalyticsTags: pages.filter((page) => page.googleAnalyticsCount !== 1 || page.googleAnalyticsConfigCount !== 1).map((page) => page.file).slice(0, 50),
      gamePagesWithMissingSidebarMarkup: gamePages.filter((page) => page.leftSidebarCount !== 1 || page.rightSidebarCount !== 1).map((page) => page.file).slice(0, 50),
      gamePagesWithUnexpectedManualAds: gamePages.filter((page) => page.sidebarUnitCount > 0 || page.visibleSidebarCount > 0).map((page) => page.file).slice(0, 50),
      manualSidebarAdsOnExcludedPages: excludedPages.filter((page) => page.leftSidebarCount > 0 || page.rightSidebarCount > 0 || page.sidebarUnitCount > 0).map((page) => page.file).slice(0, 50),
      manualSidebarBlankWhiteContainers: pages.filter((page) => page.sidebarBlankWhiteContainerCount > 0).map((page) => page.file).slice(0, 50)
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
  lines.push(
    '',
    '## Result',
    '',
    result.failures.length ? 'Critical checks failed:' : 'All critical automated checks passed.',
    ''
  );
  for (const failure of result.failures) lines.push(`- ${failure}`);
  lines.push(
    '',
    '## Future One-Place Replacement',
    '',
    'FFLivePlay uses scripts/site-config.js as the only AdSense configuration source.',
    '',
    '1. Open scripts/site-config.js.',
    '2. Replace the placeholder publisher ID with the real ID.',
    '3. Set MANUAL_SIDEBAR_ADS_ENABLED to true.',
    '4. Add the real left sidebar slot ID.',
    '5. Add the real right sidebar slot ID.',
    '6. Do not manually add ca-pub; it is generated automatically.',
    '7. Run npm run postbuild.',
    '8. Run npm run audit:adsense:release.',
    '9. Run npm run build.',
    '10. Deploy.',
    '11. Verify the live ads.txt file.',
    '12. Verify the game-page source.'
  );
  lines.push(
    '',
    '## Manual Sidebar Workflow',
    '',
    '### Keep manual sidebars hidden',
    '',
    'Open scripts/site-config.js, set MANUAL_SIDEBAR_ADS_ENABLED to false, then run npm run postbuild and npm run build before deployment.',
    '',
    '### Enable manual sidebars later',
    '',
    'Open scripts/site-config.js.',
    'Replace the placeholder publisher ID with the real pub- followed by 16 digits.',
    'Set MANUAL_SIDEBAR_ADS_ENABLED to true.',
    'Set ADSENSE_LEFT_SIDEBAR_SLOT_ID to the real left sidebar slot ID.',
    'Set ADSENSE_RIGHT_SIDEBAR_SLOT_ID to the real right sidebar slot ID.',
    'Then run npm run postbuild, npm run audit:adsense:release, and npm run build before deployment.',
    '',
    '### Hide them again',
    '',
    'Open scripts/site-config.js, change only MANUAL_SIDEBAR_ADS_ENABLED to false, then rebuild and deploy. Do not delete the reusable sidebar markup.'
  );
  fs.writeFileSync(path.join(reportDir, 'adsense-readiness-report.md'), `${lines.join('\n')}\n`);
}

if (require.main === module) {
  const requireRealId = process.argv.includes('--require-real-id');
  const result = analyze({ requireRealId });
  writeReports(result);
  console.log(JSON.stringify(result.metrics, null, 2));
  if (result.failures.length) {
    if (requireRealId && !ADSENSE_CONFIGURED) {
      console.error('\nAdSense release audit failed:');
      console.error('A real Google AdSense publisher ID is required.');
      console.error('Update scripts/site-config.js with pub- followed by 16 digits and rebuild.');
    } else {
      console.error('\nCritical audit failures:');
      for (const failure of result.failures) console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

module.exports = { analyze, inventory, isAdSenseExcluded };
