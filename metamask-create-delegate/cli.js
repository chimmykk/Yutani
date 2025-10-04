import 'dotenv/config';
import { createSmartAccount } from './smart-account.js';
import { createAgentDelegation } from './create-delegation.js';
import { interpretSwapInstruction } from './gemini-swap.js';
import { executeSwap, withdrawToken } from './swap-functions.js';
import { ethers } from 'ethers';

async function main() {
  console.log('🤖 Starting AI Crypto Agent CLI...');

  // 1. Setup Wallet
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env file.');
    return;
  }
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  console.log(`🔑 Using wallet: ${wallet.address}`);

  // 2. Create Smart Account
  console.log('\n--- Step 1: Creating Smart Account ---');
  const smartAccountAddress = await createSmartAccount(wallet.address);
  console.log(`✅ Smart Account created at: ${smartAccountAddress}`);

  // 3. Create Delegation
  // In a real-world scenario, the agent would be a separate, secure wallet.
  // For this example, we'll use the same wallet as the agent.
  const agentAddress = wallet.address;
  const delegation = await createAgentDelegation(smartAccountAddress, agentAddress);


  // 4. Execute Swap via AI command
  console.log('\n--- Step 3: Executing Command ---');
  const userInstruction = process.argv.slice(2).join(' ');

  if (!userInstruction) {
    console.log('📄 Usage:');
    console.log('   Swap:     node cli.js "swap 0.001 ETH for USDC on sepolia"');
    console.log('   Withdraw: node cli.js "withdraw 10 USDC to 0xYourAddr on sepolia"');
    return;
  }

  try {
    console.log(`🗣️ You said: "${userInstruction}"`);

    // Withdraw command quick path
    if (userInstruction.toLowerCase().startsWith('withdraw')) {
      const parsed = parseWithdraw(userInstruction, wallet.address);
      console.log('📋 Parsed Instruction:', JSON.stringify({ operation: 'withdraw', ...parsed }, null, 2));
      console.log(`\n🏦 Withdrawing: ${parsed.amount} ${parsed.token} to ${parsed.to} on ${parsed.network}`);
      const result = await withdrawToken({ token: parsed.token, amount: parsed.amount, to: parsed.to, network: parsed.network });
      console.log('\n🎉 Withdraw successful!');
      console.log('   Transaction Hash:', result.txHash);
      console.log('   Gas Used:', result.gasUsed);
      return;
    }

    console.log('🧠 AI is parsing your instruction...');
    const parsedInstruction = await interpretSwapInstruction(userInstruction);
    console.log('📋 Parsed Instruction:', JSON.stringify(parsedInstruction, null, 2));

    if (parsedInstruction.operation !== 'swap') {
      throw new Error("Only 'swap' or 'withdraw' operations are supported.");
    }

    console.log(`\n🔄 Executing swap: ${parsedInstruction.amount} ${parsedInstruction.tokenIn} -> ${parsedInstruction.tokenOut} on ${parsedInstruction.network}`);
    const result = await executeSwap(parsedInstruction);
    console.log('\n🎉 Swap successful!');
    console.log('   Transaction Hash:', result.txHash);
    console.log(`   Amount Received: ${result.amountOut} ${parsedInstruction.tokenOut}`);
    console.log('   Gas Used:', result.gasUsed);

  } catch (error) {
    console.error('\n❌ An error occurred during the swap process:');
    console.error(error.message);
  }
}

main();

function parseWithdraw(text, defaultTo) {
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
