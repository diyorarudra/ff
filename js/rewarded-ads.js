/* rewarded-ads.js - Official H5 Games Ads wrapper for FFLivePlay */

(function() {
    function isLocalhost() {
        return location.hostname === "localhost" || location.hostname === "127.0.0.1";
    }

    function isMockEnabled() {
        if (!isLocalhost()) return false;
        const params = new URLSearchParams(window.location.search);
        return params.get("rewardedAdTest") === "1";
    }

    function isAvailable() {
        // Official AdSense H5 API check
        if (typeof adBreak === 'function' && window.adConfig) {
            // Note: In a real environment, you might also check if rewarded ads are enabled in your AdSense account
            return true;
        }
        if (isMockEnabled()) return true;
        return false;
    }

    function showToast(msg) {
        if (window.FFRewards && window.FFRewards.showToast) {
            window.FFRewards.showToast(msg);
        } else {
            console.log("Toast: " + msg);
        }
    }

    function grantReward(coins, xp, onRewardCallback) {
        if (window.FFRewards && window.FFRewards.addCoins) {
            if (coins > 0) window.FFRewards.addCoins(coins);
            if (xp > 0) window.FFRewards.addXP(xp);
            showToast(`Reward Claimed! +${coins} Coins`);
            if (window.FFRewards.updateUI) window.FFRewards.updateUI();
            
            // Dispatch wallet update just in case
            window.dispatchEvent(new CustomEvent('ffrewards:wallet-updated'));
        }
        if (onRewardCallback) onRewardCallback();
    }

    function showRewardedAd(options = {}) {
        const rewardCoins = options.rewardCoins || 10;
        const rewardXP = options.rewardXP || 0;
        const onReward = options.onReward;

        if (!isAvailable()) {
            return { ok: false, reason: "rewarded_ads_unavailable" };
        }

        // Mock Testing Mode (strictly guarded to localhost)
        if (isMockEnabled() && typeof adBreak !== 'function') {
            console.log("[FFRewardedAds] Using Mock Localhost Mode.");
            const userChoice = confirm(`[TEST MOCK]\nWatch a short ad to earn ${rewardCoins} game coins?`);
            if (userChoice) {
                console.log("[FFRewardedAds] Mock ad complete. Granting reward.");
                grantReward(rewardCoins, rewardXP, onReward);
            } else {
                console.log("[FFRewardedAds] Mock ad cancelled.");
                showToast("Ad not completed. No reward added.");
            }
            return { ok: true, mocked: true };
        }

        // Official H5 Games API
        if (typeof adBreak === 'function') {
            adBreak({
                type: 'reward',
                name: 'ffliveplay_reward',
                beforeReward: function(showAdFn) {
                    // Voluntary prompt
                    const userChoice = confirm(`Watch a short ad to earn ${rewardCoins} game coins?`);
                    if (userChoice) {
                        showAdFn();
                    } else {
                        showToast("Ad not completed. No reward added.");
                    }
                },
                adDismissed: function() {
                    console.log("[FFRewardedAds] Ad dismissed before completion.");
                    showToast("Ad not completed. No reward added.");
                },
                adViewed: function() {
                    console.log("[FFRewardedAds] Official Ad Viewed. Granting Reward.");
                    grantReward(rewardCoins, rewardXP, onReward);
                }
            });
            return { ok: true };
        }

        return { ok: false, reason: "rewarded_ads_unavailable" };
    }

    window.FFRewardedAds = {
        isAvailable,
        showRewardedAd
    };

})();
