import crypto from 'crypto';
import argon2 from 'argon2';

export interface EncryptedBlob {
  salt: string;
  iv: string;
  tag: string;
  ciphertext: string;
  kdf: {
    type: string;
    timeCost: number;
    memoryCost: number;
    parallelism: number;
  };
}

export interface WalletCredentials {
  address: string;
  privateKey: string;
  mnemonic?: string;
  createdAt: string;
  encrypted: boolean;
}

// Derive key from passphrase using Argon2id
export async function deriveKey(
  passphrase: string, 
  salt: Buffer, 
  options: {
    timeCost?: number;
    memoryCost?: number;
    parallelism?: number;
  } = {}
): Promise<Buffer> {
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
export function aesEncrypt(secret: string, key: Buffer): { iv: Buffer; encrypted: Buffer; tag: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, encrypted, tag };
}

// AES-GCM Decrypt
export function aesDecrypt(encrypted: Buffer, key: Buffer, iv: Buffer, tag: Buffer): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// Encrypt wallet credentials
export async function encryptWalletCredentials(
  credentials: WalletCredentials,
  passphrase: string
): Promise<EncryptedBlob> {
  const salt = crypto.randomBytes(16);
  const key = await deriveKey(passphrase, salt);
  const secret = JSON.stringify(credentials);
  
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

// Decrypt wallet credentials
export async function decryptWalletCredentials(
  blob: EncryptedBlob,
  passphrase: string
): Promise<WalletCredentials> {
  try {
    const salt = Buffer.from(blob.salt, 'base64');
    const key = await deriveKey(passphrase, salt, blob.kdf);
    const iv = Buffer.from(blob.iv, 'base64');
    const tag = Buffer.from(blob.tag, 'base64');
    const cipher = Buffer.from(blob.ciphertext, 'base64');
    
    const decrypted = aesDecrypt(cipher, key, iv, tag);
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: wrong passphrase or corrupted data');
  }
}
