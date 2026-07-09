# Runtime Score and Reward Flow Report

*Note: Automated Playwright tests are mocked in this environment. This report verifies the required AST patterns and handlers to ensure the runtime flow is intact.*

## true-or-false
- **Score Updates**: Pass
- **Wrong Action Guard**: Pass
- **Reward Triggers**: Pass (Coin Rain Enabled)
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## connect-the-dots
- **Score Updates**: Pass
- **Wrong Action Guard**: Pass
- **Reward Triggers**: Pass (Coin Rain Enabled)
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## antidote-mixer
- **Score Updates**: Warn (May use different pattern)
- **Wrong Action Guard**: Warn (May not use isOver)
- **Reward Triggers**: Pass (Coin Rain Enabled)
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## tic-tac-toe
- **Score Updates**: Warn (May use different pattern)
- **Wrong Action Guard**: Warn (May not use isOver)
- **Reward Triggers**: Pass (Coin Rain Enabled)
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## 2048
- **Score Updates**: Pass
- **Wrong Action Guard**: Warn (May not use isOver)
- **Reward Triggers**: Pass (Coin Rain Enabled)
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## car-rush
- **Score Updates**: Pass
- **Wrong Action Guard**: Pass
- **Reward Triggers**: Pass (Coin Rain Enabled)
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## snake-classic
- **Score Updates**: Pass
- **Wrong Action Guard**: Warn (May not use isOver)
- **Reward Triggers**: Pass (Coin Rain Enabled)
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## jo-jo-run
- **Score Updates**: Warn (May use different pattern)
- **Wrong Action Guard**: Pass
- **Reward Triggers**: Pass (Coin Rain Enabled)
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## archery-master
- **Score Updates**: Warn (May use different pattern)
- **Wrong Action Guard**: Warn (May not use isOver)
- **Reward Triggers**: Fail
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

## daily-word-puzzle
- **Score Updates**: Warn (May use different pattern)
- **Wrong Action Guard**: Warn (May not use isOver)
- **Reward Triggers**: Fail
- **Wallet Persistence**: Pass (Delegated to game-rewards.js)

