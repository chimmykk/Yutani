import 'dotenv/config';
import { ethers } from 'ethers';
import { executeSwap } from './swap-functions.js';
import { interpretSwapInstruction } from './gemini-swap.js';

/**
 * Execute a token swap using the smart account
 * @param {string} tokenIn - Input token symbol (ETH, USDC, USDT, DAI, WETH)
 * @param {string} tokenOut - Output token symbol
 * @param {string} amount - Amount to swap
 * @param {string} network - Network (sepolia, mainnet, polygon, arbitrum)
 * @returns {Promise<Object>} Swap result with transaction details
 */
export async function swapTokens(tokenIn, tokenOut, amount, network = 'sepolia') {
  console.log(`🔄 Swapping ${amount} ${tokenIn} -> ${tokenOut} on ${network}`);
  
  try {
    const result = await executeSwap({ tokenIn, tokenOut, amount, network });
    console.log('✅ Swap successful!');
    console.log(`   Transaction Hash: ${result.txHash}`);
    console.log(`   Amount Received: ${result.amountOut} ${tokenOut}`);
    console.log(`   Gas Used: ${result.gasUsed}`);
    if (result.blockNumber) {
      console.log(`   Block Number: ${result.blockNumber}`);
    }
    return result;
  } catch (error) {
    console.error('❌ Swap failed:', error.message);
    throw error;
  }
}

/**
 * Parse swap command from text input using AI
 * @param {string} text - Input text like "swap 0.1 ETH for USDC on sepolia"
 * @returns {Promise<Object>} Parsed swap parameters
 */
export async function parseSwapCommand(text) {
  try {
    console.log('🧠 AI is parsing your swap instruction...');
    const parsedInstruction = await interpretSwapInstruction(text);
    console.log('📋 Parsed Instruction:', JSON.stringify(parsedInstruction, null, 2));
    
    if (parsedInstruction.operation !== 'swap') {
      throw new Error("Only 'swap' operations are supported.");
    }
    
    return parsedInstruction;
  } catch (error) {
    console.error('❌ Failed to parse swap instruction:', error.message);
    throw error;
  }
}

/**
 * Parse simple swap command without AI
 * @param {string} text - Input text like "swap 0.1 ETH for USDC on sepolia"
 * @returns {Object} Parsed swap parameters
 */
export function parseSimpleSwapCommand(text) {
  const lower = String(text).toLowerCase();
  
  // Extract amount
  const amountMatch = lower.match(/swap\s+([0-9]+(?:\.[0-9]+)?)/);
  const amount = amountMatch ? amountMatch[1] : '0.0';
  
  // Extract tokens
  const tokenInMatch = lower.match(/swap\s+[0-9]+(?:\.[0-9]+)?\s+(\w+)/);
  const tokenIn = tokenInMatch ? tokenInMatch[1].toUpperCase() : 'ETH';
  
  const tokenOutMatch = lower.match(/for\s+(\w+)/);
  const tokenOut = tokenOutMatch ? tokenOutMatch[1].toUpperCase() : 'USDC';
  
  // Extract network
  let network = 'sepolia';
  if (lower.includes('mainnet')) network = 'mainnet';
  else if (lower.includes('sepolia')) network = 'sepolia';
  else if (lower.includes('polygon')) network = 'polygon';
  else if (lower.includes('arbitrum')) network = 'arbitrum';
  
  return { tokenIn, tokenOut, amount, network };
}

// Main execution block - runs when file is executed directly
async function main() {
  console.log('🔄 Starting Token Swap...');

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
    console.log('   node swap-token.js "swap 0.1 ETH for USDC on sepolia"');
    console.log('   node swap-token.js "swap 10 USDC for ETH on sepolia"');
    console.log('   node swap-token.js "swap 0.001 ETH for USDT on mainnet"');
    return;
  }

  try {
    console.log(`🗣️ You said: "${userInstruction}"`);
    
    // Try AI parsing first, fallback to simple parsing
    let parsed;
    try {
      parsed = await parseSwapCommand(userInstruction);
    } catch (aiError) {
      console.log('⚠️ AI parsing failed, using simple parsing...');
      parsed = parseSimpleSwapCommand(userInstruction);
    }
    
    console.log(`\n🔄 Executing swap: ${parsed.amount} ${parsed.tokenIn} -> ${parsed.tokenOut} on ${parsed.network}`);
    const result = await swapTokens(parsed.tokenIn, parsed.tokenOut, parsed.amount, parsed.network);
    
    console.log('\n🎉 Swap completed successfully!');
    console.log(`   Input: ${parsed.amount} ${parsed.tokenIn}`);
    console.log(`   Output: ${result.amountOut} ${parsed.tokenOut}`);
    console.log(`   Network: ${parsed.network}`);
    console.log(`   Transaction: ${result.txHash}`);

  } catch (error) {
    console.error('\n❌ An error occurred during swap:');
    console.error(error.message);
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
