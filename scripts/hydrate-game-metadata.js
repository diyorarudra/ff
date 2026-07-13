const fs = require('fs');
const path = require('path');
const {
    SITE_ORIGIN,
    ADSENSE_PUBLISHER_ID,
    ADSENSE_CLIENT_ID,
    STANDARD_ADSENSE_CONFIGURED,
    MANUAL_SIDEBAR_ADS_ENABLED,
    ADSENSE_LEFT_SIDEBAR_SLOT_ID,
    ADSENSE_RIGHT_SIDEBAR_SLOT_ID,
    MANUAL_SIDEBAR_ADS_CONFIGURED,
    H5_GAMES_ADS_ACCESS_APPROVED,
    H5_GAMES_ADS_ENABLED,
    H5_INTERSTITIAL_ADS_CONFIGURED,
    H5_REWARDED_ADS_CONFIGURED,
    H5_ADS_TEST_MODE,
    H5_AD_FREQUENCY_HINT,
    H5_PRELOAD_AD_BREAKS,
    H5_GAMES_ADS_CONFIGURED,
    GA_MEASUREMENT_ID
} = require('./site-config');

const root = path.join(__dirname, '..');
const gamesDir = path.join(__dirname, '../games');
const PRIMARY_BRAND = 'FFLivePlay';
const ALTERNATE_BRAND = 'FF Live Play';
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const HOMEPAGE_TITLE = 'FFLivePlay (FF Live Play) - Free Online Browser Games';
const HOMEPAGE_DESCRIPTION = 'Play free online browser games on FFLivePlay, also known as FF Live Play. Enjoy action, racing, puzzle, arcade and casual games with no download or signup.';

function toTitleCase(str) {
    return str
        .split('-')
        .map(word => word.toLowerCase() === '3d' ? '3D' : word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
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

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
}

function jsonLdScript(data) {
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function faviconTags() {
    return [
        '<link rel="icon" href="/favicon.ico" sizes="any">',
        '<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">',
        '<link rel="apple-touch-icon" sizes="180x180" href="/favicon.png">'
    ].map(tag => `  ${tag}`).join('\n');
}

function normalizeFaviconTags(html) {
    let content = html.replace(/<link[^>]*rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]*>\r?\n?/gi, '');
    return content.replace(/<head>/i, `<head>\n${faviconTags()}`);
}

function normalizeBrandTextOutsideScripts(html) {
    const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/gi);
    return parts.map(part => {
        if (/^<(?:script|style)\b/i.test(part)) return part;
        return part
            .replace(/FFliveplay|FFlivePlay|FF LivePlay|Ff Live Play/g, PRIMARY_BRAND)
            .replace(/(aria-label=["'])ffliveplay Home(["'])/gi, `$1${PRIMARY_BRAND} home$2`)
            .replace(/(aria-label=["'])ffliveplay home(["'])/gi, `$1${PRIMARY_BRAND} home$2`)
            .replace(/>\s*ffliveplay\s*</gi, `>${PRIMARY_BRAND}<`)
            .replace(/&copy;\s*2026\s+ffliveplay/gi, `&copy; 2026 ${PRIMARY_BRAND}`)
            .replace(/\bPublished by ffliveplay\b/gi, `Published by ${PRIMARY_BRAND}`)
            .replace(/\bAbout ffliveplay\b/gi, `About ${PRIMARY_BRAND}`)
            .replace(/\bcontact ffliveplay\b/gi, `contact ${PRIMARY_BRAND}`)
            .replace(/\bthe ffliveplay team\b/gi, `the ${PRIMARY_BRAND} team`)
            .replace(/\bWelcome to ffliveplay\b/gi, `Welcome to ${PRIMARY_BRAND}`)
            .replace(/\bffliveplay Privacy Policy\b/gi, `${PRIMARY_BRAND} Privacy Policy`)
            .replace(/\bffliveplay is designed\b/gi, `${PRIMARY_BRAND} is designed`)
            .replace(/\bffliveplay\b(?!\.com|@gmail\.com)/gi, PRIMARY_BRAND);
    }).join('');
}

function replaceMetaContent(html, selectorRe, tag) {
    if (selectorRe.test(html)) return html.replace(selectorRe, tag);
    return html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function normalizeOgSiteName(html) {
    return replaceMetaContent(
        html,
        /<meta\s+property=["']og:site_name["'][^>]*>/i,
        `<meta property="og:site_name" content="${PRIMARY_BRAND}">`
    );
}

function normalizeInternalTitleBrand(title) {
    return title
        .replace(/\s+(?:-|&mdash;|—)\s+ffliveplay$/i, ` | ${PRIMARY_BRAND}`)
        .replace(/\s+(?:-|&mdash;|—)\s+FF Live Play$/i, ` | ${PRIMARY_BRAND}`)
        .replace(/\s+\|\s+FF Live Play$/i, ` | ${PRIMARY_BRAND}`)
        .replace(/\s+\|\s+ffliveplay$/i, ` | ${PRIMARY_BRAND}`);
}

function normalizeBasicBrandMetadata(html) {
    let content = html;
    const title = extractFirst(content, /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (title) {
        content = content.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(normalizeInternalTitleBrand(title))}</title>`);
    }
    content = content
        .replace(/(<meta\s+name=["']author["'][^>]*content=["'])(?:ffliveplay|FF Live Play)(["'][^>]*>)/gi, `$1${PRIMARY_BRAND}$2`)
        .replace(/(<meta\s+property=["']og:title["'][^>]*content=["'])([^"']*)(["'][^>]*>)/gi, (_, a, value, b) => `${a}${escapeAttr(normalizeInternalTitleBrand(value))}${b}`)
        .replace(/(<meta\s+name=["']twitter:title["'][^>]*content=["'])([^"']*)(["'][^>]*>)/gi, (_, a, value, b) => `${a}${escapeAttr(normalizeInternalTitleBrand(value))}${b}`);
    content = normalizeOgSiteName(content);
    content = normalizeBrandTextOutsideScripts(content);
    return normalizeFaviconTags(content);
}

function homepageWebsiteData() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: `${SITE_ORIGIN}/`,
        name: PRIMARY_BRAND,
        alternateName: ALTERNATE_BRAND,
        description: 'Free online browser games with no download or signup.',
        inLanguage: 'en'
    };
}

function homepageOrganizationData() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: PRIMARY_BRAND,
        alternateName: ALTERNATE_BRAND,
        url: `${SITE_ORIGIN}/`,
        logo: {
            '@type': 'ImageObject',
            url: `${SITE_ORIGIN}/favicon-192x192.png`
        },
        description: 'An independent browser-gaming website offering free online games.'
    };
}

function analyticsConfigScript() {
    return `<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', '${GA_MEASUREMENT_ID}');
  </script>`;
}

function normalizeGoogleAnalytics(html) {
    const loaderRe = new RegExp(`<script\\b[^>]*googletagmanager\\.com/gtag/js\\?id=${GA_MEASUREMENT_ID}[^>]*>\\s*</script>`, 'i');
    const configRe = new RegExp(`gtag\\(\\s*['"]config['"]\\s*,\\s*['"]${GA_MEASUREMENT_ID}['"]\\s*\\)`, 'i');
    if (!loaderRe.test(html) || configRe.test(html)) return html;
    return html.replace(loaderRe, match => `${match}\n  ${analyticsConfigScript()}`);
}

function rewardBridgeScript() {
    return `<script id="ff-reward-bridge">
// FF reward bridge. Dispatches local completion events only; it does not call ad APIs.
var ffRewardSentForCurrentRound = false;
var ffLastRewardMilestone = 0;

function ffResetRewardBridge() {
  ffRewardSentForCurrentRound = false;
  ffLastRewardMilestone = 0;
}

function ffTriggerRewardEvent(type, payload = {}) {
  try {
    var parts = location.pathname.split('/').filter(Boolean);
    var slugIndex = parts.indexOf('games') + 1;
    var detectedSlug = slugIndex > 0 ? parts[slugIndex] : 'unknown-game';
    var numericScore = Number(payload.score || window.score || 0);
    var detail = {
      type: type,
      gameSlug: payload.gameSlug || window.GAME_SLUG || detectedSlug,
      level: payload.level || window.currentLevel || window.level || window.currentRound || 1,
      score: numericScore,
      coins: payload.coins || (type === 'GAME_COMPLETE' ? 20 : 10)
    };
    window.ffRewardSentForCurrentRound = ffRewardSentForCurrentRound;
    window.ffLastRewardMilestone = ffLastRewardMilestone;
    window.dispatchEvent(new CustomEvent(
      type === 'GAME_COMPLETE' ? 'FF_GAME_COMPLETE' : 'FF_LEVEL_COMPLETE',
      { detail: detail }
    ));
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(detail, '*');
    }
  } catch (e) {
    console.warn('FF reward event failed safely', e);
  }
}

function ffCheckScoreMilestone(scoreValue, milestoneSize = 1000) {
  var numericScore = Number(scoreValue || 0);
  var safeMilestoneSize = Number(milestoneSize || 1000);
  if (!Number.isFinite(numericScore) || !Number.isFinite(safeMilestoneSize) || safeMilestoneSize <= 0) return;
  var milestone = Math.floor(numericScore / safeMilestoneSize);
  if (milestone > ffLastRewardMilestone && numericScore >= safeMilestoneSize) {
    ffLastRewardMilestone = milestone;
    window.ffLastRewardMilestone = ffLastRewardMilestone;
    ffTriggerRewardEvent('LEVEL_COMPLETE', { level: milestone, score: numericScore, coins: 10 });
  }
}
</script>`;
}

function difficultyHelperScript() {
    return `<script id="ff-difficulty-helper">
// Optional speed helper used by older game templates.
var baseSpeedMultiplier = 0.70;
function getDynamicVelocity(baseSpeed) {
  var currentScore = Number(window.score || 0);
  return baseSpeed * baseSpeedMultiplier * (1 + Math.log1p(currentScore) * 0.15);
}
</script>`;
}

function normalizeRewardBridge(html) {
    const brokenBridgeRe = /<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?INJECTED (?:REWARD|MILESTONE) BRIDGE[\s\S]*?<\/script>\s*/gi;
    let content = html.replace(brokenBridgeRe, `${rewardBridgeScript()}\n`);
    const bridgeBlocks = [...content.matchAll(/<script\b[^>]*id=["']ff-reward-bridge["'][^>]*>[\s\S]*?<\/script>\s*/gi)];
    if (bridgeBlocks.length > 1) {
        let seen = false;
        content = content.replace(/<script\b[^>]*id=["']ff-reward-bridge["'][^>]*>[\s\S]*?<\/script>\s*/gi, block => {
            if (seen) return '';
            seen = true;
            return block;
        });
    }
    return content;
}

function repairGeneratedScriptFragments(html) {
    return html
        .replace(/score\s*\+=\s*f\s*\r?\n(\s*if\s*\(typeof ffCheckScoreMilestone[^\n]*\r?\n)\s*\.type\.points;/g, 'score += f.type.points;\n$1')
        .replace(/score\s*\+=\s*([A-Za-z0-9_$.\]\)]+)\s*\r?\n(\s*if\s*\(typeof ffCheckScoreMilestone[^\n]*\r?\n)\s*([*/+\-])\s*([^;]+);/g, 'score += $1 $3 $4;\n$2')
        .replace(/if\s*\(typeof ffCheckScoreMilestone !== 'undefined'\)\s+if\s*\(typeof ffCheckScoreMilestone !== 'undefined'\)\s+/g, "if (typeof ffCheckScoreMilestone !== 'undefined') ");
}

function normalizeGeneratedInlineScripts(html) {
    return html
        .replace(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?Injected Progressive Difficulty Modifiers[\s\S]*?<\/script>\s*/gi, `${difficultyHelperScript()}\n`)
        .replace(/(<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?\/play\.html[\s\S]*?\}\)\(\);\s*)\r?\n\s*\}\s*(<\/script>)/gi, '$1\n  $2');
}

function addButtonAriaLabel(html, id, label) {
    const re = new RegExp(`<button\\b(?=[^>]*\\bid=["']${id}["'])(?![^>]*\\baria-label=)([^>]*)>`, 'gi');
    return html.replace(re, `<button aria-label="${escapeAttr(label)}"$1>`);
}

function normalizeAccessibleControls(html) {
    const labels = {
        btnLeft: 'Move left',
        'btn-left': 'Move left',
        btnRight: 'Move right',
        'btn-right': 'Move right',
        btnUp: 'Move up',
        'btn-up': 'Move up',
        btnDown: 'Move down',
        'btn-down': 'Move down',
        btnAccel: 'Accelerate',
        btnBrake: 'Brake',
        audioToggleBtn: 'Toggle audio'
    };
    let content = html;
    for (const [id, label] of Object.entries(labels)) {
        content = addButtonAriaLabel(content, id, label);
    }
    content = content.replace(/<button\b(?![^>]*\baria-label=)(?=[^>]*\bclass=["'][^"']*\bctrl-btn\b)(?=[^>]*\bup\b)([^>]*)>/gi, `<button aria-label="Move up"$1>`);
    content = content.replace(/<button\b(?![^>]*\baria-label=)(?=[^>]*\bclass=["'][^"']*\bctrl-btn\b)(?=[^>]*\bleft\b)([^>]*)>/gi, `<button aria-label="Move left"$1>`);
    content = content.replace(/<button\b(?![^>]*\baria-label=)(?=[^>]*\bclass=["'][^"']*\bctrl-btn\b)(?=[^>]*\bdown\b)([^>]*)>/gi, `<button aria-label="Move down"$1>`);
    content = content.replace(/<button\b(?![^>]*\baria-label=)(?=[^>]*\bclass=["'][^"']*\bctrl-btn\b)(?=[^>]*\bright\b)([^>]*)>/gi, `<button aria-label="Move right"$1>`);
    return content;
}

function extractFirst(html, re) {
    const match = html.match(re);
    return match ? match[1].trim() : '';
}

function replaceOrInsertHeadTag(html, re, tag) {
    if (re.test(html)) return html.replace(re, tag);
    return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function normalizeGameStructuredData(html, slug, gameName, descText) {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'VideoGame',
        name: gameName,
        description: descText,
        url: `${SITE_ORIGIN}/games/${slug}/`,
        image: `${SITE_ORIGIN}/assets/thumbnails/${slug}.png`,
        isPartOf: { '@id': WEBSITE_ID },
        genre: 'browser game',
        applicationCategory: 'Game',
        operatingSystem: 'Web browser',
        playMode: 'SinglePlayer',
        publisher: { '@id': ORGANIZATION_ID }
    };
    const script = `  ${jsonLdScript(data)}`;
    if (/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"VideoGame"[\s\S]*?<\/script>/i.test(html)) {
        return html.replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?"@type"\s*:\s*"VideoGame"[\s\S]*?<\/script>/i, script);
    }
    return html.replace(/<\/head>/i, `${script}\n</head>`);
}

function normalizeGameMetadata(content, slug, gameName) {
    const descText = `Play ${gameName} online for free instantly on ${PRIMARY_BRAND}. Experience high-performance, no-download ${gameName} browser gameplay directly in your viewport.`;
    const title = `${gameName} - Play Free Online Game | ${PRIMARY_BRAND}`;
    const canonical = `${SITE_ORIGIN}/games/${slug}`;
    const imageUrl = `${SITE_ORIGIN}/assets/thumbnails/${slug}.png`;

    content = replaceOrInsertHeadTag(content, /<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeAttr(descText)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']keywords["'][^>]*>/i, `<meta name="keywords" content="${escapeAttr(`${gameName}, ffliveplay, online game, browser game`)}">`);
    content = replaceOrInsertHeadTag(content, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeAttr(title)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeAttr(descText)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:image["'][^>]*>/i, `<meta property="og:image" content="${imageUrl}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttr(title)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttr(descText)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:image["'][^>]*>/i, `<meta name="twitter:image" content="${imageUrl}">`);
    content = normalizeGameStructuredData(content, slug, gameName, descText);
    return content;
}

function guidanceText(slug, gameName) {
    const lower = slug.toLowerCase();
    const families = [
        { test: /(quiz|trivia|true-or-false|millionaire|emoji-movie)/, objective: `Choose the best answer in ${gameName} before the round moves on.`, controls: 'Tap or click an answer, then use the next prompt to continue.', scoring: 'Correct answers build your score; misses end the streak for that question.', tip: 'Read every option first, because the fastest answer is not always the safest one.' },
        { test: /(puzzle|sort|2048|sudoku|nonogram|crossword|memory|matcher|dots|tile|word)/, objective: `Solve the board in ${gameName} by planning each move instead of rushing.`, controls: 'Use mouse clicks, taps, drags, or keyboard input where the board asks for it.', scoring: 'Progress comes from completed matches, cleared spaces, solved words, or finished patterns.', tip: 'Look for forced moves first, then use the open spaces to set up the next chain.' },
        { test: /(runner|run|rush|racer|car|bike|bus|parking|driver|traffic)/, objective: `Stay in control through ${gameName} while avoiding crashes and missed timing windows.`, controls: 'Use arrow keys, WASD, pointer controls, or touch steering depending on the active scene.', scoring: 'Distance, clean movement, collected items, or completed routes increase your result.', tip: 'Small corrections are stronger than late over-steering, especially on mobile.' },
        { test: /(shooter|archery|cannon|strike|invaders|asteroid|battleship|balls|whack)/, objective: `Aim carefully in ${gameName} and clear targets before they overwhelm the play area.`, controls: 'Move with keyboard or touch, then aim, tap, click, or press the fire control when lined up.', scoring: 'Targets, combos, and survival time drive the score.', tip: 'Prioritize the closest threat first, then reset your aim before taking the next shot.' },
        { test: /(snake|pac|orbit|collector|catcher|dodge|avoid|bounce|jump|cube|stack|breaker)/, objective: `Keep the run alive in ${gameName} while collecting points and avoiding hazards.`, controls: 'Use arrow keys, WASD, taps, or swipes to guide movement.', scoring: 'Longer survival, pickups, cleared objects, and clean sequences raise the score.', tip: 'Leave yourself an exit path before chasing a risky pickup.' }
    ];
    const family = families.find(item => item.test.test(lower)) || {
        objective: `Complete the main challenge in ${gameName} while keeping the round under control.`,
        controls: 'Use the on-screen buttons, keyboard, mouse, or touch controls shown by the game.',
        scoring: 'Successful actions, completed rounds, and clean play improve your score.',
        tip: 'Start with steady inputs, then speed up once the pattern is clear.'
    };
    return family;
}

function normalizeGameGuidance(html, slug, gameName) {
    // Disabled to remove "How to Play" text from game UI
    return html;
}

function blogBreadcrumbData(title, canonical) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_ORIGIN}/blog` },
            { '@type': 'ListItem', position: 3, name: title, item: canonical }
        ]
    };
}

function blogPostData(title, description, canonical, existing = {}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        mainEntityOfPage: canonical,
        isPartOf: { '@id': WEBSITE_ID },
        ...(existing.datePublished ? { datePublished: existing.datePublished } : {}),
        ...(existing.dateModified ? { dateModified: existing.dateModified } : {}),
        author: { '@type': 'Organization', name: PRIMARY_BRAND, url: `${SITE_ORIGIN}/` },
        publisher: { '@id': ORGANIZATION_ID }
    };
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
        .replace(/<script\b[^>]*id=["']ff-h5-ad-bootstrap["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')
        .replace(/<script\b[^>]*id=["']ff-h5-ad-config["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')
        .replace(/<script\b[^>]*src=["'][^"']*\/js\/h5-ads-controller\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi, '')
        .replace(/<script\b[^>]*>\s*\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\([^)]*\);\s*<\/script>\s*/gi, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>\s*/gi, (block) => /adsbygoogle/i.test(block) ? '' : block)
        .replace(/<meta\b[^>]*name=["']google-adsense-account["'][^>]*>\s*/gi, '')
        .replace(/<ins\b[^>]*class=["'][^"']*adsbygoogle[^"']*["'][\s\S]*?<\/ins>\s*/gi, '')
        .replace(/<div\b[^>]*class=["'][^"']*(?:ad-slot|ad-container|adsbygoogle|advertisement|ad-wrapper)[^"']*["'][^>]*>\s*<\/div>\s*/gi, '');
}

function injectAdSenseLoader(html, options = {}) {
    const h5Attrs = options.h5
        ? ` data-ad-frequency-hint="${H5_AD_FREQUENCY_HINT}"${H5_ADS_TEST_MODE ? ' data-adbreak-test="on"' : ''}`
        : '';
    const loader = `  <script async${h5Attrs} src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}" crossorigin="anonymous"></script>\n`;
    return html.replace(/<\/head>/i, `${loader}</head>`);
}

function h5BootstrapScripts() {
    return `  <script id="ff-h5-ad-bootstrap">
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adBreak || function(options) {
      window.adsbygoogle.push(options);
    };
    window.adConfig = window.adConfig || function(options) {
      window.adsbygoogle.push(options);
    };
  </script>
  <script src="/js/h5-ads-controller.js"></script>
  <script id="ff-h5-ad-config">
      window.FFH5Ads && window.FFH5Ads.initialize({
      enabled: true,
      interstitialsEnabled: ${Boolean(H5_INTERSTITIAL_ADS_CONFIGURED)},
      rewardedEnabled: ${Boolean(H5_REWARDED_ADS_CONFIGURED)},
      preloadAdBreaks: "${H5_PRELOAD_AD_BREAKS}",
      frequencyHint: "${H5_AD_FREQUENCY_HINT}"
    });
  </script>\n`;
}

function injectH5Bootstrap(html) {
    return html.replace(/<\/head>/i, `${h5BootstrapScripts()}</head>`);
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

function replaceJsonLdByType(html, type, data) {
    const blocks = readJsonLdBlocks(html);
    const block = blocks.find(item => jsonLdTypes(item.data).includes(type));
    if (block) return html.replace(block.raw, `  ${jsonLdScript(data)}`);
    return html.replace(/<\/head>/i, `  ${jsonLdScript(data)}\n</head>`);
}

function removeJsonLdByType(html, type) {
    return html.replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, block => {
        try {
            const data = JSON.parse((block.match(/<script[^>]*>([\s\S]*?)<\/script>/i) || [])[1] || '');
            return jsonLdTypes(data).includes(type) ? '' : block;
        } catch {
            return block;
        }
    });
}

function normalizeHomepageBrandSeo(html) {
    let content = html;
    content = replaceOrInsertHeadTag(content, /<title>.*?<\/title>/i, `<title>${HOMEPAGE_TITLE}</title>`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeAttr(HOMEPAGE_DESCRIPTION)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']author["'][^>]*>/i, `<meta name="author" content="${PRIMARY_BRAND}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeAttr(HOMEPAGE_TITLE)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeAttr(HOMEPAGE_DESCRIPTION)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttr(HOMEPAGE_TITLE)}">`);
    content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttr(HOMEPAGE_DESCRIPTION)}">`);
    content = normalizeOgSiteName(content);
    content = replaceJsonLdByType(content, 'WebSite', homepageWebsiteData());
    content = replaceJsonLdByType(content, 'Organization', homepageOrganizationData());
    content = content.replace(
        /Welcome to FF Live Play! We are your ultimate destination to play free online games instantly in your browser\. Whether you love high-speed racing, puzzles, or classic arcade action, FF Live Play delivers full gaming sessions with no downloads or registration required\./,
        `${PRIMARY_BRAND}, also written as ${ALTERNATE_BRAND}, is a browser-gaming website for free online games. Play instantly in your browser with no downloads or registration required.`
    );
    return content;
}

function normalizeAboutContactBrandSeo(file, html) {
    let content = html;
    if (file === 'compliance/about-us.html') {
        const title = `About ${PRIMARY_BRAND} | Free Browser Games`;
        const desc = `Learn about ${PRIMARY_BRAND}, an independent browser-gaming website offering free online games that are fast, lightweight, and easy to play.`;
        content = replaceOrInsertHeadTag(content, /<title>.*?<\/title>/i, `<title>${title}</title>`);
        content = replaceOrInsertHeadTag(content, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeAttr(desc)}">`);
        content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeAttr(title)}">`);
        content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeAttr(desc)}">`);
        content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttr(title)}">`);
        content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttr(desc)}">`);
        content = removeJsonLdByType(content, 'Organization');
        content = content.replace(/<h1 class="font-heading gradient-text animate-fade-in-up">About ffliveplay<\/h1>/i, `<h1 class="font-heading gradient-text animate-fade-in-up">About ${PRIMARY_BRAND}</h1>`);
        content = content.replace(/Two pillars define the ffliveplay experience\./i, `Two pillars define the ${PRIMARY_BRAND} experience.`);
    }
    if (file === 'compliance/contact.html') {
        const title = `Contact ${PRIMARY_BRAND}`;
        const desc = `Contact the ${PRIMARY_BRAND} team to report a bug, suggest a feature, ask a question, or share feedback about free browser games.`;
        content = replaceOrInsertHeadTag(content, /<title>.*?<\/title>/i, `<title>${title}</title>`);
        content = replaceOrInsertHeadTag(content, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeAttr(desc)}">`);
        content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeAttr(title)}">`);
        content = replaceOrInsertHeadTag(content, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeAttr(desc)}">`);
        content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttr(title)}">`);
        content = replaceOrInsertHeadTag(content, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttr(desc)}">`);
        content = replaceJsonLdByType(content, 'ContactPage', {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: `Contact ${PRIMARY_BRAND}`,
            url: `${SITE_ORIGIN}/compliance/contact`,
            description: desc,
            isPartOf: { '@id': WEBSITE_ID },
            mainEntity: { '@id': ORGANIZATION_ID }
        });
    }
    return content;
}

function normalizeBrandSeoForPage(file, html) {
    let content = normalizeBasicBrandMetadata(html);
    if (file === 'index.html') content = normalizeHomepageBrandSeo(content);
    content = normalizeAboutContactBrandSeo(file, content);
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
        content = normalizeGeneratedInlineScripts(content);
        content = repairGeneratedScriptFragments(content);
        content = normalizeGoogleAnalytics(content);
        content = normalizeAccessibleControls(content);
        content = normalizeBrandSeoForPage(file, content);
        content = removeAdSenseArtifacts(content);

        const isGameDocument = /^games\/[^/]+\/index\.html$/i.test(file);
        if (STANDARD_ADSENSE_CONFIGURED && !isAdSenseExcluded(file, content)) {
            content = injectAdSenseLoader(content, { h5: H5_GAMES_ADS_CONFIGURED && isGameDocument });
            eligibleWithLoader++;
        }

        if (isGameDocument) {
            if (H5_GAMES_ADS_CONFIGURED) {
                content = injectH5Bootstrap(content);
            }
            content = normalizeGameSidebarLayout(content);
            if (/data-manual-sidebar-layout=["']true["']/.test(content)) gamesWithSidebarMarkup++;
        }
        content = content.replace(/[ \t]+(?=\r?\n)/g, '');

        if (content !== original) {
            fs.writeFileSync(fullPath, content);
            changed++;
        }
    }

    const adsTxt = STANDARD_ADSENSE_CONFIGURED
        ? `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`
        : '# Google AdSense publisher ID has not been configured yet.\n';
    fs.writeFileSync(path.join(root, 'ads.txt'), adsTxt);
    if (!STANDARD_ADSENSE_CONFIGURED) {
        console.warn('AdSense publisher ID is pending or invalid. Standard AdSense, Auto Ads, manual units, and H5 Ads remain inactive.');
    }
    if (MANUAL_SIDEBAR_ADS_ENABLED && !MANUAL_SIDEBAR_ADS_CONFIGURED) {
        console.warn('Manual sidebar ads were requested but are not fully configured.');
        console.warn('A real AdSense publisher ID and valid left and right ad-slot IDs are required.');
        console.warn('Manual sidebar ads remain disabled.');
    }
    if (H5_GAMES_ADS_ENABLED && !H5_GAMES_ADS_ACCESS_APPROVED) {
        console.warn('H5 Games Ads were requested but official access has not been confirmed.');
        console.warn('H5 Games Ads remain disabled.');
        console.warn('Set H5_GAMES_ADS_ACCESS_APPROVED to true only after Google approves the account for H5 Games Ads / Ad Placement API.');
    }
    console.log(`AdSense hydration complete. Updated ${changed} HTML files; eligible loaders emitted: ${eligibleWithLoader}; game pages with sidebar markup: ${gamesWithSidebarMarkup}.`);
}

function processGames() {
    const games = fs.readdirSync(gamesDir);
    let count = 0;
    let guidanceCount = 0;

    games.forEach(slug => {
        const gamePath = path.join(gamesDir, slug);
        if (fs.statSync(gamePath).isDirectory()) {
            const indexPath = path.join(gamePath, 'index.html');
            if (fs.existsSync(indexPath)) {
                let content = fs.readFileSync(indexPath, 'utf8');
                let original = content;

                // Derive from slug so variant pages such as gravity-flip-107 stay unique.
                let gameName = toTitleCase(slug);

                content = normalizeRewardBridge(content);
                content = repairGeneratedScriptFragments(content);
                content = normalizeGeneratedInlineScripts(content);
                content = normalizeGoogleAnalytics(content);
                content = normalizeAccessibleControls(content);
                content = normalizeGameMetadata(content, slug, gameName);
                content = normalizeGameGuidance(content, slug, gameName);
                if (content.includes('data-game-guidance="true"')) guidanceCount++;

                content = normalizeFaviconTags(content);

                if (content !== original) {
                    fs.writeFileSync(indexPath, content);
                    count++;
                }
            }
        }
    });
    console.log(`Successfully hydrated metadata for ${count} games; guidance sections present: ${guidanceCount}.`);
}

function readJsonLdBlocks(html) {
    const blocks = [];
    for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            blocks.push({ raw: match[0], data: JSON.parse(match[1]) });
        } catch {
            blocks.push({ raw: match[0], data: null });
        }
    }
    return blocks;
}

function jsonLdTypes(data) {
    const nodes = Array.isArray(data) ? data : [data];
    return nodes.flatMap(node => {
        if (!node || !node['@type']) return [];
        return Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    });
}

function normalizeBlogStructuredData() {
    const blogDir = path.join(root, 'blog');
    if (!fs.existsSync(blogDir)) return;
    const posts = fs.readdirSync(blogDir)
        .filter(file => file.endsWith('.html') && file !== 'index.html')
        .map(file => path.join(blogDir, file));
    let changed = 0;
    let breadcrumbs = 0;
    let articles = 0;

    for (const postPath of posts) {
        let html = fs.readFileSync(postPath, 'utf8');
        const original = html;
        const title = extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || extractFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i).replace(/\s+-\s+ffliveplay$/i, '');
        const description = extractFirst(html, /<meta\s+name=["']description["'][^>]*content=["']([^"']*)/i);
        const canonical = extractFirst(html, /<link\s+rel=["']canonical["'][^>]*href=["']([^"']*)/i) || `${SITE_ORIGIN}/blog/${path.basename(postPath, '.html')}`;
        const blocks = readJsonLdBlocks(html);
        const hasBreadcrumb = blocks.some(block => jsonLdTypes(block.data).includes('BreadcrumbList'));
        const articleBlock = blocks.find(block => {
            const types = jsonLdTypes(block.data);
            return types.includes('BlogPosting') || types.includes('Article');
        });
        let existingArticle = articleBlock && articleBlock.data && !Array.isArray(articleBlock.data) ? articleBlock.data : {};

        if (!hasBreadcrumb) {
            html = html.replace(/<\/head>/i, `  ${jsonLdScript(blogBreadcrumbData(title, canonical))}\n</head>`);
            breadcrumbs++;
        }

        const normalizedArticle = blogPostData(title, description, canonical, existingArticle);
        if (articleBlock) {
            html = html.replace(articleBlock.raw, `  ${jsonLdScript(normalizedArticle)}`);
        } else {
            html = html.replace(/<\/head>/i, `  ${jsonLdScript(normalizedArticle)}\n</head>`);
            articles++;
        }

        if (html !== original) {
            fs.writeFileSync(postPath, html);
            changed++;
        }
    }

    console.log(`Blog structured-data hydration complete. Updated ${changed} posts; breadcrumbs added: ${breadcrumbs}; article schemas added: ${articles}.`);
}

console.log("Starting metadata hydration...");
processGames();
normalizeBlogStructuredData();
processAdSense();
