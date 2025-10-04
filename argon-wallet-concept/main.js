// encrypt-decrypt-passphrase.js
const crypto = require('crypto');
const argon2 = require('argon2');
const readline = require('readline');

// Helper: prompt user
function question(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve(ans); }));
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

async function run() {
  // STEP 1: Encryption
  const pass = await question('🔐 Enter a passphrase to ENCRYPT: ');
  const salt = crypto.randomBytes(16);
  const key = await deriveKey(pass, salt);
  const secret = Buffer.from('secret_wallet_data_here'); // ← your real secret

  const { iv, encrypted, tag } = aesEncrypt(secret, key);

  // Store this blob in DB
  const blob = {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
    kdf: { type: 'argon2id', timeCost: 3, memoryCost: 2 ** 16, parallelism: 1 },
  };

  console.log('\n✅ Encrypted and stored securely.');
  console.log(JSON.stringify(blob, null, 2));

  // STEP 2: Decryption
  const pass2 = await question('\n🔓 Enter your passphrase to DECRYPT: ');
  try {
    const salt2 = Buffer.from(blob.salt, 'base64');
    const key2 = await deriveKey(pass2, salt2, blob.kdf);
    const iv2 = Buffer.from(blob.iv, 'base64');
    const tag2 = Buffer.from(blob.tag, 'base64');
    const cipher2 = Buffer.from(blob.ciphertext, 'base64');

    const decrypted = aesDecrypt(cipher2, key2, iv2, tag2);
    console.log('\n✅ Decrypted secret:', decrypted.toString('utf8'));
  } catch (err) {
    console.error('\n❌ Decryption failed: wrong passphrase or corrupted data.');
  }
}

run();
