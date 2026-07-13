const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'h5-ads-controller.js'), 'utf8');

function createHarness(adBreakImpl) {
  const events = [];
  const rewards = { coins: 0, xp: 0, updates: 0 };
  const context = {
    console,
    Date,
    URLSearchParams,
    location: { hostname: 'localhost', search: '' },
    document: {
      visibilityState: 'visible',
      head: { appendChild() {} },
      createElement() { return {}; }
    },
    CustomEvent: function CustomEvent(name, options) {
      this.type = name;
      this.detail = options && options.detail ? options.detail : {};
    },
    window: {
      FF_GAME_IS_RUNNING: true,
      FF_PAUSE_GAME_FOR_AD() { events.push('pause'); },
      FF_RESUME_GAME_AFTER_AD() { events.push('resume'); },
      dispatchEvent(event) { events.push(event.type); },
      FFRewards: {
        addCoins(amount) { rewards.coins += amount; },
        addXP(amount) { rewards.xp += amount; },
        updateUI() { rewards.updates += 1; },
        showToast(message) { events.push(`toast:${message}`); }
      }
    }
  };
  context.window.window = context.window;
  context.window.location = context.location;
  context.window.document = context.document;
  context.window.CustomEvent = context.CustomEvent;
  context.window.console = console;
  context.window.Date = Date;
  context.window.adConfig = function(options) {
    events.push(`config:${JSON.stringify(options)}`);
  };
  if (adBreakImpl) {
    context.window.adBreak = function(options) {
      return adBreakImpl(options, events);
    };
  }
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'h5-ads-controller.js' });
  return { context, events, rewards, api: context.window.FFH5Ads };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(name, fn) {
  try {
    fn();
    return { name, passed: true };
  } catch (error) {
    return { name, passed: false, error: error.message };
  }
}

const results = [
  run('API unavailable', () => {
    const h = createHarness(null);
    h.api.initialize({ enabled: true, interstitialsEnabled: true, rewardedEnabled: true });
    const result = h.api.requestNaturalBreakAd();
    assert(result.ok === false && result.reason === 'h5_ads_unavailable', 'missing API should no-op');
  }),
  run('Ad opportunity with no ad returned', () => {
    const h = createHarness((options) => options.adBreakDone && options.adBreakDone({ breakStatus: 'notReady' }));
    h.api.initialize({ enabled: true, interstitialsEnabled: true });
    const result = h.api.requestNaturalBreakAd('between_levels');
    assert(result.ok === true, 'request should be accepted');
    assert(h.api.getStatus().adBreakInProgress === false, 'request should finish');
  }),
  run('Interstitial shown', () => {
    const h = createHarness((options) => {
      options.beforeAd();
      options.afterAd();
      options.adBreakDone({ breakStatus: 'viewed' });
    });
    h.api.initialize({ enabled: true, interstitialsEnabled: true });
    h.api.requestNaturalBreakAd('game_over');
    assert(h.events.includes('pause') && h.events.includes('resume'), 'pause and resume should run');
  }),
  run('Interstitial dismissed', () => {
    const h = createHarness((options) => {
      options.beforeAd();
      options.afterAd();
      options.adBreakDone({ breakStatus: 'dismissed' });
    });
    h.api.initialize({ enabled: true, interstitialsEnabled: true });
    h.api.requestNaturalBreakAd();
    assert(h.api.getStatus().adBreakInProgress === false, 'dismissed ad should not remain in progress');
  }),
  run('Rewarded ad available and viewed', () => {
    const h = createHarness((options) => {
      options.beforeAd();
      options.beforeReward(() => h.events.push('showAd'));
      options.adViewed();
      options.afterAd();
      options.adBreakDone({ breakStatus: 'viewed' });
    });
    h.api.initialize({ enabled: true, rewardedEnabled: true });
    h.api.requestRewardedAd({ rewardCoins: 10, rewardXP: 2 });
    assert(h.rewards.coins === 10 && h.rewards.xp === 2, 'viewed reward should grant once');
  }),
  run('Rewarded ad dismissed', () => {
    const h = createHarness((options) => {
      options.beforeAd();
      options.adDismissed();
      options.afterAd();
      options.adBreakDone({ breakStatus: 'dismissed' });
    });
    h.api.initialize({ enabled: true, rewardedEnabled: true });
    h.api.requestRewardedAd({ rewardCoins: 10 });
    assert(h.rewards.coins === 0, 'dismissed reward should grant nothing');
  }),
  run('Rewarded ad unavailable', () => {
    const h = createHarness(null);
    h.api.initialize({ enabled: true, rewardedEnabled: true });
    const result = h.api.requestRewardedAd({ rewardCoins: 10 });
    assert(result.ok === false && h.rewards.coins === 0, 'unavailable reward should grant nothing');
  }),
  run('Callback throws', () => {
    const h = createHarness((options) => {
      options.beforeAd();
      throw new Error('mock callback failure');
    });
    h.api.initialize({ enabled: true, interstitialsEnabled: true });
    const result = h.api.requestNaturalBreakAd();
    assert(result.ok === false && h.api.getStatus().adBreakInProgress === false, 'throw should recover');
  }),
  run('Duplicate callback', () => {
    const h = createHarness((options) => {
      options.adViewed();
      options.adViewed();
      options.adBreakDone({});
    });
    h.api.initialize({ enabled: true, rewardedEnabled: true });
    h.api.requestRewardedAd({ rewardCoins: 10 });
    assert(h.rewards.coins === 10, 'duplicate adViewed should grant once');
  }),
  run('Two simultaneous requests', () => {
    const h = createHarness(() => {});
    h.api.initialize({ enabled: true, interstitialsEnabled: true });
    const first = h.api.requestNaturalBreakAd();
    const second = h.api.requestNaturalBreakAd();
    assert(first.ok === true && second.ok === false && second.reason === 'ad_break_in_progress', 'overlap should be rejected');
  }),
  run('Cooldown active', () => {
    const h = createHarness((options) => options.adBreakDone({}));
    h.api.initialize({ enabled: true, interstitialsEnabled: true });
    const first = h.api.requestNaturalBreakAd();
    const second = h.api.requestNaturalBreakAd();
    assert(first.ok === true && second.ok === false && second.reason === 'ad_break_cooldown', 'cooldown should apply');
  }),
  run('Game already paused', () => {
    const h = createHarness((options) => {
      options.beforeAd();
      options.afterAd();
      options.adBreakDone({});
    });
    h.context.window.FF_GAME_IS_RUNNING = false;
    h.api.initialize({ enabled: true, interstitialsEnabled: true });
    h.api.requestNaturalBreakAd();
    assert(!h.events.includes('resume'), 'paused game should not resume itself');
  }),
  run('Game over state', () => {
    const h = createHarness((options) => {
      options.beforeAd();
      options.afterAd();
      options.adBreakDone({});
    });
    h.context.window.FF_GAME_IS_RUNNING = false;
    h.api.initialize({ enabled: true, interstitialsEnabled: true });
    h.api.requestNaturalBreakAd('game_over');
    assert(h.api.getStatus().adBreakInProgress === false, 'game over placement should finish');
  }),
  run('Sound on', () => {
    const h = createHarness((options) => options.adBreakDone({}));
    h.api.initialize({ enabled: true, interstitialsEnabled: true, soundEnabled: true });
    assert(h.events.some((event) => event.includes('"sound":"on"')), 'sound on should be configured');
  }),
  run('Sound off', () => {
    const h = createHarness((options) => options.adBreakDone({}));
    h.api.initialize({ enabled: true, interstitialsEnabled: true, soundEnabled: false });
    assert(h.events.some((event) => event.includes('"sound":"off"')), 'sound off should be configured');
  })
];

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ passed: failed.length === 0, results }, null, 2));
if (failed.length) process.exit(1);
