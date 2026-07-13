const fs = require('fs');
const path = require('path');
const {
    SITE_ORIGIN,
    ADSENSE_PUBLISHER_ID,
    ADSENSE_CLIENT_ID,
    ADSENSE_CONFIGURED,
    MANUAL_SIDEBAR_ADS_ENABLED,
    ADSENSE_LEFT_SIDEBAR_SLOT_ID,
    ADSENSE_RIGHT_SIDEBAR_SLOT_ID,
    MANUAL_SIDEBAR_ADS_CONFIGURED
} = require('./site-config');

const root = path.join(__dirname, '..');
const gamesDir = path.join(__dirname, '../games');

function toTitleCase(str) {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

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

function isNoindex(html) {
    return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
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

function removeAdSenseArtifacts(html) {
    return html
        .replace(/<script\b[^>]*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*>\s*<\/script>\s*/gi, '')
        .replace(/<script\b[^>]*>\s*\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\([^)]*\);\s*<\/script>\s*/gi, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>\s*/gi, (block) => /adsbygoogle/i.test(block) ? '' : block)
        .replace(/<meta\b[^>]*name=["']google-adsense-account["'][^>]*>\s*/gi, '')
        .replace(/<ins\b[^>]*class=["'][^"']*adsbygoogle[^"']*["'][\s\S]*?<\/ins>\s*/gi, '')
        .replace(/<div\b[^>]*class=["'][^"']*(?:ad-slot|ad-container|adsbygoogle|advertisement|ad-wrapper)[^"']*["'][^>]*>\s*<\/div>\s*/gi, '');
}

function injectAdSenseLoader(html) {
    const loader = `  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}" crossorigin="anonymous"></script>\n`;
    return html.replace(/<\/head>/i, `${loader}</head>`);
}

function findMatchingClose(html, openStart) {
    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = openStart;
    let depth = 0;
    let match;
    while ((match = tagRe.exec(html))) {
        if (match[0].startsWith('</')) depth--;
        else depth++;
        if (depth === 0) return tagRe.lastIndex;
    }
    return -1;
}

function stripManualSidebarShell(html) {
    const layoutRe = /<div\b[^>]*class=["'][^"']*\bgame-page-layout\b[^"']*["'][^>]*>/i;
    const layoutMatch = html.match(layoutRe);
    if (!layoutMatch) return html;
    const layoutStart = layoutMatch.index;
    const layoutOpenEnd = layoutStart + layoutMatch[0].length;
    const layoutEnd = findMatchingClose(html, layoutStart);
    if (layoutEnd < 0) return html;
    const inner = html.slice(layoutOpenEnd, layoutEnd - 6);
    const mainMatch = inner.match(/<main\b[^>]*class=["'][^"']*\bgame-main-column\b[^"']*["'][^>]*>([\s\S]*)<\/main>/i);
    if (!mainMatch) return html;
    return `${html.slice(0, layoutStart)}${mainMatch[1]}${html.slice(layoutEnd)}`;
}

function sidebarStyleBlock() {
    return `<style id="manual-sidebar-ad-styles">
    .game-page-layout {
      display: flex;
      justify-content: center;
      width: 100%;
      max-width: 100%;
      margin-inline: auto;
      position: relative;
    }
    .game-main-column {
      width: min(100%, 1100px);
      margin-inline: auto;
    }
    .manual-ad-sidebar,
    .manual-ad-sidebar[hidden],
    .manual-ad-sidebar:empty {
      display: none !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }
    .manual-ad-sidebar:has(.adsbygoogle[data-ad-status="unfilled"]) {
      display: none !important;
    }
    @media (min-width: 1500px) {
      .manual-sidebar-ads-active .manual-ad-sidebar:not([hidden]) {
        display: block !important;
        position: absolute;
        top: 40px;
        width: 160px;
        min-height: 600px;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        overflow: hidden;
      }
      .manual-sidebar-ads-active .manual-ad-sidebar-left:not([hidden]) {
        right: calc(100% + 24px);
      }
      .manual-sidebar-ads-active .manual-ad-sidebar-right:not([hidden]) {
        left: calc(100% + 24px);
      }
    }
    @media (max-width: 1499px) {
      .manual-ad-sidebar {
        display: none !important;
      }
    }
  </style>`;
}

function sidebarFallbackScript() {
    return `<script id="manual-sidebar-ad-fallback">
    (function() {
      function hideIfUnfilled(node) {
        if (!node || node.getAttribute('data-ad-status') !== 'unfilled') return;
        var sidebar = node.closest && node.closest('.manual-ad-sidebar');
        if (sidebar) {
          sidebar.hidden = true;
          sidebar.setAttribute('aria-hidden', 'true');
        }
      }
      var ads = document.querySelectorAll('.manual-ad-sidebar .adsbygoogle');
      ads.forEach(function(ad) {
        hideIfUnfilled(ad);
        new MutationObserver(function() { hideIfUnfilled(ad); }).observe(ad, {
          attributes: true,
          attributeFilter: ['data-ad-status']
        });
      });
    })();
  </script>`;
}

function manualUnit(side) {
    const slot = side === 'left' ? ADSENSE_LEFT_SIDEBAR_SLOT_ID : ADSENSE_RIGHT_SIDEBAR_SLOT_ID;
    return `<ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT_ID}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="false"></ins>
    <script>(window.adsbygoogle = window.adsbygoogle || []).push({});</script>`;
}

function sidebarAside(side) {
    const hiddenAttrs = MANUAL_SIDEBAR_ADS_CONFIGURED ? 'aria-hidden="false"' : 'hidden aria-hidden="true"';
    const content = MANUAL_SIDEBAR_ADS_CONFIGURED ? `\n    ${manualUnit(side)}\n  ` : '';
    return `<aside class="manual-ad-sidebar manual-ad-sidebar-${side}" data-manual-sidebar-ad="${side}" ${hiddenAttrs}>${content}</aside>`;
}

function normalizeGameSidebarLayout(html) {
    let content = stripManualSidebarShell(html);
    content = content
        .replace(/<style\b[^>]*id=["']manual-sidebar-ad-styles["'][^>]*>[\s\S]*?<\/style>\s*/gi, '')
        .replace(/<script\b[^>]*id=["']manual-sidebar-ad-fallback["'][^>]*>[\s\S]*?<\/script>\s*/gi, '');

    const navEnd = content.search(/<\/nav>/i);
    if (navEnd < 0) return content;
    const afterNav = navEnd + content.match(/<\/nav>/i)[0].length;
    const nextDivMatch = content.slice(afterNav).match(/<div\b[^>]*class=["'][^"']*flex\s+flex-(?:col|row)[^"']*justify-center[^"']*items-start[^"']*w-full[^"']*max-w-7xl[^"']*["'][^>]*>/i);
    if (!nextDivMatch) return content.replace(/<\/head>/i, `${sidebarStyleBlock()}\n</head>`);
    const wrapperStart = afterNav + nextDivMatch.index;
    const wrapperEnd = findMatchingClose(content, wrapperStart);
    if (wrapperEnd < 0) return content.replace(/<\/head>/i, `${sidebarStyleBlock()}\n</head>`);
    const existingWrapper = content.slice(wrapperStart, wrapperEnd);
    const activeClass = MANUAL_SIDEBAR_ADS_CONFIGURED ? ' manual-sidebar-ads-active' : '';
    const normalized = `<div class="game-page-layout${activeClass}" data-manual-sidebar-layout="true">
  ${sidebarAside('left')}
  <main class="game-main-column">
${existingWrapper}
  </main>
  ${sidebarAside('right')}
</div>`;
    content = `${content.slice(0, wrapperStart)}${normalized}${content.slice(wrapperEnd)}`;
    content = content.replace(/<\/head>/i, `${sidebarStyleBlock()}\n</head>`);
    if (MANUAL_SIDEBAR_ADS_CONFIGURED) {
        content = content.replace(/<\/body>/i, `${sidebarFallbackScript()}\n</body>`);
    }
    return content;
}

function processAdSense() {
    const htmlFiles = walk(root).filter(file => file.endsWith('.html'));
    let changed = 0;
    let eligibleWithLoader = 0;
    let gamesWithSidebarMarkup = 0;

    for (const fullPath of htmlFiles) {
        const file = rel(fullPath);
        let content = fs.readFileSync(fullPath, 'utf8');
        const original = content;
        content = removeAdSenseArtifacts(content);

        if (ADSENSE_CONFIGURED && !isAdSenseExcluded(file, content)) {
            content = injectAdSenseLoader(content);
            eligibleWithLoader++;
        }

        if (/^games\/[^/]+\/index\.html$/i.test(file)) {
            content = normalizeGameSidebarLayout(content);
            if (/data-manual-sidebar-layout=["']true["']/.test(content)) gamesWithSidebarMarkup++;
        }
        content = content.replace(/[ \t]+(?=\r?\n)/g, '');

        if (content !== original) {
            fs.writeFileSync(fullPath, content);
            changed++;
        }
    }

    const adsTxt = ADSENSE_CONFIGURED
        ? `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`
        : '# Google AdSense publisher ID has not been configured yet.\n';
    fs.writeFileSync(path.join(root, 'ads.txt'), adsTxt);
    if (MANUAL_SIDEBAR_ADS_ENABLED && !MANUAL_SIDEBAR_ADS_CONFIGURED) {
        console.warn('Manual sidebar ads were requested but are not fully configured.');
        console.warn('A real AdSense publisher ID and valid left and right ad-slot IDs are required.');
        console.warn('Manual sidebar ads remain disabled.');
    }
    console.log(`AdSense hydration complete. Updated ${changed} HTML files; eligible loaders emitted: ${eligibleWithLoader}; game pages with sidebar markup: ${gamesWithSidebarMarkup}.`);
}

function processGames() {
    const games = fs.readdirSync(gamesDir);
    let count = 0;

    games.forEach(slug => {
        const gamePath = path.join(gamesDir, slug);
        if (fs.statSync(gamePath).isDirectory()) {
            const indexPath = path.join(gamePath, 'index.html');
            if (fs.existsSync(indexPath)) {
                let content = fs.readFileSync(indexPath, 'utf8');
                let original = content;

                // Derive from slug so variant pages such as gravity-flip-107 stay unique.
                let gameName = toTitleCase(slug);

                // 1. Dynamic Page Titles
                content = content.replace(/<title>.*?<\/title>/gi, `<title>${gameName} - Play Free Online Game | FF Live Play</title>`);
                content = content.replace(/<meta\s+property=["']og:title["'].*?>/gi, `<meta property="og:title" content="${gameName} - Play Free Online Game | FF Live Play">`);
                content = content.replace(/<meta\s+name=["']twitter:title["'].*?>/gi, `<meta name="twitter:title" content="${gameName} - Play Free Online Game | FF Live Play">`);

                // 2. Granular Meta Descriptions
                const descText = `Play ${gameName} online for free instantly on FF Live Play. Experience high-performance, no-download ${gameName} browser gameplay directly in your viewport.`;
                content = content.replace(/<meta\s+name=["']description["'].*?>/gi, `<meta name="description" content="${descText}">`);
                content = content.replace(/<meta\s+property=["']og:description["'].*?>/gi, `<meta property="og:description" content="${descText}">`);
                content = content.replace(/<meta\s+name=["']twitter:description["'].*?>/gi, `<meta name="twitter:description" content="${descText}">`);

                // 3. Isolated Absolute Canonicals
                if (/<link\s+rel=["']canonical["'].*?>/i.test(content)) {
                    content = content.replace(/<link\s+rel=["']canonical["'].*?>/gi, `<link rel="canonical" href="${SITE_ORIGIN}/games/${slug}">`);
                } else {
                    // Inject if missing
                    content = content.replace(/<head>/i, `<head>\n  <link rel="canonical" href="${SITE_ORIGIN}/games/${slug}">`);
                }

                // 4. Targeted Card Rich Previews
                const imageUrl = `${SITE_ORIGIN}/assets/thumbnails/${slug}.png`;
                content = content.replace(/<meta\s+property=["']og:image["'].*?>/gi, `<meta property="og:image" content="${imageUrl}">`);
                content = content.replace(/<meta\s+name=["']twitter:image["'].*?>/gi, `<meta name="twitter:image" content="${imageUrl}">`);

                // 5. Icon Footprint Retention
                // Remove existing favicons to prevent duplicates
                content = content.replace(/<link[^>]*rel=["'](icon|shortcut icon|apple-touch-icon)["'][^>]*>\r?\n?/gi, '');

                // Inject favicons right after <head>
                const faviconTags = `\n  <link rel="icon" type="image/x-icon" href="/favicon.ico" />\n  <link rel="shortcut icon" type="image/png" href="/favicon.png" />\n  <link rel="apple-touch-icon" href="/favicon.png" />`;
                content = content.replace(/<head>/i, `<head>${faviconTags}`);

                if (content !== original) {
                    fs.writeFileSync(indexPath, content);
                    count++;
                }
            }
        }
    });
    console.log(`Successfully hydrated metadata for ${count} games.`);
}

console.log("Starting metadata hydration...");
processGames();
processAdSense();
