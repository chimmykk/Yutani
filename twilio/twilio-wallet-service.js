const twilio = require('twilio');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class TwilioWalletService {
  constructor() {
    // Initialize Twilio client with environment variables
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC00000000000000000000000000000000';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '00000000000000000000000000000000';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '+12345678901';
    
    this.client = twilio(this.accountSid, this.authToken);
    this.walletsDir = path.join(__dirname, 'wallets');
    this.ensureWalletsDirectory();
  }

  async ensureWalletsDirectory() {
    try {
      await fs.access(this.walletsDir);
    } catch {
      await fs.mkdir(this.walletsDir, { recursive: true });
    }
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

  // Send wallet information via SMS
  async sendWalletSMS(phoneNumber, walletData, passphrase) {
    const message = `
🔐 Your New Wallet Created!

Address: ${walletData.address}
Private Key: ${walletData.privateKey}
Mnemonic: ${walletData.mnemonic}

⚠️ IMPORTANT: Save this information securely!
Your passphrase: ${passphrase}

Created: ${walletData.createdAt}
    `.trim();

    try {
      const messageResponse = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber
      });
      
      return {
        success: true,
        messageSid: messageResponse.sid,
        status: messageResponse.status
      };
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  // Make a call to deliver wallet information
  async makeWalletCall(phoneNumber, walletData, passphrase) {
    const twiml = `
      <Response>
        <Say voice="alice">
          Hello! Your new wallet has been created successfully.
          Your wallet address is ${walletData.address}.
          Your private key is ${walletData.privateKey}.
          Your mnemonic phrase is ${walletData.mnemonic}.
          Your encryption passphrase is ${passphrase}.
          Please save this information securely as we cannot recover it if lost.
          Thank you for using our service!
        </Say>
      </Response>
    `;

    try {
      const call = await this.client.calls.create({
        twiml: twiml,
        from: this.phoneNumber,
        to: phoneNumber
      });
      
      return {
        success: true,
        callSid: call.sid,
        status: call.status
      };
    } catch (error) {
      throw new Error(`Failed to make call: ${error.message}`);
    }
  }

  // Create wallet and send via SMS
  async createAndSendWalletSMS(phoneNumber, passphrase) {
    try {
      const walletData = this.generateWallet();
      const filename = `wallet_${walletData.address.slice(0, 8)}_${Date.now()}`;
      
      // Save encrypted wallet
      await this.saveEncryptedWallet(walletData, passphrase, filename);
      
      // Send SMS
      const smsResult = await this.sendWalletSMS(phoneNumber, walletData, passphrase);
      
      return {
        success: true,
        wallet: walletData,
        filename: filename,
        sms: smsResult
      };
    } catch (error) {
      throw new Error(`Failed to create and send wallet: ${error.message}`);
    }
  }

  // Create wallet and deliver via call
  async createAndCallWallet(phoneNumber, passphrase) {
    try {
      const walletData = this.generateWallet();
      const filename = `wallet_${walletData.address.slice(0, 8)}_${Date.now()}`;
      
      // Save encrypted wallet
      await this.saveEncryptedWallet(walletData, passphrase, filename);
      
      // Make call
      const callResult = await this.makeWalletCall(phoneNumber, walletData, passphrase);
      
      return {
        success: true,
        wallet: walletData,
        filename: filename,
        call: callResult
      };
    } catch (error) {
      throw new Error(`Failed to create and call wallet: ${error.message}`);
    }
  }

  // Load existing wallet and send via SMS
  async loadAndSendWalletSMS(phoneNumber, filename, passphrase) {
    try {
      const walletData = await this.loadEncryptedWallet(filename, passphrase);
      const smsResult = await this.sendWalletSMS(phoneNumber, walletData, passphrase);
      
      return {
        success: true,
        wallet: walletData,
        sms: smsResult
      };
    } catch (error) {
      throw new Error(`Failed to load and send wallet: ${error.message}`);
    }
  }

  // Load existing wallet and deliver via call
  async loadAndCallWallet(phoneNumber, filename, passphrase) {
    try {
      const walletData = await this.loadEncryptedWallet(filename, passphrase);
      const callResult = await this.makeWalletCall(phoneNumber, walletData, passphrase);
      
      return {
        success: true,
        wallet: walletData,
        call: callResult
      };
    } catch (error) {
      throw new Error(`Failed to load and call wallet: ${error.message}`);
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
}

module.exports = TwilioWalletService;
