# Credentials Directory

This directory stores encrypted wallet credentials in JSON format using the file system.

## Implementation

The system uses **server-side API routes** to handle file system operations:

- **Server-side storage**: Files are saved to the `/credentials` directory
- **API endpoints**: `/api/wallet/save`, `/api/wallet/load`, `/api/wallet/list`, `/api/wallet/delete`
- **Client-side encryption**: All encryption/decryption happens in the browser
- **Secure file handling**: Files are created with proper permissions

## Security Notice

- All wallet data is encrypted using AES-GCM with Argon2id key derivation
- Each wallet is encrypted with a user-provided passphrase
- Data is stored in encrypted JSON files on the server
- Never share your passphrase or unencrypted private keys
- Files are automatically excluded from version control

## File Format

Encrypted wallet files follow this structure:

```json
{
  "salt": "base64-encoded-salt",
  "iv": "base64-encoded-iv", 
  "tag": "base64-encoded-auth-tag",
  "ciphertext": "base64-encoded-encrypted-data",
  "kdf": {
    "type": "argon2id",
    "timeCost": 3,
    "memoryCost": 65536,
    "parallelism": 1
  }
}
```

## Usage

- Wallets are automatically saved to the credentials directory when created/imported
- Use the Wallet Manager in the dashboard to view and manage saved wallets
- Files are named: `wallet_[address]_[timestamp].json`
- All operations go through secure API endpoints
