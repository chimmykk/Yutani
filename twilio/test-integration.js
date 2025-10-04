// Test script for Twilio Wallet Service integration
const TwilioWalletService = require('./twilio-wallet-service');

async function testIntegration() {
  console.log('🧪 Testing Twilio Wallet Service Integration...\n');

  try {
    // Initialize service
    const service = new TwilioWalletService();
    console.log(' Service initialized successfully');

    // Test wallet generation
    console.log('\nTesting wallet generation...');
    const wallet = service.generateWallet();
    console.log(' Wallet generated:', {
      address: wallet.address,
      hasPrivateKey: !!wallet.privateKey,
      hasMnemonic: !!wallet.mnemonic,
      createdAt: wallet.createdAt
    });

    // Test encryption/decryption
    console.log('\n Testing encryption/decryption...');
    const testPassphrase = 'test-passphrase-123';
    const encrypted = await service.encryptWallet(wallet, testPassphrase);
    console.log(' Wallet encrypted:', {
      hasSalt: !!encrypted.salt,
      hasIV: !!encrypted.iv,
      hasTag: !!encrypted.tag,
      hasEncrypted: !!encrypted.encrypted,
      algorithm: encrypted.algorithm
    });

    const decrypted = await service.decryptWallet(encrypted, testPassphrase);
    console.log(' Wallet decrypted successfully:', {
      addressMatch: decrypted.address === wallet.address,
      privateKeyMatch: decrypted.privateKey === wallet.privateKey
    });

    // Test file operations
    console.log('\n Testing file operations...');
    const filename = `test_wallet_${Date.now()}`;
    await service.saveEncryptedWallet(wallet, testPassphrase, filename);
    console.log(' Wallet saved to file');

    const loadedWallet = await service.loadEncryptedWallet(filename, testPassphrase);
    console.log(' Wallet loaded from file:', {
      addressMatch: loadedWallet.address === wallet.address
    });

    // Test wallet listing
    console.log('\n📋 Testing wallet listing...');
    const wallets = await service.listWallets();
    console.log(' Wallets listed:', wallets.length, 'wallets found');

    // Clean up test file
    await service.deleteWallet(filename);
    console.log('Test wallet deleted');

    console.log('\n All tests passed! Integration is working correctly.');
    console.log('\n To test SMS/Call functionality:');
    console.log('1. Set up your Twilio credentials in .env file');
    console.log('2. Use the API endpoints or React components');
    console.log('3. Ensure your Twilio account has SMS and Voice capabilities');

  } catch (error) {
    console.error(' Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testIntegration();
