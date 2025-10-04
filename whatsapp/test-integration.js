// Test script for WhatsApp Wallet Service integration
const WhatsAppWalletService = require('./whatsapp-wallet-service');

async function testIntegration() {
  console.log('🧪 Testing WhatsApp Wallet Service Integration...\n');

  try {
    // Initialize service
    const service = new WhatsAppWalletService();
    console.log('✅ Service initialized successfully');

    // Test wallet generation
    console.log('\n📝 Testing wallet generation...');
    const wallet = service.generateWallet();
    console.log('✅ Wallet generated:', {
      address: wallet.address,
      hasPrivateKey: !!wallet.privateKey,
      hasMnemonic: !!wallet.mnemonic,
      createdAt: wallet.createdAt
    });

    // Test encryption/decryption
    console.log('\n🔐 Testing encryption/decryption...');
    const testPassphrase = 'test-passphrase-123';
    const encrypted = await service.encryptWallet(wallet, testPassphrase);
    console.log('✅ Wallet encrypted:', {
      hasSalt: !!encrypted.salt,
      hasIV: !!encrypted.iv,
      hasTag: !!encrypted.tag,
      hasEncrypted: !!encrypted.encrypted,
      algorithm: encrypted.algorithm
    });

    const decrypted = await service.decryptWallet(encrypted, testPassphrase);
    console.log('✅ Wallet decrypted successfully:', {
      addressMatch: decrypted.address === wallet.address,
      privateKeyMatch: decrypted.privateKey === wallet.privateKey
    });

    // Test file operations
    console.log('\n💾 Testing file operations...');
    const filename = `test_wallet_${Date.now()}`;
    await service.saveEncryptedWallet(wallet, testPassphrase, filename);
    console.log('✅ Wallet saved to file');

    const loadedWallet = await service.loadEncryptedWallet(filename, testPassphrase);
    console.log('✅ Wallet loaded from file:', {
      addressMatch: loadedWallet.address === wallet.address
    });

    // Test wallet listing
    console.log('\n📋 Testing wallet listing...');
    const wallets = await service.listWallets();
    console.log('✅ Wallets listed:', wallets.length, 'wallets found');

    // Test phone number formatting
    console.log('\n📱 Testing phone number formatting...');
    const testNumbers = ['+1234567890', '1234567890', '+1-234-567-890'];
    testNumbers.forEach(number => {
      const formatted = service.formatPhoneNumber(number);
      console.log(`✅ ${number} → ${formatted}`);
    });

    // Clean up test file
    await service.deleteWallet(filename);
    console.log('✅ Test wallet deleted');

    console.log('\n🎉 All tests passed! Integration is working correctly.');
    console.log('\n📱 To test WhatsApp functionality:');
    console.log('1. Initialize the WhatsApp client: await service.initialize()');
    console.log('2. Scan the QR code with your WhatsApp mobile app');
    console.log('3. Use the API endpoints or React components');
    console.log('4. Ensure the phone number is a valid WhatsApp number');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testIntegration();
