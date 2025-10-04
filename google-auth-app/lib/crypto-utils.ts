// Browser-compatible crypto utilities
// Note: Actual encryption/decryption is handled server-side via API routes

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

// Client-side API functions for wallet management
// All encryption/decryption is handled server-side via API routes

// API functions for wallet management
export async function saveEncryptedCredentials(
  credentials: WalletCredentials,
  passphrase: string,
  filename: string
): Promise<void> {
  const response = await fetch('/api/wallet/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      credentials,
      passphrase,
      filename
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save wallet');
  }
}

export async function loadEncryptedCredentials(
  filename: string,
  passphrase: string
): Promise<WalletCredentials> {
  const response = await fetch('/api/wallet/load', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename,
      passphrase
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to load wallet');
  }

  const data = await response.json();
  return data.wallet;
}

export async function getSavedWallets(): Promise<Array<{filename: string, createdAt: string}>> {
  const response = await fetch('/api/wallet/list');
  
  if (!response.ok) {
    throw new Error('Failed to list wallets');
  }

  const data = await response.json();
  return data.wallets;
}

export async function deleteSavedWallet(filename: string): Promise<void> {
  const response = await fetch('/api/wallet/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete wallet');
  }
}
