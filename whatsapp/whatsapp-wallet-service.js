const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const qrcodeTerminal = require("qrcode-terminal");
const express = require("express");
const { createServer } = require("http");
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class WhatsAppWalletService {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });
    
    this.walletsDir = path.join(__dirname, 'wallets');
    this.isReady = false;
    this.qrCode = null;
    this.ensureWalletsDirectory();
    this.setupEventHandlers();
  }

  async ensureWalletsDirectory() {
    try {
      await fs.access(this.walletsDir);
    } catch {
      await fs.mkdir(this.walletsDir, { recursive: true });
    }
  }

  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('QR Code received, scan with your WhatsApp app');
      this.qrCode = qr;
      qrcodeTerminal.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('WhatsApp client is ready!');
      this.isReady = true;
    });

    this.client.on('authenticated', () => {
      console.log('WhatsApp client authenticated');
    });

    this.client.on('auth_failure', (msg) => {
      console.error('Authentication failed:', msg);
    });

    this.client.on('disconnected', (reason) => {
      console.log('WhatsApp client disconnected:', reason);
      this.isReady = false;
    });
  }

  async initialize() {
    if (!this.isReady) {
      await this.client.initialize();
    }
    return this.isReady;
  }

  async getQRCode() {
    if (!this.qrCode) {
      throw new Error('QR code not available. Please wait for authentication.');
    }
    return this.qrCode;
  }

  // Generate a new wallet
  generateWallet() {
    const { ethers } = require('ethers');
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase,
      createdAt: new Date().toISOString()
    };
  }

  // Encrypt wallet data with passphrase
  async encryptWallet(walletData, passphrase) {
    const algorithm = 'aes-256-gcm';
    const salt = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // Derive key from passphrase using PBKDF2
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
    
    const cipher = crypto.createCipherGCM(algorithm, key, iv);
    cipher.setAAD(Buffer.from('wallet-data', 'utf8'));
    
    let encrypted = cipher.update(JSON.stringify(walletData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      encrypted: encrypted,
      algorithm: algorithm
    };
  }

  // Decrypt wallet data with passphrase
  async decryptWallet(encryptedData, passphrase) {
    const algorithm = 'aes-256-gcm';
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    
    // Derive key from passphrase
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
    
    const decipher = crypto.createDecipherGCM(algorithm, key, iv);
    decipher.setAAD(Buffer.from('wallet-data', 'utf8'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Save encrypted wallet to file
  async saveEncryptedWallet(walletData, passphrase, filename) {
    const encrypted = await this.encryptWallet(walletData, passphrase);
    const filePath = path.join(this.walletsDir, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(encrypted, null, 2));
    return filePath;
  }

  // Load and decrypt wallet from file
  async loadEncryptedWallet(filename, passphrase) {
    const filePath = path.join(this.walletsDir, `${filename}.json`);
    const encryptedData = JSON.parse(await fs.readFile(filePath, 'utf8'));
    return await this.decryptWallet(encryptedData, passphrase);
  }

  // Format phone number for WhatsApp
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // Add @c.us suffix for WhatsApp
    return cleaned + '@c.us';
  }

  // Send wallet information via WhatsApp
  async sendWalletMessage(phoneNumber, walletData, passphrase) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Please initialize first.');
    }

    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    const message = `🔐 *Your New Wallet Created!*

📍 *Address:* \`${walletData.address}\`
🔑 *Private Key:* \`${walletData.privateKey}\`
📝 *Mnemonic:* \`${walletData.mnemonic}\`

🔒 *Encryption Passphrase:* \`${passphrase}\`

⚠️ *IMPORTANT:* Save this information securely!
📅 *Created:* ${walletData.createdAt}

_This message was sent by the Wallet Bot_`;

    try {
      const result = await this.client.sendMessage(formattedNumber, message);
      
      return {
        success: true,
        messageId: result.id._serialized,
        timestamp: result.timestamp,
        status: 'sent'
      };
    } catch (error) {
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  // Create wallet and send via WhatsApp
  async createAndSendWallet(phoneNumber, passphrase) {
    try {
      const walletData = this.generateWallet();
      const filename = `wallet_${walletData.address.slice(0, 8)}_${Date.now()}`;
      
      // Save encrypted wallet
      await this.saveEncryptedWallet(walletData, passphrase, filename);
      
      // Send WhatsApp message
      const messageResult = await this.sendWalletMessage(phoneNumber, walletData, passphrase);
      
      return {
        success: true,
        wallet: walletData,
        filename: filename,
        message: messageResult
      };
    } catch (error) {
      throw new Error(`Failed to create and send wallet: ${error.message}`);
    }
  }

  // Load existing wallet and send via WhatsApp
  async loadAndSendWallet(phoneNumber, filename, passphrase) {
    try {
      const walletData = await this.loadEncryptedWallet(filename, passphrase);
      const messageResult = await this.sendWalletMessage(phoneNumber, walletData, passphrase);
      
      return {
        success: true,
        wallet: walletData,
        message: messageResult
      };
    } catch (error) {
      throw new Error(`Failed to load and send wallet: ${error.message}`);
    }
  }

  // List all saved wallets
  async listWallets() {
    try {
      const files = await fs.readdir(this.walletsDir);
      const wallets = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.walletsDir, file);
          const stats = await fs.stat(filePath);
          wallets.push({
            filename: file.replace('.json', ''),
            createdAt: stats.birthtime,
            size: stats.size
          });
        }
      }
      
      return wallets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      throw new Error(`Failed to list wallets: ${error.message}`);
    }
  }

  // Delete wallet file
  async deleteWallet(filename) {
    try {
      const filePath = path.join(this.walletsDir, `${filename}.json`);
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete wallet: ${error.message}`);
    }
  }

  // Send a simple message
  async sendMessage(phoneNumber, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready. Please initialize first.');
    }

    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    try {
      const result = await this.client.sendMessage(formattedNumber, message);
      
      return {
        success: true,
        messageId: result.id._serialized,
        timestamp: result.timestamp,
        status: 'sent'
      };
    } catch (error) {
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  // Get client status
  getStatus() {
    return {
      isReady: this.isReady,
      hasQRCode: !!this.qrCode
    };
  }

  // Disconnect client
  async disconnect() {
    try {
      await this.client.destroy();
      this.isReady = false;
      this.qrCode = null;
    } catch (error) {
      console.error('Error disconnecting WhatsApp client:', error);
    }
  }
}

module.exports = WhatsAppWalletService;
