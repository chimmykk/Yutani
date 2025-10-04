# Twilio Wallet Service

A comprehensive service that integrates Twilio's SMS and voice capabilities with encrypted wallet creation and delivery.

## Features

-  **Secure Wallet Creation**: Generate new EVM wallets with encrypted storage
-  **SMS Delivery**: Send wallet credentials via SMS
-  **Voice Delivery**: Deliver wallet information via phone calls
-  **End-to-End Encryption**: All wallet data is encrypted with user-provided passphrases
-  **Persistent Storage**: Save and retrieve encrypted wallets
-  **Security First**: PBKDF2 key derivation with 100,000 iterations

## Setup

### Prerequisites

- Node.js 16+ 
- Twilio Account with SMS and Voice capabilities
- Valid Twilio phone number

### Installation

```bash
cd twilio
npm install
```

### Environment Configuration

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Update `.env` with your Twilio credentials:
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

## API Endpoints

### Create and Send Wallet via SMS
```http
POST /api/twilio/wallet/create-sms
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "passphrase": "your_secure_passphrase"
}
```

### Create and Deliver Wallet via Call
```http
POST /api/twilio/wallet/create-call
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "passphrase": "your_secure_passphrase"
}
```

### Send Existing Wallet via SMS
```http
POST /api/twilio/wallet/send-sms
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "filename": "wallet_filename",
  "passphrase": "your_secure_passphrase"
}
```

### Deliver Existing Wallet via Call
```http
POST /api/twilio/wallet/make-call
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "filename": "wallet_filename",
  "passphrase": "your_secure_passphrase"
}
```

### List Saved Wallets
```http
GET /api/twilio/wallet/list
```

## Usage Examples

### Basic Wallet Creation and SMS Delivery

```javascript
const TwilioWalletService = require('./twilio-wallet-service');
const service = new TwilioWalletService();

// Create wallet and send via SMS
const result = await service.createAndSendWalletSMS(
  '+1234567890',
  'my_secure_passphrase'
);

console.log('Wallet created:', result.wallet.address);
console.log('SMS Status:', result.sms.status);
```

### Voice Delivery

```javascript
// Create wallet and deliver via call
const result = await service.createAndCallWallet(
  '+1234567890',
  'my_secure_passphrase'
);

console.log('Call Status:', result.call.status);
```

### Managing Existing Wallets

```javascript
// List all saved wallets
const wallets = await service.listWallets();
console.log('Saved wallets:', wallets);

// Load and send existing wallet
const result = await service.loadAndSendWalletSMS(
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
-  `+44123456789` (UK)
-  `+33123456789` (France)
- `1234567890` (missing country code)
- `+1-234-567-890` (contains dashes)

## Error Handling

The service includes comprehensive error handling for:
- Invalid phone numbers
- Twilio API errors
- Encryption/decryption failures
- File system errors
- Network connectivity issues

## Development

### Running Tests
```bash
npm test
```

### Debug Mode
Set `DEBUG=twilio-wallet:*` to enable debug logging.

## Integration with Next.js App

The service is designed to integrate seamlessly with the Next.js wallet application:

1. **Create Wallet Component**: Enhanced with Twilio delivery options
2. **API Routes**: RESTful endpoints for all operations
3. **React Components**: UI components for wallet management
4. **Type Safety**: Full TypeScript support

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the error logs for detailed error messages
2. Verify your Twilio credentials and phone number
3. Ensure your Twilio account has SMS and Voice capabilities enabled
4. Check that your phone number is verified in Twilio (for trial accounts)
