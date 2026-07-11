const { analyze } = require('./audit-adsense-readiness');

const result = analyze();
const critical = result.failures.filter((failure) => {
  return !failure.startsWith('pagesWithManualAdUnits:');
});

if (critical.length) {
  console.error('SEO/ad readiness verification failed:');
  for (const failure of critical) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('SEO/ad readiness verification passed.');
