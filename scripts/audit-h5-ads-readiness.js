const fs = require('fs');
const path = require('path');
const { analyzeMonetization } = require('./audit-monetization-readiness');
const config = require('./site-config');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'reports');

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function analyzeH5(options = {}) {
  const monetization = analyzeMonetization({ release: false });
  const controller = read(path.join(root, 'js', 'h5-ads-controller.js'));
  const testHarness = read(path.join(root, 'scripts', 'test-h5-ads-controller.js'));
  const metrics = {
    h5AccessApproved: config.H5_GAMES_ADS_ACCESS_APPROVED,
    h5Enabled: config.H5_GAMES_ADS_ENABLED,
    h5Configured: config.H5_GAMES_ADS_CONFIGURED,
    h5InterstitialsEnabled: config.H5_INTERSTITIAL_ADS_CONFIGURED,
    h5RewardedEnabled: config.H5_REWARDED_ADS_CONFIGURED,
    h5TestMode: config.H5_ADS_TEST_MODE,
    h5EligibleGameDocuments: monetization.metrics.h5EligibleGameDocuments,
    h5GameDocumentsWithLoader: monetization.metrics.h5GameDocumentsWithLoader,
    h5GameDocumentsMissingLoader: monetization.metrics.h5GameDocumentsMissingLoader,
    h5BootstrapCount: monetization.metrics.h5BootstrapCount,
    adConfigCount: monetization.metrics.adConfigCount,
    productionTestModeLeaks: monetization.metrics.productionTestModeLeaks,
    controllerMethodsPresent: [
      'initialize',
      'isAvailable',
      'requestStartAd',
      'requestNaturalBreakAd',
      'requestRewardedAd',
      'setSoundEnabled',
      'pauseForAd',
      'resumeAfterAd',
      'getStatus'
    ].every((name) => controller.includes(`${name}:`) || controller.includes(`function ${name}`)),
    overlapGuardPresent: /adBreakInProgress/.test(controller),
    cooldownPresent: /cooldown/.test(controller) && /120000/.test(controller),
    pauseResumePresent: /pauseForAd[\s\S]*resumeAfterAd/.test(controller),
    rewardAdViewedOnly: /adViewed[\s\S]*grantRewardOnce/.test(controller) && !/adDismissed[\s\S]{0,120}grantRewardOnce/.test(controller),
    duplicateRewardGuardPresent: /request\.granted/.test(controller),
    mockHarnessPresent: testHarness.includes('Rewarded ad available and viewed') && testHarness.includes('Two simultaneous requests'),
    sameDocumentArchitecture: 'games/<slug>/index.html hosts the playable canvas/board directly; play.html is an outer iframe route that loads those documents.'
  };

  const failures = [];
  if (!metrics.controllerMethodsPresent) failures.push('Shared H5 controller is missing required methods.');
  if (!metrics.overlapGuardPresent) failures.push('H5 controller overlap guard is missing.');
  if (!metrics.cooldownPresent) failures.push('H5 controller cooldown guard is missing.');
  if (!metrics.pauseResumePresent) failures.push('H5 pause/resume implementation is missing.');
  if (!metrics.rewardAdViewedOnly || !metrics.duplicateRewardGuardPresent) failures.push('Rewarded ads must grant only once from adViewed.');
  if (!metrics.mockHarnessPresent) failures.push('H5 mock test harness is missing.');
  if (!config.H5_GAMES_ADS_CONFIGURED && (metrics.h5BootstrapCount > 0 || metrics.adConfigCount > 0)) failures.push('H5 bootstrap emitted while H5 is disabled.');
  if (config.H5_GAMES_ADS_CONFIGURED && metrics.h5GameDocumentsMissingLoader > 0) failures.push(`h5GameDocumentsMissingLoader: ${metrics.h5GameDocumentsMissingLoader}`);
  if (options.release) {
    if (!config.STANDARD_ADSENSE_CONFIGURED) failures.push('A real Google AdSense publisher ID is required before H5 release.');
    if (!config.H5_GAMES_ADS_ACCESS_APPROVED) failures.push('Official H5 Games Ads / Ad Placement API access must be confirmed.');
    if (!config.H5_GAMES_ADS_ENABLED) failures.push('H5_GAMES_ADS_ENABLED must be true for H5 release.');
    if (config.H5_ADS_TEST_MODE) failures.push('H5_ADS_TEST_MODE must be false for production release.');
    if (metrics.productionTestModeLeaks > 0) failures.push(`productionTestModeLeaks: ${metrics.productionTestModeLeaks}`);
    if (!config.H5_INTERSTITIAL_ADS_CONFIGURED && !config.H5_REWARDED_ADS_CONFIGURED) failures.push('At least one H5 placement type should be enabled for H5 release.');
  }

  return {
    generatedAt: new Date().toISOString(),
    release: Boolean(options.release),
    metrics,
    failures,
    ownerActions: [
      'Standard AdSense account must be approved first.',
      'Apply separately for H5 Games Ads / Ad Placement API.',
      'Wait for official access confirmation.',
      'Only then set H5_GAMES_ADS_ACCESS_APPROVED to true.',
      'Use H5_ADS_TEST_MODE only for local/staging validation.',
      'Disable test mode before production.',
      'Exclude player/game routes from Auto Ads in the AdSense dashboard if overlays conflict with gameplay.'
    ]
  };
}

function writeReports(result) {
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'h5-ads-readiness-report.json'), `${JSON.stringify(result, null, 2)}\n`);
  const lines = [
    '# H5 Ads Readiness Report',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    '## Metrics',
    ''
  ];
  for (const [key, value] of Object.entries(result.metrics)) lines.push(`- ${key}: ${value}`);
  lines.push('', '## Result', '', result.failures.length ? 'Checks failed:' : 'All normal H5 dormant checks passed.');
  for (const failure of result.failures) lines.push(`- ${failure}`);
  lines.push('', '## Owner Actions', '');
  for (const action of result.ownerActions) lines.push(`- ${action}`);
  fs.writeFileSync(path.join(reportDir, 'h5-ads-readiness-report.md'), `${lines.join('\n')}\n`);
}

if (require.main === module) {
  const release = process.argv.includes('--release');
  const result = analyzeH5({ release });
  writeReports(result);
  console.log(JSON.stringify(result.metrics, null, 2));
  if (result.failures.length) {
    if (release) {
      console.error('\nH5 release audit failed:');
      for (const failure of result.failures) console.error(`- ${failure}`);
    } else {
      console.error('\nH5 audit failures:');
      for (const failure of result.failures) console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

module.exports = { analyzeH5 };
