# Telegram Wallet Bot

A secure Telegram bot that creates, encrypts, and manages cryptocurrency wallets with Argon2 + AES-GCM encryption.

## 🚀 Features

### Core Functionality
- **Wallet Creation**: Generate new EVM wallets with private keys and mnemonics
- **Secure Encryption**: Uses Argon2id + AES-GCM for maximum security
- **Passphrase Protection**: User-defined passphrases for wallet encryption
- **Wallet Management**: Create, load, and list encrypted wallets
- **Session Management**: Interactive conversation flow for wallet operations

### Security Features
- **Argon2id Key Derivation**: Industry-standard password hashing
- **AES-GCM Encryption**: Authenticated encryption with additional data
- **Salt-based Security**: Unique salt for each wallet encryption
- **Passphrase Validation**: Minimum 8-character passphrase requirement
- **Secure File Storage**: Encrypted wallets stored locally

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and bot introduction |
| `/create` | Start wallet creation process |
| `/load` | Load an existing encrypted wallet |
| `/list` | List all your saved wallets |
| `/help` | Show available commands |

## 🔧 Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Required Dependencies**:
   - `node-telegram-bot-api` - Telegram Bot API
   - `ethers` - Ethereum wallet generation
   - `argon2` - Password hashing
   - `crypto` - Node.js crypto module

## 🚀 Usage

### Starting the Bot

```bash
node telegram-bot.js
```

### Bot Interaction Flow

#### 1. Start the Bot
```
User: /start
Bot: 🤖 Welcome to Wallet Bot!
     🔐 Secure Cryptocurrency Wallet Management
     📝 Available Commands:
     • /create - Create a new crypto wallet
     • /load - Load an existing wallet
     • /list - List all your saved wallets
     • /help - Show this help message
```

#### 2. Create Wallet
```
User: /create
Bot: 🔐 Wallet Creation Started
     Please provide a strong passphrase to encrypt your wallet...
     
User: my_secure_passphrase_123
Bot: 🔐 Your New Wallet Created!
     Address: 0x98570e49b5f17E0a6470f5b79c3ba8BF681A490a
     Private Key: 0xe9622e6b...
     Mnemonic: learn police truly s...
     ✅ Wallet saved successfully!
```

#### 3. Load Wallet
```
User: /load
Bot: 📂 Load Existing Wallet
     Please provide the filename of your wallet...
     
User: telegram_wallet_0x98570e_1759700538385
Bot: 🔐 Load Wallet
     Please provide the passphrase for wallet...
     
User: my_secure_passphrase_123
Bot: 🔐 Wallet Loaded Successfully!
     Address: 0x98570e49b5f17E0a6470f5b79c3ba8BF681A490a
     ✅ Wallet decrypted successfully!
```

#### 4. List Wallets
```
User: /list
Bot: 📋 Your Wallets (1 found)
     • telegram_wallet_0x98570e_1759700538385
       Created: 10/5/2025
```

## 🔒 Security Implementation

### Encryption Process
1. **Key Derivation**: Argon2id with configurable parameters
   - Time Cost: 3 iterations
   - Memory Cost: 64MB
   - Parallelism: 1 thread
   - Hash Length: 32 bytes

2. **Encryption**: AES-256-GCM
   - 12-byte random IV
   - Authenticated encryption
   - Unique salt per wallet

3. **Storage Format**:
   ```json
   {
     "salt": "base64_encoded_salt",
     "iv": "base64_encoded_iv", 
     "tag": "base64_encoded_auth_tag",
     "ciphertext": "base64_encoded_encrypted_data",
     "kdf": {
       "type": "argon2id",
       "timeCost": 3,
       "memoryCost": 65536,
       "parallelism": 1
     }
   }
   ```

### Security Features
- **Passphrase Requirements**: Minimum 8 characters
- **Unique Salts**: Each wallet has a unique 16-byte salt
- **Authentication**: GCM mode prevents tampering
- **Memory-hard Hashing**: Argon2id resists GPU/ASIC attacks
- **Session Management**: User sessions for multi-step operations

## 📁 File Structure

```
telegram/
├── telegram-bot.js           # Main Telegram bot
├── test-telegram-wallet.js   # Test script
├── config.js                 # Bot configuration
├── wallets/                  # Encrypted wallet storage
│   └── telegram_wallet_*.json # Encrypted wallet files
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🧪 Testing

Run the test script to verify functionality:

```bash
node test-telegram-wallet.js
```

Expected output:
```
🧪 Testing Telegram Wallet Creation and Encryption...
✅ Wallet created
✅ Wallet encrypted with Argon2 + AES-GCM
✅ Wallet saved
✅ Wallet decrypted successfully
✅ All data matches perfectly!
✅ Correctly failed with wrong passphrase
✅ Passphrase validation working
🎉 All Telegram bot tests passed!
```

## 🔧 Configuration

### Bot Configuration (`config.js`)
```javascript
module.exports = {
  BOT_TOKEN: '7982684641:AAGdmJN5L96-ppjesDCRJ19Hv9PwnGTopjE',
  BOT_NAME: 'WalletBot',
  MIN_PASSPHRASE_LENGTH: 8,
  ARGON2_TIME_COST: 3,
  ARGON2_MEMORY_COST: 65536,
  ARGON2_PARALLELISM: 1,
  WALLETS_DIR: './wallets'
};
```

### Argon2 Parameters
```javascript
{
  type: argon2.argon2id,
  timeCost: 3,           // 3 iterations
  memoryCost: 2 ** 16,   // 64MB memory
  parallelism: 1,        // 1 thread
  hashLength: 32         // 32-byte key
}
```

### AES-GCM Parameters
```javascript
{
  algorithm: 'aes-256-gcm',
  ivLength: 12,          // 12-byte IV
  keyLength: 32          // 32-byte key
}
```

## 🚨 Security Considerations

### Best Practices
1. **Strong Passphrases**: Use complex, unique passphrases
2. **Secure Storage**: Keep encrypted files in secure locations
3. **Backup**: Always backup your passphrases securely
4. **Network Security**: Use secure networks when running the bot

### Limitations
- **No Recovery**: Lost passphrases cannot be recovered
- **Local Storage**: Wallets stored locally on the server
- **Single User**: Each Telegram session is independent

## 🔄 Session Management

The bot uses session-based conversation flow:

```javascript
// Session states
{
  step: 'waiting_for_passphrase',    // Waiting for user input
  action: 'create_wallet',          // Action being performed
  filename: 'telegram_wallet_0x1234_123' // Optional filename
}
```

### Session Flow
1. **Create Wallet**: `/create` → `waiting_for_passphrase` → `completed`
2. **Load Wallet**: `/load` → `waiting_for_filename` → `waiting_for_load_passphrase` → `completed`

## 📊 Performance

### Encryption Benchmarks
- **Key Derivation**: ~100-500ms (depending on hardware)
- **Encryption**: ~1-5ms
- **Decryption**: ~1-5ms
- **File I/O**: ~1-10ms

### Memory Usage
- **Argon2**: ~64MB during key derivation
- **AES-GCM**: Minimal memory footprint
- **Session Storage**: ~1KB per active session

## 🛠️ Troubleshooting

### Common Issues

1. **"Decryption failed"**: Wrong passphrase or corrupted file
2. **"Passphrase too short"**: Use at least 8 characters
3. **"File doesn't exist"**: Check filename with `/list`
4. **Session timeout**: Restart conversation with command

### Debug Mode
Enable detailed logging by adding:
```javascript
console.log('Debug info:', { session, step, action });
```

## 🤖 Bot Commands Reference

### Available Commands
- `/start` - Welcome message and introduction
- `/help` - Show help information
- `/create` - Create a new cryptocurrency wallet
- `/load` - Load an existing encrypted wallet
- `/list` - List all saved wallets

### Command Flow
1. **Start**: Send `/start` to begin
2. **Create**: Send `/create` → provide passphrase → receive wallet
3. **Load**: Send `/load` → provide filename → provide passphrase → receive wallet
4. **List**: Send `/list` to see all saved wallets

## 🔮 Future Enhancements

- [ ] Multi-signature wallet support
- [ ] Hardware wallet integration
- [ ] Cloud storage options
- [ ] Wallet backup/restore
- [ ] Transaction signing
- [ ] Balance checking
- [ ] Network selection (mainnet/testnet)
- [ ] Inline keyboards for better UX
- [ ] Wallet sharing between users
- [ ] Multi-language support

## 📄 License

MIT License - See package.json for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Run the test script
3. Review the security considerations
4. Create an issue with detailed logs

## 🚀 Deployment

### Local Development
```bash
# Install dependencies
npm install

# Run the bot
node telegram-bot.js

# Test functionality
node test-telegram-wallet.js
```

### Production Deployment
1. Set up a secure server
2. Install Node.js and dependencies
3. Configure environment variables
4. Run the bot with process manager (PM2)
5. Set up monitoring and logging

### Environment Variables
```bash
# Optional: Use environment variables instead of config.js
export TELEGRAM_BOT_TOKEN="your_bot_token_here"
export MIN_PASSPHRASE_LENGTH=8
export ARGON2_TIME_COST=3
export ARGON2_MEMORY_COST=65536
```

## 🔐 Security Checklist

- [ ] Strong bot token (keep secret)
- [ ] Secure server environment
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Backup encrypted wallets
- [ ] Use HTTPS for webhooks (if applicable)
- [ ] Implement rate limiting
- [ ] Log security events
