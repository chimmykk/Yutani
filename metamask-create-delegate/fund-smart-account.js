import 'dotenv/config';
import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { Implementation, toMetaMaskSmartAccount } from '@metamask/delegation-toolkit';
import { getViemClients } from './mm-clients.js';
import { getPrivateKeyHex } from './key-utils.js';

async function main() {
  const network = (process.argv[2] || 'sepolia').toLowerCase();
  const amountEth = process.argv[3] || '0.01';

  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  const { publicClient } = getViemClients(network);
  const account = privateKeyToAccount(getPrivateKeyHex());

  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [account.address, [], [], []],
    deploySalt: '0x',
    signer: { account },
  });

  const rpcUrl = network === 'mainnet' ? process.env.MAINNET_RPC_URL : process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error(`Missing RPC URL for ${network}. Set SEPOLIA_RPC_URL or MAINNET_RPC_URL`);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(getPrivateKeyHex(), provider);

  console.log(`Funding smart account ${smartAccount.address} from ${wallet.address} with ${amountEth} ${network === 'sepolia' ? 'ETH' : 'ETH'}`);
  const tx = await wallet.sendTransaction({
    to: smartAccount.address,
    value: ethers.parseEther(amountEth)
  });
  console.log('Sent funding tx:', tx.hash);
  const receipt = await tx.wait();
  console.log('Confirmed in block', receipt.blockNumber);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


