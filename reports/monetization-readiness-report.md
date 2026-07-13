# Monetization Readiness Report

Generated: 2026-07-13T12:50:54.682Z

## Metrics

- monetizationMode: PENDING_OWNER_CONFIGURATION
- adsenseConfigurationStatus: PENDING_REAL_PUBLISHER_ID
- adsenseSubmissionReady: false
- publisherIdValid: false
- clientIdValid: true
- adsTxtValid: true
- adsTxtPublisherMatch: true
- standardEligiblePages: 224
- standardPagesWithLoader: 0
- standardPagesMissingLoader: 0
- duplicateAdSenseLoaders: 0
- manualSidebarAdsEnabled: false
- manualSidebarAdsConfigured: false
- manualAdUnits: 0
- visibleSidebarAds: 0
- whiteSidebarBoxes: 0
- reservedSidebarColumns: 0
- h5AccessApproved: false
- h5Enabled: false
- h5Configured: false
- h5EligibleGameDocuments: 158
- h5GameDocumentsWithLoader: 0
- h5GameDocumentsMissingLoader: 0
- h5BootstrapCount: 0
- duplicateH5Bootstrap: 0
- adConfigCount: 0
- duplicateAdConfig: 0
- h5InterstitialsEnabled: false
- h5RewardedEnabled: false
- h5TestMode: false
- productionTestModeLeaks: 0
- adBreakCallSites: 1
- unsafeAdBreakCallSites: 0
- adBreakCallsInsideLoops: 0
- adBreakCallsInsideCallbacks: 0
- rewardGrantedFromAdViewedOnly: true
- duplicateRewardRisk: 0
- gamePauseResumeCoverage: true
- autoAdsH5ConflictRisk: NONE_WHILE_H5_DISABLED
- consentOwnerActionsOutstanding: true

## Result

All normal monetization checks passed.

## Page Eligibility Matrix

| Page type | Standard loader | Auto Ads candidate | Manual sidebars | H5 API |
|---|---:|---:|---:|---:|
| Homepage | Yes when publisher ID is valid | Yes | No | No |
| Blog index/article | Yes when publisher ID is valid | Yes | No | No |
| Category page | Yes when publisher ID is valid | Yes | No | No |
| Game detail/direct game document | Yes when publisher ID is valid | Owner/dashboard decision | Optional wide desktop | Yes only after H5 approval and flags |
| play.html outer iframe player | No production ads | No | No | No |
| Actual iframe game document | Same games/<slug>/index.html document | Exclude in dashboard if H5 is enabled | Optional only on direct detail layout | Yes only after H5 approval and flags |
| Privacy/terms/contact/compliance | No manual units | Usually excluded | No | No |
| 404/error/noindex | No | No | No | No |
