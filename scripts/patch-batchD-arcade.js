const fs = require('fs');
const path = require('path');

const batch = [
  'car-rush', 'snake-classic', 'asteroids', 'jo-jo-run', 'froggy-jump',
  'neon-brick-breaker', 'bubble-pop-classic', 'balloons-shooter', 'tappy-dumont',
  '3d-car-run', 'subway-run-5', 'color-tap-runner', 'space-asteroids-culler', 'flappy-paper-plane'
];

const gamesDir = path.join(__dirname, '..', 'games');
let report = `# CORRECT ACTION BATCH D (ARCADE) REPORT\n\n`;

batch.forEach(slug => {
    const filePath = path.join(gamesDir, slug, 'index.html');
    if (!fs.existsSync(filePath)) {
        report += `- **${slug}**: Not found\n`;
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');

    // For Arcade/Runner games, we DO NOT inject triggerCorrectAnswer on every score increment
    // because score updates every frame. We rely entirely on the ffCheckScoreMilestone logic
    // which was patched in the previous phase to safely throttle rewards.
    
    const hasMilestoneGuard = content.includes('ffLastRewardMilestone');
    
    report += `- **${slug}**: Checked. Milestone Guard Present: ${hasMilestoneGuard ? 'Yes' : 'No'}.\n`;
});

fs.writeFileSync(path.join(__dirname, '..', 'CORRECT_ACTION_BATCH_D_ARCADE_REPORT.md'), report);
console.log('Batch D complete.');
