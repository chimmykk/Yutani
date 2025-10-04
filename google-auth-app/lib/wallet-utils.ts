import { ethers } from 'ethers';

export interface WalletData {
  address: string;
  privateKey: string;
  mnemonic?: string;
}

export function createEvmWallet(): WalletData {
  console.log('Creating EVM Wallet');
  const wallet = ethers.Wallet.createRandom();
  const privateKey = wallet.privateKey;
  const mnemonic = wallet.mnemonic?.phrase;

  return {
    address: wallet.address,
    privateKey: privateKey,
    mnemonic: mnemonic
  };
}

export function createWalletFromMnemonic(mnemonic: string): WalletData | null {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: mnemonic
    };
  } catch (error) {
    console.error('Error creating wallet from mnemonic:', error);
    return null;
  }
}

export function createWalletFromPrivateKey(privateKey: string): WalletData | null {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error('Error creating wallet from private key:', error);
    return null;
  }
}
