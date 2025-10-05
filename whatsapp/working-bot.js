const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const crypto = require('crypto');
const argon2 = require('argon2');
const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');

console.log('🚀 Starting WhatsApp Bot...');

// Wallet storage directory
const walletsDir = path.join(__dirname, 'wallets');

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
    timeCost: options.timeCost ?? 3,
    memoryCost: options.memoryCost ?? 2 ** 16,
    parallelism: options.parallelism ?? 1,
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
      timeCost: 3, 
      memoryCost: 2 ** 16, 
      parallelism: 1 
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

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Event handlers
client.on('qr', (qr) => {
  console.log('📱 QR Code received!');
  console.log('Scan this QR code with your WhatsApp app:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  console.log('📋 Bot is now listening for messages...');
});

client.on('authenticated', () => {
  console.log('🔐 WhatsApp client authenticated');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
  console.log('🔌 WhatsApp client disconnected:', reason);
});

// Message handler
client.on('message', async (message) => {
  try {
    console.log('📨 Message received:', {
      from: message.from,
      body: message.body,
      isGroup: message.isGroupMsg,
      fromMe: message.fromMe
    });

    // Log if message is from yourself
    if (message.fromMe) {
      console.log('📨 Message from yourself - processing anyway for testing');
    }

    // Skip only group messages (allow self messages for testing)
    if (message.isGroupMsg) {
      console.log('⏭️ Skipping group message');
      return;
    }

    // Process the message
    if (message.body && message.body.trim()) {
      const text = message.body.toLowerCase().trim();
      const userId = message.from;
      console.log(`📨 Processing: "${message.body}"`);

      // Check if user is in a session
      const userSession = userSessions.get(userId);

      if (text === 'create wallet' || text === 'create') {
        console.log('🔧 Starting wallet creation process...');
        userSessions.set(userId, { step: 'waiting_for_passphrase', action: 'create_wallet' });
        await client.sendMessage(message.from, `🔐 *Wallet Creation Started*

Please provide a strong passphrase to encrypt your wallet. This passphrase will be used to secure your private keys.

⚠️ *Important:*
• Choose a strong, unique passphrase
• You'll need this passphrase to access your wallet
• We cannot recover your wallet if you forget the passphrase

Please send your passphrase now:`);
      }
      else if (text === 'load wallet' || text === 'load') {
        console.log('📂 Starting wallet loading process...');
        userSessions.set(userId, { step: 'waiting_for_filename', action: 'load_wallet' });
        await client.sendMessage(message.from, `📂 *Load Existing Wallet*

Please provide the filename of your wallet (without .json extension):

Example: wallet_0x12345678_1234567890`);
      }
      else if (text === 'list wallets' || text === 'list') {
        console.log('📋 Listing wallets...');
        try {
          const files = await fs.readdir(walletsDir);
          const walletFiles = files.filter(file => file.endsWith('.json'));
          
          if (walletFiles.length === 0) {
            await client.sendMessage(message.from, `📋 *Your Wallets*

No wallets found. Create a new wallet with "create wallet"`);
          } else {
            let walletList = `📋 *Your Wallets* (${walletFiles.length} found)\n\n`;
            for (const file of walletFiles.slice(0, 10)) { // Show max 10
              const stats = await fs.stat(path.join(walletsDir, file));
              const date = new Date(stats.birthtime).toLocaleDateString();
              walletList += `• ${file.replace('.json', '')}\n   Created: ${date}\n\n`;
            }
            if (walletFiles.length > 10) {
              walletList += `... and ${walletFiles.length - 10} more wallets`;
            }
            await client.sendMessage(message.from, walletList);
          }
        } catch (error) {
          await client.sendMessage(message.from, `❌ Error listing wallets: ${error.message}`);
        }
      }
      else if (text === 'help' || text === 'commands') {
        const helpText = `🤖 *WhatsApp Wallet Bot Commands*

📝 *Available Commands:*
• create wallet - Create a new crypto wallet
• load wallet - Load an existing wallet
• list wallets - List all your saved wallets
• help - Show this help message

💡 *Example:* Send "create wallet" to get started!

🔒 *Security:* Your wallets are encrypted with Argon2 and AES-GCM encryption.`;
        await client.sendMessage(message.from, helpText);
      }
      else if (userSession) {
        // Handle session-based responses
        if (userSession.step === 'waiting_for_passphrase' && userSession.action === 'create_wallet') {
          console.log('🔐 Processing passphrase for wallet creation...');
          try {
            const passphrase = message.body.trim();
            
            if (passphrase.length < 8) {
              await client.sendMessage(message.from, `❌ *Passphrase too short*

Please provide a passphrase with at least 8 characters for better security.`);
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
            
            await client.sendMessage(message.from, walletMessage);
            console.log('✅ Wallet created and saved successfully');
            
          } catch (error) {
            userSessions.delete(userId);
            await client.sendMessage(message.from, `❌ *Error creating wallet:* ${error.message}`);
            console.error('❌ Error creating wallet:', error);
          }
        }
        else if (userSession.step === 'waiting_for_filename' && userSession.action === 'load_wallet') {
          console.log('📂 Processing filename for wallet loading...');
          try {
            const filename = message.body.trim();
            
            // Clear session and ask for passphrase
            userSessions.set(userId, { step: 'waiting_for_load_passphrase', action: 'load_wallet', filename });
            
            await client.sendMessage(message.from, `🔐 *Load Wallet*

Please provide the passphrase for wallet: \`${filename}\`

⚠️ *Security:* Your passphrase is required to decrypt the wallet.`);
            
          } catch (error) {
            userSessions.delete(userId);
            await client.sendMessage(message.from, `❌ *Error:* ${error.message}`);
          }
        }
        else if (userSession.step === 'waiting_for_load_passphrase' && userSession.action === 'load_wallet') {
          console.log('🔐 Processing passphrase for wallet loading...');
          try {
            const passphrase = message.body.trim();
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
            
            await client.sendMessage(message.from, walletMessage);
            console.log('✅ Wallet loaded successfully');
            
          } catch (error) {
            userSessions.delete(userId);
            await client.sendMessage(message.from, `❌ *Error loading wallet:* ${error.message}

This usually means:
• Wrong passphrase
• Corrupted wallet file
• File doesn't exist

Try again with "load wallet"`);
            console.error('❌ Error loading wallet:', error);
          }
        }
        else {
          // Clear invalid session
          userSessions.delete(userId);
          await client.sendMessage(message.from, `🤖 Bot received: "${message.body}"\n\nSend "help" for available commands.`);
        }
      }
      else {
        await client.sendMessage(message.from, `🤖 Bot received: "${message.body}"\n\nSend "help" for available commands.`);
      }
      
      console.log('✅ Response sent');
    }

  } catch (error) {
    console.error('❌ Error handling message:', error);
  }
});

// Initialize the client
console.log('🔌 Initializing WhatsApp client...');
ensureWalletsDirectory().then(() => {
  client.initialize().catch(console.error);
}).catch(console.error);

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down bot...');
  await client.destroy();
  process.exit(0);
});
