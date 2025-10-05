const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');
const argon2 = require('argon2');
const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');
const config = require('./config');

console.log('🚀 Starting Telegram Wallet Bot...');

// Initialize Telegram Bot
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Wallet storage directory
const walletsDir = path.join(__dirname, config.WALLETS_DIR);

// Ensure wallets directory exists
async function ensureWalletsDirectory() {
  try {
    await fs.access(walletsDir);
  } catch {
    await fs.mkdir(walletsDir, { recursive: true });
  }
}

// Derive key from passphrase using Argon2id
async function deriveKey(passphrase, salt, options = {}) {
  return argon2.hash(passphrase, {
    type: argon2.argon2id,
    salt,
    hashLength: 32,
    raw: true,
    timeCost: options.timeCost ?? config.ARGON2_TIME_COST,
    memoryCost: options.memoryCost ?? config.ARGON2_MEMORY_COST,
    parallelism: options.parallelism ?? config.ARGON2_PARALLELISM,
  });
}

// AES-GCM Encrypt
function aesEncrypt(secret, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, encrypted, tag };
}

// AES-GCM Decrypt
function aesDecrypt(encrypted, key, iv, tag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// Create a new EVM wallet
function createEvmWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic?.phrase,
    createdAt: new Date().toISOString()
  };
}

// Encrypt wallet data with passphrase using Argon2
async function encryptWallet(walletData, passphrase) {
  const salt = crypto.randomBytes(16);
  const key = await deriveKey(passphrase, salt);
  const secret = JSON.stringify(walletData);
  
  const { iv, encrypted, tag } = aesEncrypt(secret, key);
  
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
    kdf: { 
      type: 'argon2id', 
      timeCost: config.ARGON2_TIME_COST, 
      memoryCost: config.ARGON2_MEMORY_COST, 
      parallelism: config.ARGON2_PARALLELISM 
    },
  };
}

// Decrypt wallet data with passphrase
async function decryptWallet(encryptedData, passphrase) {
  try {
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const key = await deriveKey(passphrase, salt, encryptedData.kdf);
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    const cipher = Buffer.from(encryptedData.ciphertext, 'base64');
    
    const decrypted = aesDecrypt(cipher, key, iv, tag);
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: wrong passphrase or corrupted data');
  }
}

// Save encrypted wallet to file
async function saveEncryptedWallet(walletData, passphrase, filename) {
  const encrypted = await encryptWallet(walletData, passphrase);
  const filePath = path.join(walletsDir, `${filename}.json`);
  await fs.writeFile(filePath, JSON.stringify(encrypted, null, 2));
  return filePath;
}

// Load and decrypt wallet from file
async function loadEncryptedWallet(filename, passphrase) {
  const filePath = path.join(walletsDir, `${filename}.json`);
  const encryptedData = JSON.parse(await fs.readFile(filePath, 'utf8'));
  return await decryptWallet(encryptedData, passphrase);
}

// User session management
const userSessions = new Map();

// Bot command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `🤖 *Welcome to Wallet Bot!*

🔐 *Secure Cryptocurrency Wallet Management*

📝 *Available Commands:*
• /create - Create a new crypto wallet
• /load - Load an existing wallet
• /list - List all your saved wallets
• /help - Show this help message

🔒 *Security Features:*
• Argon2id + AES-GCM encryption
• Passphrase-protected wallets
• Secure local storage

💡 *Example:* Send /create to get started!

⚠️ *Important:* Always use strong, unique passphrases!`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `🤖 *Wallet Bot Commands*

📝 *Available Commands:*
• /create - Create a new crypto wallet
• /load - Load an existing wallet  
• /list - List all your saved wallets
• /help - Show this help message

🔒 *Security:* Your wallets are encrypted with Argon2 and AES-GCM encryption.

💡 *Example:* Send /create to get started!`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/create/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  console.log('🔧 Starting wallet creation process...');
  userSessions.set(userId, { step: 'waiting_for_passphrase', action: 'create_wallet' });
  
  const createMessage = `🔐 *Wallet Creation Started*

Please provide a strong passphrase to encrypt your wallet. This passphrase will be used to secure your private keys.

⚠️ *Important:*
• Choose a strong, unique passphrase
• You'll need this passphrase to access your wallet
• We cannot recover your wallet if you forget the passphrase

Please send your passphrase now:`;

  bot.sendMessage(chatId, createMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/load/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  console.log('📂 Starting wallet loading process...');
  userSessions.set(userId, { step: 'waiting_for_filename', action: 'load_wallet' });
  
  const loadMessage = `📂 *Load Existing Wallet*

Please provide the filename of your wallet (without .json extension):

Example: wallet_0x12345678_1234567890`;

  bot.sendMessage(chatId, loadMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/list/, async (msg) => {
  const chatId = msg.chat.id;
  
  console.log('📋 Listing wallets...');
  try {
    const files = await fs.readdir(walletsDir);
    const walletFiles = files.filter(file => file.endsWith('.json'));
    
    if (walletFiles.length === 0) {
      await bot.sendMessage(chatId, `📋 *Your Wallets*\n\nNo wallets found. Create a new wallet with /create`, { parse_mode: 'Markdown' });
    } else {
      let walletList = `📋 *Your Wallets* (${walletFiles.length} found)\n\n`;
      for (const file of walletFiles.slice(0, 10)) { // Show max 10
        const stats = await fs.stat(path.join(walletsDir, file));
        const date = new Date(stats.birthtime).toLocaleDateString();
        walletList += `• \`${file.replace('.json', '')}\`\n   Created: ${date}\n\n`;
      }
      if (walletFiles.length > 10) {
        walletList += `... and ${walletFiles.length - 10} more wallets`;
      }
      await bot.sendMessage(chatId, walletList, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Error listing wallets: ${error.message}`);
  }
});

// Handle all other messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Skip if it's a command (starts with /)
  if (text && text.startsWith('/')) {
    return;
  }

  // Check if user is in a session
  const userSession = userSessions.get(userId);

  if (userSession) {
    // Handle session-based responses
    if (userSession.step === 'waiting_for_passphrase' && userSession.action === 'create_wallet') {
      console.log('🔐 Processing passphrase for wallet creation...');
      try {
        const passphrase = text.trim();
        
        if (passphrase.length < config.MIN_PASSPHRASE_LENGTH) {
          await bot.sendMessage(chatId, `❌ *Passphrase too short*\n\nPlease provide a passphrase with at least ${config.MIN_PASSPHRASE_LENGTH} characters for better security.`, { parse_mode: 'Markdown' });
          return;
        }

        // Create wallet
        const walletData = createEvmWallet();
        const filename = `wallet_${walletData.address.slice(0, 8)}_${Date.now()}`;
        
        // Save encrypted wallet
        await saveEncryptedWallet(walletData, passphrase, filename);
        
        // Clear session
        userSessions.delete(userId);
        
        // Send wallet details
        const walletMessage = `🔐 *Your New Wallet Created!*

📍 *Address:* \`${walletData.address}\`
🔑 *Private Key:* \`${walletData.privateKey}\`
📝 *Mnemonic:* \`${walletData.mnemonic}\`

🔒 *Encryption:* Your wallet is encrypted with Argon2 + AES-GCM
📁 *Filename:* \`${filename}\`
📅 *Created:* ${new Date(walletData.createdAt).toLocaleString()}

⚠️ *IMPORTANT:* 
• Save this information securely!
• Your passphrase is required to decrypt the wallet
• We cannot recover your wallet if you lose the passphrase

✅ *Wallet saved successfully!*`;
        
        await bot.sendMessage(chatId, walletMessage, { parse_mode: 'Markdown' });
        console.log('✅ Wallet created and saved successfully');
        
      } catch (error) {
        userSessions.delete(userId);
        await bot.sendMessage(chatId, `❌ *Error creating wallet:* ${error.message}`, { parse_mode: 'Markdown' });
        console.error('❌ Error creating wallet:', error);
      }
    }
    else if (userSession.step === 'waiting_for_filename' && userSession.action === 'load_wallet') {
      console.log('📂 Processing filename for wallet loading...');
      try {
        const filename = text.trim();
        
        // Clear session and ask for passphrase
        userSessions.set(userId, { step: 'waiting_for_load_passphrase', action: 'load_wallet', filename });
        
        await bot.sendMessage(chatId, `🔐 *Load Wallet*\n\nPlease provide the passphrase for wallet: \`${filename}\`\n\n⚠️ *Security:* Your passphrase is required to decrypt the wallet.`, { parse_mode: 'Markdown' });
        
      } catch (error) {
        userSessions.delete(userId);
        await bot.sendMessage(chatId, `❌ *Error:* ${error.message}`, { parse_mode: 'Markdown' });
      }
    }
    else if (userSession.step === 'waiting_for_load_passphrase' && userSession.action === 'load_wallet') {
      console.log('🔐 Processing passphrase for wallet loading...');
      try {
        const passphrase = text.trim();
        const filename = userSession.filename;
        
        // Load and decrypt wallet
        const walletData = await loadEncryptedWallet(filename, passphrase);
        
        // Clear session
        userSessions.delete(userId);
        
        // Send wallet details
        const walletMessage = `🔐 *Wallet Loaded Successfully!*

📍 *Address:* \`${walletData.address}\`
🔑 *Private Key:* \`${walletData.privateKey}\`
📝 *Mnemonic:* \`${walletData.mnemonic}\`

📁 *Filename:* \`${filename}\`
📅 *Created:* ${new Date(walletData.createdAt).toLocaleString()}

✅ *Wallet decrypted successfully!*`;
        
        await bot.sendMessage(chatId, walletMessage, { parse_mode: 'Markdown' });
        console.log('✅ Wallet loaded successfully');
        
      } catch (error) {
        userSessions.delete(userId);
        await bot.sendMessage(chatId, `❌ *Error loading wallet:* ${error.message}\n\nThis usually means:\n• Wrong passphrase\n• Corrupted wallet file\n• File doesn't exist\n\nTry again with /load`, { parse_mode: 'Markdown' });
        console.error('❌ Error loading wallet:', error);
      }
    }
    else {
      // Clear invalid session
      userSessions.delete(userId);
      await bot.sendMessage(chatId, `🤖 Bot received: "${text}"\n\nSend /help for available commands.`);
    }
  } else {
    // No active session, show help
    await bot.sendMessage(chatId, `🤖 Bot received: "${text}"\n\nSend /help for available commands.`);
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

// Initialize the bot
console.log('🔌 Initializing Telegram bot...');
ensureWalletsDirectory().then(() => {
  console.log('✅ Telegram Wallet Bot is ready!');
  console.log('📋 Bot is now listening for messages...');
}).catch(console.error);

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down bot...');
  await bot.stopPolling();
  process.exit(0);
});

module.exports = bot;
