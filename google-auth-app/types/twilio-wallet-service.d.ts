declare module '../../twilio/twilio-wallet-service' {
  interface WalletData {
    address: string;
    privateKey: string;
    mnemonic?: string;
    createdAt: string;
  }

  interface TwilioResult {
    success: boolean;
    wallet: WalletData;
    filename: string;
    sms?: {
      messageSid: string;
      status: string;
    };
    call?: {
      callSid: string;
      status: string;
    };
  }

  class TwilioWalletService {
    constructor();
    generateWallet(): WalletData;
    encryptWallet(walletData: WalletData, passphrase: string): Promise<any>;
    decryptWallet(encryptedData: any, passphrase: string): Promise<WalletData>;
    saveEncryptedWallet(walletData: WalletData, passphrase: string, filename: string): Promise<string>;
    loadEncryptedWallet(filename: string, passphrase: string): Promise<WalletData>;
    sendWalletSMS(phoneNumber: string, walletData: WalletData, passphrase: string): Promise<any>;
    makeWalletCall(phoneNumber: string, walletData: WalletData, passphrase: string): Promise<any>;
    createAndSendWalletSMS(phoneNumber: string, passphrase: string): Promise<TwilioResult>;
    createAndCallWallet(phoneNumber: string, passphrase: string): Promise<TwilioResult>;
    loadAndSendWalletSMS(phoneNumber: string, filename: string, passphrase: string): Promise<TwilioResult>;
    loadAndCallWallet(phoneNumber: string, filename: string, passphrase: string): Promise<TwilioResult>;
    listWallets(): Promise<Array<{filename: string, createdAt: string, size: number}>>;
    deleteWallet(filename: string): Promise<{success: boolean}>;
  }

  export = TwilioWalletService;
}
