# WhatsApp Wallet Service

A comprehensive service that integrates WhatsApp Web protocol with encrypted wallet creation and delivery.

## Features

- **Secure Wallet Creation**: Generate new EVM wallets with encrypted storage
- **WhatsApp Delivery**: Send wallet credentials via WhatsApp messages
- **End-to-End Encryption**: All wallet data is encrypted with user-provided passphrases
- **Persistent Storage**: Save and retrieve encrypted wallets
- **Security First**: PBKDF2 key derivation with 100,000 iterations
- **QR Code Authentication**: Easy setup with QR code scanning

## Setup

### Prerequisites

- Node.js 16+
- WhatsApp account with mobile app
- Chrome/Chromium browser (for Puppeteer)

### Installation

```bash
cd whatsapp
npm install
```

### Environment Configuration

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Update `.env` with your preferences:
```env
ENCRYPTION_ITERATIONS=100000
ENCRYPTION_ALGORITHM=aes-256-gcm
BOT_NAME=WalletBot
PORT=3001
HOST=localhost
```

## Authentication

WhatsApp Web requires authentication via QR code scanning:

1. **Start the service** - it will generate a QR code
2. **Open WhatsApp** on your mobile device
3. **Go to Settings** → Linked Devices → Link a Device
4. **Scan the QR code** displayed in the terminal
5. **Wait for authentication** - the service will be ready

## API Endpoints

### Check WhatsApp Status
```http
GET /api/whatsapp/status
```

### Get QR Code for Authentication
```http
GET /api/whatsapp/qr
```

### Create and Send Wallet via WhatsApp
```http
POST /api/whatsapp/wallet/create
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "passphrase": "your_secure_passphrase"
}
```

### Send Existing Wallet via WhatsApp
```http
POST /api/whatsapp/wallet/send
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "filename": "wallet_filename",
  "passphrase": "your_secure_passphrase"
}
```

### List Saved Wallets
```http
GET /api/whatsapp/wallet/list
```

## Usage Examples

### Basic Wallet Creation and WhatsApp Delivery

```javascript
const WhatsAppWalletService = require('./whatsapp-wallet-service');
const service = new WhatsAppWalletService();

// Initialize and authenticate
await service.initialize();

// Create wallet and send via WhatsApp
const result = await service.createAndSendWallet(
  '+1234567890',
  'my_secure_passphrase'
);

console.log('Wallet created:', result.wallet.address);
console.log('WhatsApp Status:', result.message.status);
```

### Managing Existing Wallets

```javascript
// List all saved wallets
const wallets = await service.listWallets();
console.log('Saved wallets:', wallets);

// Load and send existing wallet
const result = await service.loadAndSendWallet(
  '+1234567890',
  'wallet_filename',
  'my_secure_passphrase'
);
```

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 32-byte random salt for each wallet
- **IV**: 16-byte random initialization vector
- **Authentication**: Built-in authentication tag

### Data Protection
- All wallet data is encrypted before storage
- Passphrases are never stored
- Each wallet has unique encryption parameters
- Secure file storage with proper permissions

## Phone Number Format

All phone numbers must be in international format:
- `+1234567890` (US)
- `+44123456789` (UK)
- `+33123456789` (France)
- `1234567890` (missing country code)
- `+1-234-567-890` (contains dashes)

## Message Format

WhatsApp messages are formatted with:
- **Markdown-style formatting** for better readability
- **Code blocks** for sensitive information
- **Emojis** for visual appeal
- **Structured layout** with clear sections

Example message:
```
🔐 *Your New Wallet Created!*

📍 *Address:* `0x1234...5678`
🔑 *Private Key:* `0xabcd...efgh`
📝 *Mnemonic:* `word1 word2 word3...`

🔒 *Encryption Passphrase:* `your_passphrase`

⚠️ *IMPORTANT:* Save this information securely!
📅 *Created:* 2024-01-01T00:00:00.000Z

_This message was sent by the Wallet Bot_
```

## Error Handling

The service includes comprehensive error handling for:
- WhatsApp authentication failures
- Network connectivity issues
- Encryption/decryption failures
- File system errors
- Invalid phone numbers

## Development

### Running Tests
```bash
npm test
```

### Debug Mode
Set `DEBUG=whatsapp-wallet:*` to enable debug logging.

## Integration with Next.js App

The service is designed to integrate seamlessly with the Next.js wallet application:

1. **Create Wallet Component**: Enhanced with WhatsApp delivery options
2. **API Routes**: RESTful endpoints for all operations
3. **React Components**: UI components for wallet management
4. **Type Safety**: Full TypeScript support

## Troubleshooting

### Common Issues

1. **QR Code not appearing**: Ensure the service is properly initialized
2. **Authentication fails**: Make sure you're scanning the QR code with the correct WhatsApp account
3. **Messages not sending**: Verify the phone number is a valid WhatsApp number
4. **Service disconnects**: Check your internet connection and try re-authenticating

### Debug Steps

1. Check the service status via `/api/whatsapp/status`
2. Verify WhatsApp authentication via `/api/whatsapp/qr`
3. Test with a known working phone number
4. Check console logs for error messages

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the error logs for detailed error messages
2. Ensure your WhatsApp account is properly authenticated
3. Verify that the phone number is a valid WhatsApp number
4. Check that the service is properly initialized and connected
