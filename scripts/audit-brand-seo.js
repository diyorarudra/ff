const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'reports');
const SITE_ORIGIN = 'https://www.ffliveplay.com';
const PRIMARY = 'FFLivePlay';
const ALTERNATE = 'FF Live Play';

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

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function first(html, re) {
  const match = html.match(re);
  return match ? match[1].trim() : '';
}

function all(re, text) {
  return [...text.matchAll(re)].map((match) => match[1] || match[0]);
}

function htmlFiles() {
  return walk(root).filter((file) => file.endsWith('.html')).map(rel).sort();
}

function parseJsonLd(html, file, errors) {
  const blocks = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (error) {
      errors.push(`${file}: invalid JSON-LD: ${error.message}`);
    }
  }
  return blocks;
}

function nodesOfType(blocks, type) {
  const nodes = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (Array.isArray(node['@graph'])) node['@graph'].forEach(visit);
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    if (types.includes(type)) nodes.push(node);
  }
  blocks.forEach(visit);
  return nodes;
}

function stripScriptsAndStyles(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
}

function visiblePlainText(html) {
  return stripScriptsAndStyles(html)
    .replace(/https?:\/\/(?:www\.)?ffliveplay\.com\/?[^\s"'<>]*/gi, ' ')
    .replace(/\bffliveplay\.com\/?[^\s"'<>]*/gi, ' ')
    .replace(/\bffliveplay@gmail\.com\b/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\bhttps?\s+www\s+ffliveplay\s+com\b/gi, ' ')
    .replace(/\bffliveplay\s+com\b/gi, ' ')
    .replace(/\bffliveplay\s+gmail\s+com\b/gi, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pngSize(file) {
  if (!fs.existsSync(file)) return null;
  const b = fs.readFileSync(file);
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), bytes: b.length };
}

function faviconRefs(html) {
  return all(/<link\b(?=[^>]*\brel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi, html);
}

function localPathFromUrl(url) {
  const clean = url.replace(/^https?:\/\/www\.ffliveplay\.com/i, '').split(/[?#]/)[0];
  if (!clean.startsWith('/')) return null;
  return path.join(root, clean.replace(/^\/+/, ''));
}

function analyze() {
  const files = htmlFiles();
  const pages = [];
  const errors = [];
  const allText = walk(root)
    .filter((file) => /\.(?:html|js|json|xml|txt|css)$/i.test(file))
    .map(read)
    .join('\n');
  const index = read(path.join(root, 'index.html'));
  const homepageBlocks = parseJsonLd(index, 'index.html', errors);
  const websiteNodes = nodesOfType(homepageBlocks, 'WebSite');
  const orgNodes = nodesOfType(homepageBlocks, 'Organization');
  const visibleText = visiblePlainText(files.map((file) => read(path.join(root, file))).join('\n'));
  const homepageVisibleText = visiblePlainText(index.replace(/<head[\s\S]*?<\/head>/i, ''));
  const inconsistentMatches = all(/\b(?:FFliveplay|FFlivePlay|FF LivePlay|Ff Live Play)\b/g, visibleText);
  const lowercaseVisibleBrand = all(/\bffliveplay\b(?!\.com|@gmail\.com)/g, visibleText);
  const canonicalHostMismatches = [];
  const brokenFaviconRefs = [];
  const hiddenBrandKeywordText = [];
  const primaryTitlePages = [];
  const spacedPrimaryTitlePages = [];
  const publisherEntityReferenceMismatches = [];
  const schemaEntityIdMismatches = [];
  const faviconSet = new Set();

  for (const file of files) {
    const html = read(path.join(root, file));
    const title = first(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const canonical = first(html, /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i);
    const ogUrl = first(html, /<meta\s+property=["']og:url["'][^>]*content=["']([^"']+)/i);
    const blocks = parseJsonLd(html, file, errors);
    if (title.includes(PRIMARY)) primaryTitlePages.push(file);
    if (/\|\s*FF Live Play$|-\s*FF Live Play$/i.test(title)) spacedPrimaryTitlePages.push(file);
    for (const url of [canonical, ogUrl].filter(Boolean)) {
      if (/^https?:\/\/ffliveplay\.com\b/i.test(url) || /^http:\/\//i.test(url)) canonicalHostMismatches.push({ file, url });
    }
    for (const ref of faviconRefs(html)) {
      faviconSet.add(ref);
      const local = localPathFromUrl(ref);
      if (local && !fs.existsSync(local)) brokenFaviconRefs.push({ file, ref });
    }
    for (const node of [...nodesOfType(blocks, 'BlogPosting'), ...nodesOfType(blocks, 'Article')]) {
      if (node.publisher && node.publisher['@id'] !== `${SITE_ORIGIN}/#organization`) publisherEntityReferenceMismatches.push(file);
      if (node.isPartOf && node.isPartOf['@id'] !== `${SITE_ORIGIN}/#website`) schemaEntityIdMismatches.push(file);
    }
    for (const node of nodesOfType(blocks, 'VideoGame')) {
      if (node.publisher && node.publisher['@id'] && node.publisher['@id'] !== `${SITE_ORIGIN}/#organization`) publisherEntityReferenceMismatches.push(file);
    }
    if (/(display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0|left\s*:\s*-9999px)[^<]{0,200}(FFLivePlay|FF Live Play)/i.test(html)) {
      hiddenBrandKeywordText.push(file);
    }
    pages.push({ file, title });
  }

  const faviconFilesValid = [...faviconSet].every((ref) => {
    const local = localPathFromUrl(ref);
    if (!local || !fs.existsSync(local)) return false;
    if (/\.png$/i.test(local)) {
      const size = pngSize(local);
      return size && size.width === size.height && (size.width % 48 === 0 || size.width === 180) && size.bytes < 100 * 1024;
    }
    return /\.(?:ico|png)$/i.test(local) && fs.statSync(local).size < 100 * 1024;
  });
  const crawlable48Favicon = [...faviconSet].some((ref) => {
    const local = localPathFromUrl(ref);
    const size = local && /\.png$/i.test(local) ? pngSize(local) : null;
    return size && size.width === size.height && size.width % 48 === 0;
  });

  const metrics = {
    primaryBrandOccurrences: (allText.match(/\bFFLivePlay\b/g) || []).length,
    alternateBrandOccurrences: (allText.match(/\bFF Live Play\b/g) || []).length,
    inconsistentBrandOccurrences: inconsistentMatches.length + lowercaseVisibleBrand.length,
    homepageTitle: first(index, /<title[^>]*>([\s\S]*?)<\/title>/i),
    homepageTitleContainsPrimaryBrand: first(index, /<title[^>]*>([\s\S]*?)<\/title>/i).includes(PRIMARY),
    homepageTitleContainsAlternateBrand: first(index, /<title[^>]*>([\s\S]*?)<\/title>/i).includes(ALTERNATE),
    homepageDescriptionContainsPrimaryBrand: first(index, /<meta\s+name=["']description["'][^>]*content=["']([^"']*)/i).includes(PRIMARY),
    homepageDescriptionContainsAlternateBrand: first(index, /<meta\s+name=["']description["'][^>]*content=["']([^"']*)/i).includes(ALTERNATE),
    websiteSchemaCount: websiteNodes.length,
    websiteSchemaName: websiteNodes[0] && websiteNodes[0].name || '',
    websiteSchemaAlternateName: websiteNodes[0] && websiteNodes[0].alternateName || '',
    organizationSchemaCount: orgNodes.length,
    organizationSchemaName: orgNodes[0] && orgNodes[0].name || '',
    organizationSchemaAlternateName: orgNodes[0] && orgNodes[0].alternateName || '',
    ogSiteName: first(index, /<meta\s+property=["']og:site_name["'][^>]*content=["']([^"']*)/i),
    manifestName: '',
    manifestShortName: '',
    pagesWithPrimaryBrandTitle: primaryTitlePages.length,
    pagesWithSpacedBrandAsPrimaryTitle: spacedPrimaryTitlePages.length,
    pagesWithLowercaseVisibleBrand: lowercaseVisibleBrand.length,
    inconsistentBrandVariants: inconsistentMatches.length,
    duplicateWebsiteSchemas: Math.max(0, websiteNodes.length - 1),
    duplicateOrganizationSchemas: Math.max(0, orgNodes.length - 1),
    schemaEntityIdMismatches: schemaEntityIdMismatches.length,
    publisherEntityReferenceMismatches: [...new Set(publisherEntityReferenceMismatches)].length,
    canonicalHostMismatches: canonicalHostMismatches.length,
    faviconDeclarationCount: faviconSet.size,
    faviconFilesValid: faviconFilesValid && crawlable48Favicon,
    faviconRobotsBlocked: /Disallow:\s*\/(?:favicon|assets\/favicon)/i.test(read(path.join(root, 'robots.txt'))),
    faviconHttpStatus: faviconFilesValid && crawlable48Favicon ? 'LOCAL_VALID' : 'LOCAL_INVALID',
    sameAsLinks: orgNodes.flatMap((node) => Array.isArray(node.sameAs) ? node.sameAs : []),
    unverifiedSameAsLinks: 0,
    hiddenBrandKeywordText: hiddenBrandKeywordText.length,
    exactMatchBrandStuffingRisk: (homepageVisibleText.match(/FF Live Play/g) || []).length > 1 ? 1 : 0,
    jsonLdSyntaxErrors: errors.length
  };

  const failures = [];
  if (metrics.jsonLdSyntaxErrors) failures.push(`jsonLdSyntaxErrors: ${metrics.jsonLdSyntaxErrors}`);
  if (metrics.websiteSchemaCount !== 1) failures.push(`websiteSchemaCount: ${metrics.websiteSchemaCount}`);
  if (metrics.websiteSchemaName !== PRIMARY) failures.push(`websiteSchemaName: ${metrics.websiteSchemaName}`);
  if (metrics.websiteSchemaAlternateName !== ALTERNATE) failures.push(`websiteSchemaAlternateName: ${metrics.websiteSchemaAlternateName}`);
  if (metrics.organizationSchemaCount !== 1) failures.push(`organizationSchemaCount: ${metrics.organizationSchemaCount}`);
  if (metrics.organizationSchemaName !== PRIMARY) failures.push(`organizationSchemaName: ${metrics.organizationSchemaName}`);
  if (metrics.organizationSchemaAlternateName !== ALTERNATE) failures.push(`organizationSchemaAlternateName: ${metrics.organizationSchemaAlternateName}`);
  if (metrics.ogSiteName !== PRIMARY) failures.push(`ogSiteName: ${metrics.ogSiteName}`);
  if (metrics.pagesWithSpacedBrandAsPrimaryTitle) failures.push(`pagesWithSpacedBrandAsPrimaryTitle: ${metrics.pagesWithSpacedBrandAsPrimaryTitle}`);
  if (metrics.inconsistentBrandVariants) failures.push(`inconsistentBrandVariants: ${metrics.inconsistentBrandVariants}`);
  if (metrics.pagesWithLowercaseVisibleBrand) failures.push(`pagesWithLowercaseVisibleBrand: ${metrics.pagesWithLowercaseVisibleBrand}`);
  if (metrics.duplicateWebsiteSchemas || metrics.duplicateOrganizationSchemas) failures.push('duplicate site entities detected');
  if (metrics.schemaEntityIdMismatches) failures.push(`schemaEntityIdMismatches: ${metrics.schemaEntityIdMismatches}`);
  if (metrics.publisherEntityReferenceMismatches) failures.push(`publisherEntityReferenceMismatches: ${metrics.publisherEntityReferenceMismatches}`);
  if (metrics.canonicalHostMismatches) failures.push(`canonicalHostMismatches: ${metrics.canonicalHostMismatches}`);
  if (!metrics.faviconFilesValid) failures.push('faviconFilesValid: false');
  if (metrics.faviconRobotsBlocked) failures.push('faviconRobotsBlocked: true');
  if (metrics.hiddenBrandKeywordText) failures.push(`hiddenBrandKeywordText: ${metrics.hiddenBrandKeywordText}`);
  if (metrics.exactMatchBrandStuffingRisk) failures.push('exactMatchBrandStuffingRisk: 1');
  if (!metrics.homepageTitleContainsPrimaryBrand || !metrics.homepageTitleContainsAlternateBrand) failures.push('homepage title missing required brand variants');
  if (!metrics.homepageDescriptionContainsPrimaryBrand || !metrics.homepageDescriptionContainsAlternateBrand) failures.push('homepage description missing required brand variants');

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    failures,
    samples: {
      canonicalHostMismatches: canonicalHostMismatches.slice(0, 50),
      brokenFaviconRefs: brokenFaviconRefs.slice(0, 50),
      spacedPrimaryTitlePages: spacedPrimaryTitlePages.slice(0, 80),
      schemaEntityIdMismatches: [...new Set(schemaEntityIdMismatches)].slice(0, 80),
      publisherEntityReferenceMismatches: [...new Set(publisherEntityReferenceMismatches)].slice(0, 80),
      jsonLdSyntaxErrors: errors.slice(0, 20)
    }
  };
}

function writeReports(result) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'brand-seo-audit-report.json'), `${JSON.stringify(result, null, 2)}\n`);
  const lines = ['# Brand SEO Audit Report', '', `Generated: ${result.generatedAt}`, '', '## Metrics', ''];
  for (const [key, value] of Object.entries(result.metrics)) lines.push(`- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
  lines.push('', '## Result', '', result.failures.length ? 'Brand SEO checks failed:' : 'Brand SEO checks passed.');
  for (const failure of result.failures) lines.push(`- ${failure}`);
  fs.writeFileSync(path.join(reportDir, 'brand-seo-audit-report.md'), `${lines.join('\n')}\n`);
}

if (require.main === module) {
  const result = analyze();
  writeReports(result);
  console.log(JSON.stringify(result.metrics, null, 2));
  if (result.failures.length) {
    console.error('\nBrand SEO audit failures:');
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exit(1);
  }
}

module.exports = { analyze };
