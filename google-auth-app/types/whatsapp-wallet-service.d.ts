declare module '../../whatsapp/whatsapp-wallet-service' {
  interface WalletData {
    address: string;
    privateKey: string;
    mnemonic?: string;
    createdAt: string;
  }

  interface WhatsAppResult {
    success: boolean;
    wallet: WalletData;
    filename?: string;
    message: {
      messageId: string;
      timestamp: number;
      status: string;
    };
  }

  class WhatsAppWalletService {
    constructor();
    initialize(): Promise<boolean>;
    getQRCode(): Promise<string>;
    generateWallet(): WalletData;
    encryptWallet(walletData: WalletData, passphrase: string): Promise<any>;
    decryptWallet(encryptedData: any, passphrase: string): Promise<WalletData>;
    saveEncryptedWallet(walletData: WalletData, passphrase: string, filename: string): Promise<string>;
    loadEncryptedWallet(filename: string, passphrase: string): Promise<WalletData>;
    sendWalletMessage(phoneNumber: string, walletData: WalletData, passphrase: string): Promise<any>;
    createAndSendWallet(phoneNumber: string, passphrase: string): Promise<WhatsAppResult>;
    loadAndSendWallet(phoneNumber: string, filename: string, passphrase: string): Promise<WhatsAppResult>;
    listWallets(): Promise<Array<{filename: string, createdAt: string, size: number}>>;
    deleteWallet(filename: string): Promise<{success: boolean}>;
    sendMessage(phoneNumber: string, message: string): Promise<any>;
    getStatus(): {isReady: boolean, hasQRCode: boolean};
    disconnect(): Promise<void>;
    formatPhoneNumber(phoneNumber: string): string;
  }

  export = WhatsAppWalletService;
}
