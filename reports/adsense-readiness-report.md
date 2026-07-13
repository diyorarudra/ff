# AdSense Readiness Report

Generated: 2026-07-13T08:37:50.253Z

## Metrics

- totalHtmlPages: 231
- indexablePages: 228
- gamePages: 158
- blogPages: 51
- pagesWithAdSense: 0
- pagesWithManualAdUnits: 0
- adsenseConfigurationStatus: PENDING_REAL_PUBLISHER_ID
- adsenseSubmissionReady: false
- invalidPublisherIds: 0
- invalidClientIds: 0
- placeholderPublisherIdsInSourceConfig: 1
- placeholderPublisherIdsInProductionHtml: 0
- publisherIdMismatches: 0
- adsTxtPublisherMismatch: 0
- duplicateAdSenseTags: 0
- manualAdUnits: 0
- adsenseScriptsOnExcludedPages: 0
- eligiblePagesWithLoader: 0
- eligiblePagesMissingLoader: 0
- invalidAdSenseLoaders: 0
- manualSidebarAdsEnabled: false
- manualSidebarAdsConfigured: false
- manualSidebarLeftSlotValid: false
- manualSidebarRightSlotValid: false
- gamePagesWithSidebarMarkup: 158
- gamePagesWithVisibleSidebarAds: 0
- gamePagesWithHiddenSidebarAds: 158
- gamePagesWithMissingSidebarMarkup: 0
- gamePagesWithUnexpectedManualAds: 0
- manualSidebarAdsOnExcludedPages: 0
- manualSidebarDuplicateUnits: 0
- manualSidebarLayoutReservationWhileDisabled: 0
- manualSidebarBlankWhiteContainers: 0
- missingTitles: 0
- duplicateTitles: 0
- missingDescriptions: 0
- missingCanonicals: 0
- multipleCanonicals: 0
- missingH1: 0
- multipleH1: 0
- noindexPages: 3
- brokenInternalLinks: 0
- missingLocalAssets: 0
- missingSitemapUrls: 0
- noncanonicalSitemapUrls: 0
- blogTopicMismatches: 0
- duplicateAnalyticsTags: 0
- developmentUrls: 0
- jsonLdSyntaxErrors: 0
- indexable404Pages: 0
- indexablePlayerPages: 0
- ownerActionRequired: Add the real AdSense publisher ID to scripts/site-config.js and rebuild.

## Result

All critical automated checks passed.


## Future One-Place Replacement

FFLivePlay uses scripts/site-config.js as the only AdSense configuration source.

1. Open scripts/site-config.js.
2. Replace the placeholder publisher ID with the real ID.
3. Set MANUAL_SIDEBAR_ADS_ENABLED to true.
4. Add the real left sidebar slot ID.
5. Add the real right sidebar slot ID.
6. Do not manually add ca-pub; it is generated automatically.
7. Run npm run postbuild.
8. Run npm run audit:adsense:release.
9. Run npm run build.
10. Deploy.
11. Verify the live ads.txt file.
12. Verify the game-page source.

## Manual Sidebar Workflow

### Keep manual sidebars hidden

Open scripts/site-config.js, set MANUAL_SIDEBAR_ADS_ENABLED to false, then run npm run postbuild and npm run build before deployment.

### Enable manual sidebars later

Open scripts/site-config.js.
Replace the placeholder publisher ID with the real pub- followed by 16 digits.
Set MANUAL_SIDEBAR_ADS_ENABLED to true.
Set ADSENSE_LEFT_SIDEBAR_SLOT_ID to the real left sidebar slot ID.
Set ADSENSE_RIGHT_SIDEBAR_SLOT_ID to the real right sidebar slot ID.
Then run npm run postbuild, npm run audit:adsense:release, and npm run build before deployment.

### Hide them again

Open scripts/site-config.js, change only MANUAL_SIDEBAR_ADS_ENABLED to false, then rebuild and deploy. Do not delete the reusable sidebar markup.
