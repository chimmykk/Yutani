// Telegram Bot Configuration
module.exports = {
  // Telegram Bot Token
  BOT_TOKEN: '7982684641:AAGdmJN5L96-ppjesDCRJ19Hv9PwnGTopjE',
  
  // Bot Settings
  BOT_NAME: 'WalletBot',
  BOT_USERNAME: '@your_wallet_bot',
  
  // Security Settings
  MIN_PASSPHRASE_LENGTH: 8,
  ARGON2_TIME_COST: 3,
  ARGON2_MEMORY_COST: 65536,
  ARGON2_PARALLELISM: 1,
  
  // File Storage
  WALLETS_DIR: './wallets'
};
