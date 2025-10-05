# Enhanced WhatsApp Wallet Bot

A secure WhatsApp bot that creates, encrypts, and manages cryptocurrency wallets with Argon2 + AES-GCM encryption.

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
| `create wallet` | Start wallet creation process |
| `load wallet` | Load an existing encrypted wallet |
| `list wallets` | List all saved wallets |
| `help` | Show available commands |

## 🔧 Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Required Dependencies**:
   - `whatsapp-web.js` - WhatsApp Web API
   - `ethers` - Ethereum wallet generation
   - `argon2` - Password hashing
   - `crypto` - Node.js crypto module
   - `qrcode-terminal` - QR code display

## 🚀 Usage

### Starting the Bot

```bash
node working-bot.js
```

### Bot Interaction Flow

#### 1. Create Wallet
```
User: create wallet
Bot: 🔐 Wallet Creation Started
     Please provide a strong passphrase to encrypt your wallet...
     
User: my_secure_passphrase_123
Bot: 🔐 Your New Wallet Created!
     Address: 0x8C94D85F1BcE9eDCB9773BA59C25bEe79859669e
     Private Key: 0x6b110058...
     Mnemonic: monkey arrive pencil...
     ✅ Wallet saved successfully!
```

#### 2. Load Wallet
```
User: load wallet
Bot: 📂 Load Existing Wallet
     Please provide the filename of your wallet...
     
User: wallet_0x8C94D8_1759700049593
Bot: 🔐 Load Wallet
     Please provide the passphrase for wallet...
     
User: my_secure_passphrase_123
Bot: 🔐 Wallet Loaded Successfully!
     Address: 0x8C94D85F1BcE9eDCB9773BA59C25bEe79859669e
     ✅ Wallet decrypted successfully!
```

#### 3. List Wallets
```
User: list wallets
Bot: 📋 Your Wallets (1 found)
     • wallet_0x8C94D8_1759700049593
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
whatsapp/
├── working-bot.js              # Enhanced WhatsApp bot
├── test-wallet-creation.js    # Test script
├── wallets/                   # Encrypted wallet storage
│   └── wallet_*.json         # Encrypted wallet files
├── package.json              # Dependencies
└── README-Enhanced-Bot.md     # This file
```

## 🧪 Testing

Run the test script to verify functionality:

```bash
node test-wallet-creation.js
```

Expected output:
```
🧪 Testing Wallet Creation and Encryption...
✅ Wallet created
✅ Wallet encrypted with Argon2 + AES-GCM
✅ Wallet saved
✅ Wallet decrypted successfully
✅ All data matches perfectly!
✅ Correctly failed with wrong passphrase
🎉 All tests passed!
```

## 🔧 Configuration

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
- **Single User**: Each WhatsApp session is independent

## 🔄 Session Management

The bot uses session-based conversation flow:

```javascript
// Session states
{
  step: 'waiting_for_passphrase',    // Waiting for user input
  action: 'create_wallet',          // Action being performed
  filename: 'wallet_0x1234_123'     // Optional filename
}
```

### Session Flow
1. **Create Wallet**: `create` → `waiting_for_passphrase` → `completed`
2. **Load Wallet**: `load` → `waiting_for_filename` → `waiting_for_load_passphrase` → `completed`

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
3. **"File doesn't exist"**: Check filename with `list wallets`
4. **Session timeout**: Restart conversation with command

### Debug Mode
Enable detailed logging by adding:
```javascript
console.log('Debug info:', { session, step, action });
```

## 🔮 Future Enhancements

- [ ] Multi-signature wallet support
- [ ] Hardware wallet integration
- [ ] Cloud storage options
- [ ] Wallet backup/restore
- [ ] Transaction signing
- [ ] Balance checking
- [ ] Network selection (mainnet/testnet)

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
