const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://www.ffliveplay.com';

const shortGameSlugs = [
  'archery-master', 'asteroids', 'ball-sort-puzzle', 'bike-stunt-challenge',
  'bollywood-quiz-battle', 'bus-driver-route', 'color-sort-puzzle',
  'cricket-batting-challenge', 'cricket-quiz-league', 'crime-scramble',
  'crossword-mini', 'daily-brain-training', 'daily-word-puzzle',
  'emoji-movie-guess', 'english-word-challenge', 'escape-room-mini',
  'find-the-difference', 'gk-quiz-india', 'guess-the-city',
  'hexa-block-puzzle', 'hidden-object-rooms', 'idle-farm-tycoon',
  'idle-restaurant-tycoon', 'idle-shop-manager', 'letter-hunt',
  'logo-guess-game', 'match-3-gems', 'merge-animals', 'merge-cars',
  'merge-numbers', 'minesweeper', 'nonogram-picture-puzzle',
  'number-memory-challenge', 'parking-master', 'penalty-shootout',
  'reaction-speed-test', 'riddle-master', 'traffic-control',
  'water-sort-puzzle', 'wood-block-puzzle', 'word-connect'
];

const blogFiles = fs.readdirSync(path.join(root, 'blog'))
  .filter(file => file.endsWith('.html') && file !== 'index.html')
  .sort();

function titleFromSlug(slug) {
  return slug.split('-').map(word => {
    if (word.toLowerCase() === 'html5') return 'HTML5';
    if (word.toLowerCase() === 'web3') return 'Web3';
    if (word.toLowerCase() === 'cpm') return 'CPM';
    if (word.toLowerCase() === 'cpc') return 'CPC';
    if (word.toLowerCase() === 'api') return 'API';
    if (word.toLowerCase() === 'npc') return 'NPC';
    if (word.toLowerCase() === 'mmos') return 'MMOs';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
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

function gameProfile(slug) {
  const name = titleFromSlug(slug);
  const profiles = {
    'archery-master': ['line up each shot, account for moving targets, and release only when the reticle is steady', 'aim with the pointer or touch, then release to shoot; on desktop, use small mouse movements for cleaner aim', 'hits and streaks matter more than rushed arrows', 'missing too many shots or letting the target window close ends the run', 'reset after a poor opening rather than fighting a bad rhythm', 'wait half a beat after a target changes direction before firing'],
    'asteroids': ['steer through drifting rocks, keep space around the ship, and clear threats before the screen fills', 'use keyboard movement on desktop and on-screen arrows on mobile', 'destroyed asteroids and survival time build the score', 'collisions or being boxed in end the attempt', 'restart when the field gets crowded and practice using the edges early', 'tap thrust in short bursts so the ship does not slide into the next rock'],
    'ball-sort-puzzle': ['move colored balls until each tube contains a single color group', 'click or tap a tube, then choose the tube where the top ball should move', 'finishing the sorted layout completes the puzzle', 'there is no speed penalty, but poor moves can block every tube', 'restart when all spare tubes are locked by mixed colors', 'keep at least one empty tube available as a temporary workspace'],
    'bike-stunt-challenge': ['ride through stunt sections without losing balance or missing the landing line', 'use keyboard controls on desktop and touch controls on mobile for lean and movement', 'clean landings and completed sections improve the result', 'crashing or landing at a bad angle stops the run', 'restart after repeated over-rotations to rebuild timing from the first ramp', 'hold inputs briefly; long presses are what usually flip the bike too far'],
    'bollywood-quiz-battle': ['answer film and celebrity questions before the round moves on', 'click or tap the answer you believe is correct', 'correct choices raise the score while misses break momentum', 'a wrong answer or timeout costs the question', 'restart when you want a fresh set of prompts', 'scan for actor, song, or film-title clues before choosing'],
    'bus-driver-route': ['guide the bus through the route while avoiding awkward turns and missed lanes', 'use arrow keys or on-screen directional buttons', 'completed route segments and clean driving increase progress', 'collisions and missed control timing can end the attempt', 'restart to practice the first turns until the bus feels predictable', 'begin turns early because the bus needs more space than a small car'],
    'color-sort-puzzle': ['rearrange colors until each container has one clean color stack', 'tap a source, then tap the destination that can accept the top color', 'the puzzle is solved when all stacks are complete', 'bad moves can trap colors under incompatible pieces', 'restart if no legal move opens an empty buffer', 'move repeated colors together before filling the last open container'],
    'cricket-batting-challenge': ['time each shot so the bat meets the ball cleanly', 'use click, tap, or the shown hit control as the ball arrives', 'well-timed hits score more than early swings', 'mistimed shots or missed deliveries reduce the chance of a long innings', 'restart to practice the release point after several late swings', 'watch the bowler motion instead of only the ball once it is close'],
    'cricket-quiz-league': ['pick the correct cricket answer from each set of options', 'tap or click one answer per question', 'correct answers move the league score forward', 'wrong answers or rushed guesses stop the streak', 'restart when you want a clean quiz run', 'separate rule questions from player-history questions before answering'],
    'crime-scramble': ['unscramble clues and connect evidence into the right order', 'use keyboard entry or taps depending on the active clue', 'solved clues advance the investigation', 'wrong guesses slow the round and can leave clues unresolved', 'restart if the clue order becomes confusing', 'read every clue as evidence, not just as a word puzzle'],
    'crossword-mini': ['fill the compact crossword grid using the clues on the page', 'select a square and type letters from the keyboard or mobile input', 'completed words solve the grid', 'incorrect letters block intersecting answers', 'restart to clear the grid when several crossings conflict', 'solve the shortest confirmed answer first to unlock more crossings'],
    'daily-brain-training': ['complete quick mental tasks across math, memory, reaction, and pattern rounds', 'tap answers, repeat patterns, or wait for the reaction prompt depending on the round', 'accurate answers and fast reactions raise the score', 'wrong taps and timeouts end a round', 'restart for a fresh ten-round session', 'slow down on pattern rounds; one careful answer is better than a fast miss'],
    'daily-word-puzzle': ['solve the daily word challenge by testing letters and narrowing the answer', 'type or tap letters shown by the puzzle', 'fewer hints and correct guesses produce a better result', 'too many wrong guesses waste the round', 'restart to clear guesses and try a new approach', 'look for common prefixes or endings before spending hints'],
    'emoji-movie-guess': ['decode the movie title represented by emoji clues', 'tap or click the answer option that matches the clue', 'correct guesses advance the score', 'wrong guesses cost the question', 'restart to try another clue sequence', 'say the emoji sequence out loud; it often hints at the title order'],
    'english-word-challenge': ['find or build the requested English word from the available letters', 'use keyboard input or tap letters on mobile', 'correct words score points and unlock the next prompt', 'wrong guesses and excess hints lower the result', 'restart when the letter set no longer helps', 'check vowels first so you can see which word shapes are possible'],
    'escape-room-mini': ['inspect the room, solve clues, and unlock the exit', 'click or tap objects, clues, and answer choices', 'progress comes from solved locks and discovered hints', 'missed clues leave the room unsolved', 'restart to reset the puzzle sequence', 'treat numbers, colors, and repeated symbols as possible lock clues'],
    'find-the-difference': ['compare two scenes and mark the visual changes', 'tap or click the spot where one image differs from the other', 'found differences complete the scene', 'wrong taps waste time and attention', 'restart if you want to scan from the beginning', 'divide the image into corners and edges before checking the center'],
    'gk-quiz-india': ['answer general-knowledge questions with an India-focused mix of topics', 'click or tap one answer choice', 'correct answers increase the quiz score', 'incorrect answers break the run', 'restart for a new clean attempt', 'watch for wording that asks for first, largest, capital, or current category'],
    'guess-the-city': ['identify the city from the clue shown on screen', 'choose the answer with a click or tap', 'correct guesses move the round forward', 'wrong answers cost the attempt', 'restart to try a fresh set of city clues', 'use landmark, language, climate, and region hints together'],
    'hexa-block-puzzle': ['place hex-style blocks so lines and spaces clear efficiently', 'drag or tap pieces into the board area', 'completed lines and smart placements raise the score', 'the game stalls when no piece fits', 'restart after filling isolated gaps that cannot be used', 'keep central space open for larger pieces'],
    'hidden-object-rooms': ['search the room and find the listed hidden objects', 'tap or click objects once you identify them', 'each correct find advances the list', 'random taps waste time and can hide your search pattern', 'restart to reset the object list', 'scan by object size first, then by color and outline'],
    'idle-farm-tycoon': ['grow the farm economy by upgrading production steadily', 'click or tap farm actions and upgrade buttons', 'income and unlocked upgrades mark progress', 'poor upgrade order slows growth rather than ending the game', 'restart when you want to optimize the opening path', 'upgrade bottlenecks before buying another slow producer'],
    'idle-restaurant-tycoon': ['expand restaurant income by balancing service and upgrades', 'tap or click production and upgrade controls', 'higher earnings and unlocked stations show progress', 'overspending on one area slows the loop', 'restart to test a faster upgrade route', 'improve the slowest service step before expanding capacity'],
    'idle-shop-manager': ['manage shop growth by buying upgrades at the right time', 'use clicks or taps to collect and upgrade', 'income rate and unlocked shop features show progress', 'bad timing slows the run but does not instantly fail', 'restart to compare upgrade strategies', 'avoid spending everything if the next upgrade is close'],
    'letter-hunt': ['spot the requested letters quickly and accurately', 'tap or click matching letters as they appear', 'correct finds increase the score', 'wrong taps and time pressure reduce the round', 'restart for a fresh letter set', 'focus on letter shape rather than reading whole rows'],
    'logo-guess-game': ['identify brands or symbols from visual logo clues', 'choose or enter the answer shown by the game', 'correct guesses move the score forward', 'wrong guesses cost time and momentum', 'restart to try a clean logo run', 'look for color pairings and letter fragments before guessing'],
    'match-3-gems': ['swap gems to create lines of three or more', 'drag or tap adjacent gems to swap them', 'matches and chains increase the score', 'the board can stall if you chase isolated moves', 'restart when you want a new board layout', 'set up vertical and horizontal matches that trigger together'],
    'merge-animals': ['combine matching animals to create higher-level animals and open space', 'drag or tap matching pieces according to the board controls', 'new merges and higher tiers drive progress', 'the board fails when pieces fill the available space', 'restart when early low-tier pieces block the board', 'merge near the center so new pieces have room to move'],
    'merge-cars': ['combine matching cars and build toward higher tiers', 'drag or tap cars into matching positions', 'each successful merge improves the garage value', 'a crowded board slows or blocks new merges', 'restart to practice a cleaner upgrade path', 'keep one lane open for incoming cars'],
    'merge-numbers': ['combine equal numbers to create larger values', 'use swipe, arrow, or on-screen movement controls as shown', 'larger merged numbers raise the result', 'the run ends when the board has no useful movement left', 'restart if early moves trap small numbers in corners', 'choose one corner for the largest number and protect it'],
    'minesweeper': ['clear safe squares while avoiding hidden mines', 'click or tap squares, and use flagging where available', 'the board is won when every safe square is revealed', 'opening a mine ends the game', 'restart to try a new mine layout', 'use numbered squares to prove safe spaces before guessing'],
    'nonogram-picture-puzzle': ['fill the grid by matching row and column number clues', 'tap cells to mark filled or empty states', 'a correct pattern reveals the picture', 'wrong assumptions cause contradictions across rows and columns', 'restart when too many marks conflict', 'complete certain rows first before solving uncertain intersections'],
    'number-memory-challenge': ['memorize the shown number sequence and repeat it accurately', 'tap the number pad in the same order', 'longer correct sequences increase progress', 'a wrong digit or timeout ends the round', 'restart to begin with a fresh sequence', 'chunk long numbers into pairs instead of memorizing one digit at a time'],
    'parking-master': ['park the vehicle without bumping obstacles or overshooting the bay', 'use arrow keys or directional touch buttons', 'clean parking and controlled movement complete the stage', 'collisions or bad positioning stop progress', 'restart if the first turn leaves the car at a poor angle', 'reverse slowly and straighten before the final approach'],
    'penalty-shootout': ['place the shot where the keeper cannot reach it', 'aim and shoot with tap, click, or the shown control', 'accurate shots score goals', 'misses or saves cost attempts', 'restart for another shootout sequence', 'change placement after each shot so the keeper pattern is harder to read'],
    'reaction-speed-test': ['respond as soon as the game shows the correct signal', 'wait for the prompt, then tap or click immediately', 'faster valid reactions earn a better result', 'early taps or slow responses hurt the round', 'restart to measure another attempt', 'keep your finger ready but do not press before the signal changes'],
    'riddle-master': ['solve each riddle from its wording rather than guessing randomly', 'type or choose the answer shown by the interface', 'correct answers advance the set', 'wrong answers and excess hints reduce the result', 'restart to attempt the riddles cleanly', 'look for double meanings and literal wording before using a hint'],
    'traffic-control': ['direct traffic safely through the intersection without collisions', 'tap or click vehicles, signals, or lanes according to the active controls', 'smooth traffic flow and avoided crashes improve progress', 'a collision or gridlock ends the attempt', 'restart when the intersection becomes unrecoverable', 'clear the fastest lane first, then handle slow vehicles before they stack up'],
    'water-sort-puzzle': ['pour water colors until every bottle contains one color', 'tap a source bottle, then tap a compatible destination bottle', 'the puzzle is solved when all colors are grouped', 'bad pours can trap colors under the wrong stack', 'restart if no bottle can free the buried color', 'keep one bottle empty until the final cleanup'],
    'wood-block-puzzle': ['place wooden shapes to complete rows and columns', 'drag or tap pieces into the grid', 'cleared lines and efficient placement raise the score', 'the game ends when no current piece fits', 'restart after leaving isolated single-cell gaps', 'save wide open spaces for awkward large pieces'],
    'word-connect': ['connect letters to form valid words from the puzzle set', 'drag across letters or tap them in order', 'found words fill the list and increase progress', 'random letter chains waste time and hide real patterns', 'restart to clear the board and think from scratch', 'try common endings like ing, er, and ed after finding the base word']
  };
  return profiles[slug] || [`understand the goal of ${name} and complete the round with careful inputs`, 'use the controls shown by the game on desktop or mobile', 'successful actions and completed rounds improve the result', 'mistakes or missed timing can end the attempt', 'restart from the visible play-again control', 'slow down until the pattern becomes clear'];
}

function richGameGuidance(slug) {
  const name = titleFromSlug(slug);
  const [objective, controls, scoring, failure, restart, tip] = gameProfile(slug);
  return `<section class="game-guidance mt-8 text-left" data-game-guidance="true" data-content-remediated="true">
          <h2 class="text-2xl font-bold mb-3">How to Play ${escapeHtml(name)}</h2>
          <p><strong>Goal:</strong> ${escapeHtml(objective)}.</p>
          <p><strong>Controls:</strong> ${escapeHtml(controls)}.</p>
          <p><strong>Progress:</strong> ${escapeHtml(scoring)}.</p>
          <p><strong>Watch out:</strong> ${escapeHtml(failure)}.</p>
          <p><strong>Restart:</strong> ${escapeHtml(restart)}.</p>
          <p><strong>Tip:</strong> ${escapeHtml(tip)}.</p>
        </section>`;
}

function replaceGameGuidance() {
  let changed = 0;
  for (const slug of shortGameSlugs) {
    const file = path.join(root, 'games', slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const next = html.replace(/<section\b[^>]*data-game-guidance=["']true["'][\s\S]*?<\/section>/i, richGameGuidance(slug));
    if (next !== html) {
      fs.writeFileSync(file, next);
      changed++;
    }
  }
  return changed;
}

function blogPlan(slug, title) {
  const lower = slug.toLowerCase();
  if (slug === 'advanced-diversification-techniques-in-digital-equities-for-the-2026-macro-economy') {
    return {
      title: 'Advanced Diversification Techniques for Browser Game Revenue',
      description: 'Practical ways browser game publishers can reduce monetization risk with ads, sponsorships, subscriptions, direct deals, and player-first design.',
      angle: 'monetization risk for independent browser-game publishers',
      sections: [
        ['Why one revenue source is fragile', 'A small HTML5 game site can be affected by ad fill changes, seasonal traffic, platform policy updates, or a single placement that performs poorly. Diversification does not mean chasing every monetization idea at once. It means designing the game and surrounding site so one weak channel does not make the whole project unstable.'],
        ['Options that fit browser games', 'Display ads, rewarded placements, sponsorships, optional subscriptions, direct licensing, newsletter sponsorships, and studio services all have different tradeoffs. The safest mix is usually the one that keeps the core game playable without pressure and uses monetization only at natural breaks.'],
        ['What to avoid', 'Avoid investment-style language, fixed revenue promises, or advice that sounds like financial planning for players. The useful question for a game publisher is operational: which income sources can be tested without damaging trust, accessibility, or page speed?'],
        ['A practical review checklist', 'Before adding a new revenue stream, check whether it affects load time, control visibility, privacy disclosures, content quality, and repeat play. If the answer is unclear, test it on a small set of pages first and keep a rollback path.']
      ],
      faq: [
        ['Should a browser game rely only on ads?', 'Not necessarily. Ads can be part of a sustainable mix, but relying on one channel makes policy changes and traffic swings harder to absorb.'],
        ['Does this recommend financial products?', 'No. This article discusses operational choices for game publishers, not financial products, trading, or investing.'],
        ['What is the safest first step?', 'Keep the game usable without monetization, then test one clearly disclosed revenue feature at a natural break.']
      ],
      links: ['maximizing-adsense-revenue-without-ruining-user-experience', 'the-ethics-of-game-monetization']
    };
  }
  let angle = `${title.toLowerCase()} in browser games`;
  let sections = [
    ['Where the topic affects play', `${title} matters when it changes what a player can understand, feel, or do in the first minute. On a browser game site, the idea should support fast loading, clear controls, and a game loop that remains readable on both desktop and mobile.`],
    ['Implementation choices', `A practical implementation starts with the smallest useful version. Define the player-facing purpose first, then choose browser APIs, assets, timing, or content patterns that support that purpose without adding confusing interface weight.`],
    ['Quality checks', `The strongest check is to load the page as a player would: start the game, make a mistake, recover, and restart. If ${title.toLowerCase()} does not improve one of those moments, simplify it.`]
  ];
  let faq = [
    [`How should teams approach ${title.toLowerCase()}?`, 'Start with the player problem, then choose the simplest implementation that solves it without slowing the page or hiding controls.'],
    ['Does every HTML5 game need this?', 'No. Some games benefit from the idea directly, while simpler games may only need a small version or a checklist.'],
    ['What should be tested before publishing?', 'Test mobile layout, keyboard or touch input, restart flow, page speed, and whether the visible text matches the actual game experience.']
  ];
  if (/(audio|sound|music)/.test(lower)) {
    sections = [
      ['Sound should explain the game state', 'Good audio gives feedback for success, danger, timing, and progress without forcing the player to rely on sound alone. Browser games should keep visual feedback complete for muted devices and public spaces.'],
      ['A lightweight browser approach', 'Use short effects, lazy initialization after user interaction, and clear mute behavior. Avoid autoplay assumptions because browsers often block audio until the player interacts.'],
      ['Testing without headphones', 'Check whether the game still makes sense when muted. Audio should improve the experience, not carry essential instructions by itself.']
    ];
  } else if (/(monetization|adsense|rewarded|cpm|cpc|purchases|revenue)/.test(lower)) {
    sections = [
      ['Player trust comes first', `${title} should never make the game feel blocked, deceptive, or built only for ads. Monetization is safest when placements are disclosed, sparse, and tied to natural pauses.`],
      ['Measure without overreaching', 'Track page views and meaningful game events, but avoid personal data in labels or event payloads. Revenue metrics should be used to improve placement quality, not to pressure players.'],
      ['Policy-safe review', 'Before publishing, check privacy language, ad density, accidental clicks, mobile control visibility, and whether rewards are granted only after confirmed completion.']
    ];
  } else if (/(web3|cloud|future|wasm|webassembly|webgpu|decentralized)/.test(lower)) {
    sections = [
      ['Treat emerging technology as optional', `${title} can be useful, but browser games should keep the core play loop independent from experimental infrastructure. The player should still be able to load, play, fail, and restart without special accounts or devices.`],
      ['Use careful language', 'Avoid presenting predictions as settled facts. It is safer to describe tradeoffs, current browser support, and fallback behavior than to promise what the market will do next.'],
      ['Fallback planning', 'Progressive enhancement is the practical rule: serve a stable baseline first, then add advanced rendering or platform features only when the browser supports them.']
    ];
  } else if (/(community|reddit|twitter|streamers|creators|trailer|sales|launch|growth)/.test(lower)) {
    sections = [
      ['Promotion should match the game', `${title} works best when the pitch is specific: what the game asks the player to do, what makes a round interesting, and why a viewer would understand it quickly.`],
      ['Avoid inflated claims', 'Do not invent player counts, conversion rates, or creator results. Use observable details such as mechanics, controls, screenshots, and update notes.'],
      ['Useful publishing habit', 'Keep links honest and focused. A few relevant internal links help readers continue, while broad link blocks make the page feel manufactured.']
    ];
  } else if (/(narrative|story|dialogue|lore|avatar|horror|twist|choice)/.test(lower)) {
    sections = [
      ['Story has to serve interaction', `${title} is strongest when it changes what the player notices or decides. Even a short browser game can use theme, text, and pacing to make actions feel intentional.`],
      ['Keep text playable', 'Short prompts, readable labels, and immediate feedback usually work better than long exposition. The player should not have to stop playing to understand the premise.'],
      ['Check the ending and restart', 'A story beat should not trap the player after failure. Make sure the restart path is visible and the next attempt still makes sense.']
    ];
  } else if (/(collision|canvas|animation|requestanimationframe|object-pooling|latency|state|localstorage|offscreen|lighting|parallax|sprite|performance)/.test(lower)) {
    sections = [
      ['Technical choices should be visible in play quality', `${title} matters because players feel dropped frames, delayed input, and confusing collisions immediately. The goal is not complexity; it is stable feedback during ordinary play.`],
      ['Implementation notes', 'Prefer small loops, predictable state updates, measured asset loading, and defensive fallbacks. Code examples should be tested against the actual browser behavior they describe.'],
      ['Debugging checklist', 'Check frame pacing, input latency, restart cleanup, mobile viewport behavior, and whether blocked optional scripts leave the core game usable.']
    ];
  } else if (/(color|interface|silhouettes|micro|camera|difficulty|tutorial)/.test(lower)) {
    sections = [
      ['Design starts with recognition', `${title} helps when players can quickly identify goals, hazards, buttons, and progress. The best visual design choice is the one that reduces hesitation during play.`],
      ['Apply it in small steps', 'Change one visible signal at a time: color, size, motion, label, or spacing. Too many simultaneous cues can make a simple browser game feel noisy.'],
      ['Review on mobile', 'A design that reads well on desktop can fail on a phone. Check touch targets, contrast, line length, and whether important state is hidden below the game area.']
    ];
  }
  return {
    title,
    description: `A practical guide to ${title.toLowerCase()} for HTML5 and browser games, focused on player clarity, performance, trust, and production-ready design.`,
    angle,
    sections,
    faq,
    links: ['the-evolution-of-html5-canvas-in-modern-browser-gaming', 'understanding-the-requestanimationframe-game-loop']
  };
}

function articleBody(plan) {
  const toc = plan.sections.map(([heading], i) => `<li><a href="#section-${i + 1}" class="text-cyan-600 hover:underline font-medium">${i + 1}. ${escapeHtml(heading)}</a></li>`).join('\n                ');
  const sections = plan.sections.map(([heading, body], i) => `
        <h2 id="section-${i + 1}" class="text-2xl font-bold mt-10 mb-4 text-gray-900">${escapeHtml(heading)}</h2>
        <p>${escapeHtml(body)}</p>`).join('\n');
  const faq = plan.faq.map(([q, a]) => `<div><h4 class="font-bold text-gray-900 text-lg mb-1">${escapeHtml(q)}</h4><p class="text-gray-700 m-0">${escapeHtml(a)}</p></div>`).join('\n            ');
  const links = plan.links.map(slug => `<a href="/blog/${slug}" class="p-5 bg-white rounded-xl border border-gray-200 hover:border-cyan-400 hover:shadow-md transition-all block group"><span class="text-xs font-bold text-cyan-600 block mb-2 uppercase tracking-wider">Related Guide</span><span class="text-gray-900 font-bold group-hover:text-cyan-500 transition-colors">${escapeHtml(titleFromSlug(slug))} &rarr;</span></a>`).join('\n                ');
  const conclusion = `For ${plan.title.toLowerCase()}, the strongest version is the one a player can verify on the page: clear purpose, honest wording, and cautious claims. Use the idea where it improves the browser-game experience, then remove anything that distracts from play.`;
  return `
        <p>${escapeHtml(plan.title)} is useful on FFLivePlay when it helps a player understand the game faster, recover from mistakes, or trust the page around the game. This guide keeps the focus on practical browser-game decisions rather than broad claims or unsupported predictions.</p>
        <div class="toc bg-gray-50 p-4 rounded-xl my-6 border border-gray-100">
            <h3 class="text-xl font-bold mb-2 mt-0 text-gray-900">Contents</h3>
            <ul class="list-none p-0 m-0 space-y-2">
                ${toc}
                <li><a href="#faq" class="text-cyan-600 hover:underline font-medium">${plan.sections.length + 1}. Frequently asked questions</a></li>
            </ul>
        </div>
        ${sections}
        <h2 id="faq" class="text-2xl font-bold mt-10 mb-4 text-gray-900">Frequently Asked Questions</h2>
        <div class="space-y-6 my-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
            ${faq}
        </div>
        <p>${escapeHtml(conclusion)}</p>
        <div class="mt-12 pt-8 border-t border-gray-200">
            <h3 class="text-xl font-bold mb-6 text-gray-900">Recommended Reading</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${links}
            </div>
        </div>
      `;
}

function replaceOrInsert(html, re, replacement) {
  return re.test(html) ? html.replace(re, replacement) : html;
}

function updateJsonLd(html, type, values) {
  return html.replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (block, json) => {
    try {
      const data = JSON.parse(json);
      const types = Array.isArray(data['@type']) ? data['@type'] : [data['@type']];
      if (!types.includes(type)) return block;
      Object.assign(data, values);
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    } catch {
      return block;
    }
  });
}

function remediateBlogs() {
  let changed = 0;
  let advancedDecision = '';
  for (const file of blogFiles) {
    const full = path.join(root, 'blog', file);
    const slug = file.replace(/\.html$/, '');
    let html = fs.readFileSync(full, 'utf8');
    const original = html;
    const oldTitle = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.trim() || titleFromSlug(slug);
    const plan = blogPlan(slug, oldTitle);
    const canonical = `${SITE_ORIGIN}/blog/${slug}`;
    html = replaceOrInsert(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(plan.title)} - ffliveplay</title>`);
    html = replaceOrInsert(html, /<h1[^>]*>[\s\S]*?<\/h1>/i, `<h1 class="text-4xl md:text-5xl font-extrabold font-heading text-gray-900 mt-6 mb-4 leading-tight">${escapeHtml(plan.title)}</h1>`);
    html = replaceOrInsert(html, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${escapeAttr(plan.description)}">`);
    html = replaceOrInsert(html, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${escapeAttr(plan.description)}">`);
    html = replaceOrInsert(html, /<meta\s+name=["']twitter:description["'][^>]*>/i, `<meta name="twitter:description" content="${escapeAttr(plan.description)}">`);
    html = replaceOrInsert(html, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${escapeAttr(`${plan.title} - ffliveplay`)}">`);
    html = replaceOrInsert(html, /<meta\s+name=["']twitter:title["'][^>]*>/i, `<meta name="twitter:title" content="${escapeAttr(`${plan.title} - ffliveplay`)}">`);
    html = updateJsonLd(html, 'BlogPosting', {
      headline: plan.title,
      description: plan.description,
      mainEntityOfPage: canonical
    });
    html = updateJsonLd(html, 'BreadcrumbList', {
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_ORIGIN}/blog` },
        { '@type': 'ListItem', position: 3, name: plan.title, item: canonical }
      ]
    });
    html = html.replace(/<div class="prose[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/article>/i, (match) => {
      const open = match.match(/<div class="prose[^"]*"[^>]*>/i)[0];
      return `${open}${articleBody(plan)}\n      </div>\n        </article>`;
    });
    if (slug === 'advanced-diversification-techniques-in-digital-equities-for-the-2026-macro-economy') {
      advancedDecision = 'kept existing URL and refocused article from investment/macro language to browser-game publisher revenue diversification';
    }
    if (html !== original) {
      fs.writeFileSync(full, html);
      changed++;
    }
  }
  return { changed, advancedDecision };
}

const gamesChanged = replaceGameGuidance();
const blogResult = remediateBlogs();
console.log(JSON.stringify({
  gamesChanged,
  blogsChanged: blogResult.changed,
  advancedDecision: blogResult.advancedDecision
}, null, 2));
