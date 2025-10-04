import 'dotenv/config';
import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { Implementation, toMetaMaskSmartAccount } from '@metamask/delegation-toolkit';
import { getViemClients } from './mm-clients.js';
import { getPrivateKeyHex } from './key-utils.js';
import { withdrawToken } from './swap-functions.js';

/**
 * Withdraw tokens from smart account to any address
 * @param {string} token - Token symbol (ETH, USDC, USDT, DAI, WETH)
 * @param {string} amount - Amount to withdraw
 * @param {string} to - Recipient address
 * @param {string} network - Network (sepolia, mainnet, polygon, arbitrum)
 * @returns {Promise<Object>} Withdrawal result with transaction details
 */
export async function withdrawFromSmartAccount(token, amount, to, network = 'sepolia') {
  console.log(`🏦 Withdrawing ${amount} ${token} to ${to} on ${network}`);
  
  try {
    const result = await withdrawToken({ token, amount, to, network });
    console.log('✅ Withdraw successful!');
    console.log(`   Transaction Hash: ${result.txHash}`);
    console.log(`   Gas Used: ${result.gasUsed}`);
    if (result.blockNumber) {
      console.log(`   Block Number: ${result.blockNumber}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Withdraw failed:', error.message);
    throw error;
  }
}

/**
 * Parse withdraw command from text input
 * @param {string} text - Input text like "withdraw 10 USDC to 0x123..."
 * @param {string} defaultTo - Default recipient if not specified
 * @returns {Object} Parsed withdraw parameters
 */
export function parseWithdrawCommand(text, defaultTo) {
  const lower = String(text).toLowerCase();
  const amountMatch = lower.match(/withdraw\s+([0-9]+(?:\.[0-9]+)?)/);
  const amount = amountMatch ? amountMatch[1] : '0.0';
  const tokenMatch = lower.match(/\b(eth|weth|usdc|usdt|dai)\b/);
  const token = tokenMatch ? tokenMatch[1].toUpperCase() : 'USDC';
  const toMatch = lower.match(/to\s+(0x[a-f0-9]{40})/);
  const to = toMatch ? toMatch[1] : defaultTo;
  let network = 'sepolia';
  if (lower.includes('mainnet')) network = 'mainnet';
  else if (lower.includes('sepolia')) network = 'sepolia';
  else if (lower.includes('polygon')) network = 'polygon';
  else if (lower.includes('arbitrum')) network = 'arbitrum';
  return { amount, token, to, network };
}

// Main execution block - runs when file is executed directly
async function main() {
  console.log('🏦 Starting Token Withdrawal...');

  // 1. Setup Wallet
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env file.');
    return;
  }
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  console.log(`🔑 Using wallet: ${wallet.address}`);

  // 2. Parse command line arguments
  const userInstruction = process.argv.slice(2).join(' ');

  if (!userInstruction) {
    console.log('📄 Usage:');
    console.log('   node withdraw.js "withdraw 10 USDC to 0xYourAddress on sepolia"');
    console.log('   node withdraw.js "withdraw 0.1 ETH to 0xYourAddress on sepolia"');
    console.log('   node withdraw.js "withdraw 5 USDT to 0xYourAddress on mainnet"');
    return;
  }

  try {
    console.log(`🗣️ You said: "${userInstruction}"`);
    
    const parsed = parseWithdrawCommand(userInstruction, wallet.address);
    console.log('📋 Parsed Command:', JSON.stringify({ operation: 'withdraw', ...parsed }, null, 2));
    
    const result = await withdrawFromSmartAccount(parsed.token, parsed.amount, parsed.to, parsed.network);
    
    console.log('\n🎉 Withdrawal completed successfully!');
    console.log(`   Amount: ${parsed.amount} ${parsed.token}`);
    console.log(`   To: ${parsed.to}`);
    console.log(`   Network: ${parsed.network}`);
    console.log(`   Transaction: ${result.txHash}`);

  } catch (error) {
    console.error('\n❌ An error occurred during withdrawal:');
    console.error(error.message);
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
