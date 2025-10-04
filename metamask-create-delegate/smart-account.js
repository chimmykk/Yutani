import { ethers } from 'ethers';
import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';
import { Implementation, toMetaMaskSmartAccount } from '@metamask/delegation-toolkit';
import { getViemClients } from './mm-clients.js';
import { getPrivateKeyHex } from './key-utils.js';

// In this simplified implementation, we treat the EOA derived from PRIVATE_KEY
// as the controlling account for swaps. If you later integrate an actual smart
// account (e.g., via a factory), you can replace the internals accordingly.
export async function createSmartAccount(ownerAddress, network = 'sepolia') {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  const { publicClient } = getViemClients(network);
  const eoa = privateKeyToAccount(getPrivateKeyHex());

  if (ownerAddress && ownerAddress.toLowerCase() !== eoa.address.toLowerCase()) {
    console.warn(
      `Provided ownerAddress (${ownerAddress}) differs from PRIVATE_KEY address (${eoa.address}). Using PRIVATE_KEY address.`
    );
  }

  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [eoa.address, [], [], []],
    deploySalt: '0x',
    signer: { account: eoa },
  });

  console.log(`Smart account ready (counterfactual until first user operation): ${smartAccount.address}`);
  return smartAccount.address;
}
