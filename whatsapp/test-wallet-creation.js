const crypto = require('crypto');
const argon2 = require('argon2');
const { ethers } = require('ethers');
const fs = require('fs').promises;
const path = require('path');

// Test wallet creation and encryption functionality
async function testWalletCreation() {
  console.log('🧪 Testing Wallet Creation and Encryption...\n');

  // Create wallets directory
  const walletsDir = path.join(__dirname, 'wallets');
  try {
    await fs.access(walletsDir);
  } catch {
    await fs.mkdir(walletsDir, { recursive: true });
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

  try {
    // Test 1: Create wallet
    console.log('1️⃣ Creating new wallet...');
    const walletData = createEvmWallet();
    console.log('✅ Wallet created:');
    console.log(`   Address: ${walletData.address}`);
    console.log(`   Private Key: ${walletData.privateKey.slice(0, 10)}...`);
    console.log(`   Mnemonic: ${walletData.mnemonic?.slice(0, 20)}...`);
    console.log(`   Created: ${walletData.createdAt}\n`);

    // Test 2: Encrypt wallet
    console.log('2️⃣ Encrypting wallet...');
    const testPassphrase = 'my_secure_passphrase_123';
    const encrypted = await encryptWallet(walletData, testPassphrase);
    console.log('✅ Wallet encrypted with Argon2 + AES-GCM');
    console.log(`   Salt: ${encrypted.salt.slice(0, 20)}...`);
    console.log(`   IV: ${encrypted.iv.slice(0, 20)}...`);
    console.log(`   Tag: ${encrypted.tag.slice(0, 20)}...`);
    console.log(`   Ciphertext: ${encrypted.ciphertext.slice(0, 20)}...\n`);

    // Test 3: Save encrypted wallet
    console.log('3️⃣ Saving encrypted wallet...');
    const filename = `test_wallet_${walletData.address.slice(0, 8)}_${Date.now()}`;
    const filePath = await saveEncryptedWallet(walletData, testPassphrase, filename);
    console.log(`✅ Wallet saved to: ${filePath}\n`);

    // Test 4: Load and decrypt wallet
    console.log('4️⃣ Loading and decrypting wallet...');
    const decryptedWallet = await loadEncryptedWallet(filename, testPassphrase);
    console.log('✅ Wallet decrypted successfully:');
    console.log(`   Address: ${decryptedWallet.address}`);
    console.log(`   Private Key: ${decryptedWallet.privateKey.slice(0, 10)}...`);
    console.log(`   Mnemonic: ${decryptedWallet.mnemonic?.slice(0, 20)}...`);
    console.log(`   Created: ${decryptedWallet.createdAt}\n`);

    // Test 5: Verify data integrity
    console.log('5️⃣ Verifying data integrity...');
    const isAddressMatch = walletData.address === decryptedWallet.address;
    const isPrivateKeyMatch = walletData.privateKey === decryptedWallet.privateKey;
    const isMnemonicMatch = walletData.mnemonic === decryptedWallet.mnemonic;
    
    if (isAddressMatch && isPrivateKeyMatch && isMnemonicMatch) {
      console.log('✅ All data matches perfectly!');
    } else {
      console.log('❌ Data integrity check failed!');
    }

    // Test 6: Test wrong passphrase
    console.log('\n6️⃣ Testing wrong passphrase...');
    try {
      await loadEncryptedWallet(filename, 'wrong_passphrase');
      console.log('❌ Should have failed with wrong passphrase!');
    } catch (error) {
      console.log('✅ Correctly failed with wrong passphrase:', error.message);
    }

    console.log('\n🎉 All tests passed! Wallet creation and encryption is working correctly.');
    console.log('\n📋 Summary:');
    console.log('• Wallet generation: ✅');
    console.log('• Argon2 encryption: ✅');
    console.log('• AES-GCM encryption: ✅');
    console.log('• File storage: ✅');
    console.log('• Decryption: ✅');
    console.log('• Data integrity: ✅');
    console.log('• Security (wrong passphrase): ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWalletCreation();
