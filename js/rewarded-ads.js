/* rewarded-ads.js - compatibility shim for the shared H5 controller */

(function() {
    if (window.FFH5Ads && window.FFRewardedAds) return;
    var script = document.createElement('script');
    script.src = '/js/h5-ads-controller.js';
    script.async = false;
    document.head.appendChild(script);
})();
