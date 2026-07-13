const fs = require('fs');
const path = require('path');
const { analyze, inventory } = require('./audit-adsense-readiness');
const config = require('./site-config');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'reports');

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

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

function count(re, text) {
  return (text.match(re) || []).length;
}

function standardEligible(page) {
  return !page.adsenseExcluded;
}

function analyzeMonetization(options = {}) {
  const adsense = analyze({ requireRealId: options.release });
  const inv = inventory();
  const pages = inv.pages;
  const gamePages = pages.filter((page) => page.pageType === 'game');
  const standardEligiblePages = pages.filter(standardEligible);
  const allHtml = pages.map((page) => read(path.join(root, page.file))).join('\n');
  const sourceFiles = walk(root).filter((file) => /\.(?:js|html)$/i.test(file));
  const sourceText = sourceFiles.map((file) => read(file)).join('\n');
  const unsafeSourceText = sourceFiles
    .filter((file) => !['js/h5-ads-controller.js', 'scripts/test-h5-ads-controller.js'].includes(rel(file)))
    .map((file) => read(file))
    .join('\n');
  const h5BootstrapCount = count(/id=["']ff-h5-ad-bootstrap["']/g, allHtml);
  const h5ConfigCount = count(/id=["']ff-h5-ad-config["']/g, allHtml);
  const h5LoaderPages = gamePages.filter((page) => {
    const html = read(path.join(root, page.file));
    return /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(html) &&
      /data-ad-frequency-hint=/i.test(html);
  });
  const duplicateH5Bootstrap = pages.filter((page) => count(/id=["']ff-h5-ad-bootstrap["']/g, read(path.join(root, page.file))) > 1).length;
  const duplicateAdConfig = pages.filter((page) => count(/id=["']ff-h5-ad-config["']/g, read(path.join(root, page.file))) > 1).length;
  const adBreakCallSites = count(/\badBreak\s*\(/g, sourceText);
  const unsafeAdBreakCallSites = count(/\badBreak\s*\(/g, unsafeSourceText);
  const productionTestModeLeaks = count(/data-adbreak-test=["']on["']/g, allHtml);
  const adsTxt = read(path.join(root, 'ads.txt'));

  const metrics = {
    monetizationMode: config.MONETIZATION_MODE,
    adsenseConfigurationStatus: adsense.metrics.adsenseConfigurationStatus,
    adsenseSubmissionReady: adsense.metrics.adsenseSubmissionReady,
    publisherIdValid: config.ADSENSE_CONFIGURED,
    clientIdValid: !config.ADSENSE_CONFIGURED || config.VALID_CLIENT_ID_PATTERN.test(config.ADSENSE_CLIENT_ID),
    adsTxtValid: config.STANDARD_ADSENSE_CONFIGURED
      ? adsTxt === `google.com, ${config.ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`
      : adsTxt === '# Google AdSense publisher ID has not been configured yet.\n',
    adsTxtPublisherMatch: config.STANDARD_ADSENSE_CONFIGURED
      ? adsTxt.includes(config.ADSENSE_PUBLISHER_ID)
      : !/google\.com,\s*pub-/i.test(adsTxt),
    standardEligiblePages: standardEligiblePages.length,
    standardPagesWithLoader: standardEligiblePages.filter((page) => page.adsenseLoaderCount === 1).length,
    standardPagesMissingLoader: config.STANDARD_ADSENSE_CONFIGURED ? standardEligiblePages.filter((page) => page.adsenseLoaderCount !== 1).length : 0,
    duplicateAdSenseLoaders: adsense.metrics.duplicateAdSenseTags,
    manualSidebarAdsEnabled: config.MANUAL_SIDEBAR_ADS_ENABLED,
    manualSidebarAdsConfigured: config.MANUAL_SIDEBAR_ADS_CONFIGURED,
    manualAdUnits: adsense.metrics.manualAdUnits,
    visibleSidebarAds: adsense.metrics.gamePagesWithVisibleSidebarAds,
    whiteSidebarBoxes: adsense.metrics.manualSidebarBlankWhiteContainers,
    reservedSidebarColumns: adsense.metrics.manualSidebarLayoutReservationWhileDisabled,
    h5AccessApproved: config.H5_GAMES_ADS_ACCESS_APPROVED,
    h5Enabled: config.H5_GAMES_ADS_ENABLED,
    h5Configured: config.H5_GAMES_ADS_CONFIGURED,
    h5EligibleGameDocuments: gamePages.length,
    h5GameDocumentsWithLoader: h5LoaderPages.length,
    h5GameDocumentsMissingLoader: config.H5_GAMES_ADS_CONFIGURED ? gamePages.length - h5LoaderPages.length : 0,
    h5BootstrapCount,
    duplicateH5Bootstrap,
    adConfigCount: h5ConfigCount,
    duplicateAdConfig,
    h5InterstitialsEnabled: config.H5_INTERSTITIAL_ADS_CONFIGURED,
    h5RewardedEnabled: config.H5_REWARDED_ADS_CONFIGURED,
    h5TestMode: config.H5_ADS_TEST_MODE,
    productionTestModeLeaks,
    adBreakCallSites,
    unsafeAdBreakCallSites,
    adBreakCallsInsideLoops: count(/\b(?:for|while)\s*\([^)]*\)\s*\{[\s\S]{0,500}\badBreak\s*\(/g, unsafeSourceText),
    adBreakCallsInsideCallbacks: count(/\badBreak\s*\([\s\S]{0,500}\badBreak\s*\(/g, unsafeSourceText),
    rewardGrantedFromAdViewedOnly: /function grantRewardOnce[\s\S]*adViewed/.test(read(path.join(root, 'js', 'h5-ads-controller.js'))),
    duplicateRewardRisk: /request\.granted/.test(read(path.join(root, 'js', 'h5-ads-controller.js'))) ? 0 : 1,
    gamePauseResumeCoverage: /pauseForAd[\s\S]*resumeAfterAd/.test(read(path.join(root, 'js', 'h5-ads-controller.js'))),
    autoAdsH5ConflictRisk: config.H5_GAMES_ADS_CONFIGURED ? 'OWNER_DASHBOARD_EXCLUSIONS_REQUIRED_FOR_PLAYER_ROUTES' : 'NONE_WHILE_H5_DISABLED',
    consentOwnerActionsOutstanding: true
  };

  const failures = [...adsense.failures.filter((failure) => {
    if (!options.release && failure === 'A real Google AdSense publisher ID is required.') return false;
    return true;
  })];

  if (!metrics.adsTxtValid) failures.push('ads.txt is not valid for the current configuration.');
  if (metrics.duplicateAdSenseLoaders > 0) failures.push(`duplicateAdSenseLoaders: ${metrics.duplicateAdSenseLoaders}`);
  if (metrics.manualAdUnits > 0 && !config.MANUAL_SIDEBAR_ADS_CONFIGURED) failures.push(`manualAdUnits: ${metrics.manualAdUnits}`);
  if (!config.STANDARD_ADSENSE_CONFIGURED && adsense.metrics.pagesWithAdSense > 0) failures.push('AdSense loader emitted while publisher ID is pending.');
  if (config.STANDARD_ADSENSE_CONFIGURED && metrics.standardPagesMissingLoader > 0) failures.push(`standardPagesMissingLoader: ${metrics.standardPagesMissingLoader}`);
  if (config.H5_GAMES_ADS_ENABLED && !config.H5_GAMES_ADS_ACCESS_APPROVED && options.release) failures.push('H5 Games Ads were requested but official access has not been confirmed.');
  if (config.H5_ADS_TEST_MODE && options.release) failures.push('H5 test mode must be disabled for production release.');
  if (!config.H5_GAMES_ADS_CONFIGURED && (metrics.h5BootstrapCount > 0 || metrics.h5GameDocumentsWithLoader > 0)) failures.push('H5 artifacts emitted while H5 is not configured.');
  if (config.H5_GAMES_ADS_CONFIGURED && metrics.h5GameDocumentsMissingLoader > 0) failures.push(`h5GameDocumentsMissingLoader: ${metrics.h5GameDocumentsMissingLoader}`);
  if (metrics.duplicateH5Bootstrap > 0 || metrics.duplicateAdConfig > 0) failures.push('Duplicate H5 bootstrap/config blocks detected.');
  if (metrics.productionTestModeLeaks > 0 && options.release) failures.push(`productionTestModeLeaks: ${metrics.productionTestModeLeaks}`);
  if (options.release && !config.STANDARD_ADSENSE_CONFIGURED) {
    failures.push('A real Google AdSense publisher ID is required.');
  }

  return {
    generatedAt: new Date().toISOString(),
    release: Boolean(options.release),
    metrics,
    failures,
    ownerDashboardChecklist: {
      standardAdSense: [
        'Create/complete AdSense account.',
        'Add ffliveplay.com under Sites.',
        'Put the exact real publisher ID in scripts/site-config.js.',
        'Build and deploy.',
        'Verify /ads.txt publicly.',
        'Configure Privacy & messaging/CMP.',
        'Review Auto Ads preview and exclusions.',
        'Run the Standard AdSense release audit.'
      ],
      autoAds: [
        'Turn on Auto Ads in the AdSense dashboard if desired.',
        'Review Auto Ads preview.',
        'Exclude pages or areas where ads could overlap games, controls, legal content, or player-only views.',
        'Configure ad load conservatively.'
      ],
      h5GamesAds: [
        'Obtain approved Standard AdSense status.',
        'Apply separately for H5 Games Ads / Ad Placement API access.',
        'Set H5_GAMES_ADS_ACCESS_APPROVED to true only after explicit Google approval.',
        'Use H5_ADS_TEST_MODE only in staging/local validation.',
        'Disable test mode before production.'
      ],
      consent: [
        'Configure Google Privacy & messaging or another certified CMP.',
        'Configure European regulations consent for the EEA, UK, and Switzerland.',
        'Configure relevant US-state privacy messages/opt-outs.',
        'Test consent behavior before serving personalized ads.',
        'Keep privacy disclosures synchronized with enabled products.'
      ]
    }
  };
}

function writeReports(result) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'monetization-readiness-report.json'), `${JSON.stringify(result, null, 2)}\n`);
  const lines = [
    '# Monetization Readiness Report',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    '## Metrics',
    ''
  ];
  for (const [key, value] of Object.entries(result.metrics)) lines.push(`- ${key}: ${value}`);
  lines.push('', '## Result', '', result.failures.length ? 'Checks failed:' : 'All normal monetization checks passed.');
  for (const failure of result.failures) lines.push(`- ${failure}`);
  lines.push(
    '',
    '## Page Eligibility Matrix',
    '',
    '| Page type | Standard loader | Auto Ads candidate | Manual sidebars | H5 API |',
    '|---|---:|---:|---:|---:|',
    '| Homepage | Yes when publisher ID is valid | Yes | No | No |',
    '| Blog index/article | Yes when publisher ID is valid | Yes | No | No |',
    '| Category page | Yes when publisher ID is valid | Yes | No | No |',
    '| Game detail/direct game document | Yes when publisher ID is valid | Owner/dashboard decision | Optional wide desktop | Yes only after H5 approval and flags |',
    '| play.html outer iframe player | No production ads | No | No | No |',
    '| Actual iframe game document | Same games/<slug>/index.html document | Exclude in dashboard if H5 is enabled | Optional only on direct detail layout | Yes only after H5 approval and flags |',
    '| Privacy/terms/contact/compliance | No manual units | Usually excluded | No | No |',
    '| 404/error/noindex | No | No | No | No |'
  );
  fs.writeFileSync(path.join(reportDir, 'monetization-readiness-report.md'), `${lines.join('\n')}\n`);
}

if (require.main === module) {
  const release = process.argv.includes('--release');
  const result = analyzeMonetization({ release });
  writeReports(result);
  console.log(JSON.stringify(result.metrics, null, 2));
  if (result.failures.length) {
    if (release && !config.STANDARD_ADSENSE_CONFIGURED) {
      console.error('\nMonetization release audit failed:');
      console.error('A real Google AdSense publisher ID is required.');
      console.error('Update scripts/site-config.js with pub- followed by exactly 16 digits, rebuild, and rerun the release audit.');
    } else {
      console.error('\nMonetization audit failures:');
      for (const failure of result.failures) console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

module.exports = { analyzeMonetization };
