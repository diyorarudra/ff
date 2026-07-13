/* h5-ads-controller.js - guarded Google H5 Games Ads controller for FFLivePlay */

(function() {
    'use strict';

    var DEFAULT_COOLDOWN_MS = 120000;
    var state = {
        initialized: false,
        enabled: false,
        interstitialsEnabled: false,
        rewardedEnabled: false,
        adBreakInProgress: false,
        lastAttemptAt: 0,
        lastResult: null,
        cooldownMs: DEFAULT_COOLDOWN_MS,
        soundEnabled: true,
        wasRunningBeforeAd: false,
        rewardRequestId: 0
    };

    function now() {
        return Date.now();
    }

    function log(message, detail) {
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            if (detail !== undefined) console.log('[FFH5Ads] ' + message, detail);
            else console.log('[FFH5Ads] ' + message);
        }
    }

    function safeCall(fn, fallback) {
        try {
            return typeof fn === 'function' ? fn() : fallback;
        } catch (error) {
            log('callback failed safely', error);
            return fallback;
        }
    }

    function hasApi() {
        return typeof window.adBreak === 'function' && typeof window.adConfig === 'function';
    }

    function isAvailable() {
        return state.enabled === true && hasApi();
    }

    function cooldownActive() {
        return now() - state.lastAttemptAt < state.cooldownMs;
    }

    function dispatch(name, detail) {
        safeCall(function() {
            window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
        });
    }

    function pauseForAd() {
        state.wasRunningBeforeAd = safeCall(function() {
            if (typeof window.FF_GAME_IS_RUNNING === 'boolean') return window.FF_GAME_IS_RUNNING;
            return document.visibilityState === 'visible';
        }, false);
        dispatch('FF_H5_AD_BEFORE', { wasRunning: state.wasRunningBeforeAd });
        safeCall(function() {
            if (typeof window.FF_PAUSE_GAME_FOR_AD === 'function') window.FF_PAUSE_GAME_FOR_AD();
        });
    }

    function resumeAfterAd() {
        dispatch('FF_H5_AD_AFTER', { resume: state.wasRunningBeforeAd });
        safeCall(function() {
            if (state.wasRunningBeforeAd && typeof window.FF_RESUME_GAME_AFTER_AD === 'function') {
                window.FF_RESUME_GAME_AFTER_AD();
            }
        });
        state.wasRunningBeforeAd = false;
    }

    function finish(result) {
        state.adBreakInProgress = false;
        state.lastResult = result || { status: 'done' };
        dispatch('FF_H5_AD_DONE', state.lastResult);
    }

    function requestPlacement(options) {
        if (!isAvailable()) return { ok: false, reason: 'h5_ads_unavailable' };
        if (state.adBreakInProgress) return { ok: false, reason: 'ad_break_in_progress' };
        if (cooldownActive()) return { ok: false, reason: 'ad_break_cooldown' };

        state.adBreakInProgress = true;
        state.lastAttemptAt = now();

        try {
            window.adBreak(options);
            return { ok: true };
        } catch (error) {
            resumeAfterAd();
            finish({ status: 'error', error: String(error && error.message ? error.message : error) });
            return { ok: false, reason: 'ad_break_error' };
        }
    }

    function requestNaturalBreakAd(name) {
        if (!state.interstitialsEnabled) return { ok: false, reason: 'interstitials_disabled' };
        return requestPlacement({
            type: 'next',
            name: name || 'natural_break',
            beforeAd: pauseForAd,
            afterAd: resumeAfterAd,
            adBreakDone: function(info) {
                finish({ status: 'done', placement: name || 'natural_break', info: info || null });
            }
        });
    }

    function requestStartAd() {
        return requestNaturalBreakAd('game_start');
    }

    function showToast(message) {
        if (window.FFRewards && typeof window.FFRewards.showToast === 'function') {
            window.FFRewards.showToast(message);
        } else {
            log(message);
        }
    }

    function grantRewardOnce(request, coins, xp, callback) {
        if (request.granted) return;
        request.granted = true;
        safeCall(function() {
            if (window.FFRewards) {
                if (coins > 0 && typeof window.FFRewards.addCoins === 'function') window.FFRewards.addCoins(coins);
                if (xp > 0 && typeof window.FFRewards.addXP === 'function') window.FFRewards.addXP(xp);
                if (typeof window.FFRewards.updateUI === 'function') window.FFRewards.updateUI();
                window.dispatchEvent(new CustomEvent('ffrewards:wallet-updated'));
            }
            if (typeof callback === 'function') callback();
        });
    }

    function requestRewardedAd(options) {
        options = options || {};
        if (!state.rewardedEnabled) return { ok: false, reason: 'rewarded_ads_disabled' };

        var coins = Number(options.rewardCoins || 10);
        var xp = Number(options.rewardXP || 0);
        var request = {
            id: ++state.rewardRequestId,
            granted: false
        };

        return requestPlacement({
            type: 'reward',
            name: options.name || 'optional_coin_reward',
            beforeAd: pauseForAd,
            afterAd: resumeAfterAd,
            beforeReward: function(showAdFn) {
                safeCall(function() {
                    if (typeof showAdFn === 'function') showAdFn();
                });
            },
            adDismissed: function() {
                showToast('Ad not completed. No reward added.');
            },
            adViewed: function() {
                grantRewardOnce(request, coins, xp, options.onReward);
                showToast('Reward claimed! +' + coins + ' coins');
            },
            adBreakDone: function(info) {
                finish({ status: request.granted ? 'reward_granted' : 'done_no_reward', placement: options.name || 'optional_coin_reward', info: info || null });
            }
        });
    }

    function setSoundEnabled(enabled) {
        state.soundEnabled = enabled === true;
        if (isAvailable()) {
            safeCall(function() {
                window.adConfig({ sound: state.soundEnabled ? 'on' : 'off' });
            });
        }
    }

    function initialize(options) {
        options = options || {};
        state.initialized = true;
        state.enabled = options.enabled === true;
        state.interstitialsEnabled = options.interstitialsEnabled === true;
        state.rewardedEnabled = options.rewardedEnabled === true;
        state.cooldownMs = DEFAULT_COOLDOWN_MS;
        state.soundEnabled = options.soundEnabled !== false;

        if (!isAvailable()) {
            log('initialized dormant');
            return getStatus();
        }

        safeCall(function() {
            window.adConfig({
                preloadAdBreaks: options.preloadAdBreaks === 'auto' ? 'auto' : 'on',
                sound: state.soundEnabled ? 'on' : 'off'
            });
        });
        log('initialized');
        return getStatus();
    }

    function getStatus() {
        return {
            initialized: state.initialized,
            enabled: state.enabled,
            available: isAvailable(),
            interstitialsEnabled: state.interstitialsEnabled,
            rewardedEnabled: state.rewardedEnabled,
            adBreakInProgress: state.adBreakInProgress,
            cooldownActive: cooldownActive(),
            lastAttemptAt: state.lastAttemptAt,
            lastResult: state.lastResult,
            soundEnabled: state.soundEnabled
        };
    }

    window.FFH5Ads = {
        initialize: initialize,
        isAvailable: isAvailable,
        requestStartAd: requestStartAd,
        requestNaturalBreakAd: requestNaturalBreakAd,
        requestRewardedAd: requestRewardedAd,
        setSoundEnabled: setSoundEnabled,
        pauseForAd: pauseForAd,
        resumeAfterAd: resumeAfterAd,
        getStatus: getStatus
    };

    window.FFRewardedAds = {
        canRequestAdBreak: function() {
            return isAvailable() && !state.adBreakInProgress && !cooldownActive();
        },
        isAvailable: function() {
            return isAvailable() && state.rewardedEnabled;
        },
        showRewardedAd: requestRewardedAd
    };
})();
