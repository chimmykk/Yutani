import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { Implementation, toMetaMaskSmartAccount } from '@metamask/delegation-toolkit';
import { getViemClients } from './mm-clients.js';
import { getPrivateKeyHex } from './key-utils.js';
import { executeSwap, withdrawToken } from './swap-functions.js';
import { interpretSwapInstruction } from './gemini-swap.js';
import 'dotenv/config';

const NETWORKS = {
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL,
    chainId: 11155111,
    contracts: {
      swapRouter: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
      weth: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
      usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    }
  },
  mainnet: {
    rpcUrl: process.env.MAINNET_RPC_URL,
    chainId: 1,
    contracts: {
      swapRouter: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
      weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      usdc: '0xA0b86a33E6bfeE89E01D12F9d7Ab93C98BE0d6e7'
    }
  }
};

const TOKENS = {
  ETH: { decimals: 18, isNative: true },
  WETH: { decimals: 18, isNative: false },
  USDC: { decimals: 6, isNative: false },
  USDT: { decimals: 6, isNative: false },
  DAI: { decimals: 18, isNative: false }
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

/**
 * Get the smart account instance
 * @param {string} network - Network to use (default: 'sepolia')
 * @returns {Promise<Object>} Smart account instance
 */
export async function getSmartAccount(network = 'sepolia') {
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

  return smartAccount;
}

/**
 * Get smart account address
 * @param {string} network - Network to use (default: 'sepolia')
 * @returns {Promise<string>} Smart account address
 */
export async function getSmartAccountAddress(network = 'sepolia') {
  const smartAccount = await getSmartAccount(network);
  return smartAccount.address;
}

/**
 * Check smart account balance for a specific token
 * @param {string} token - Token symbol (ETH, USDC, etc.)
 * @param {string} network - Network to check (default: 'sepolia')
 * @returns {Promise<string>} Formatted balance
 */
export async function getSmartAccountBalance(token, network = 'sepolia') {
  try {
    const smartAccount = await getSmartAccount(network);
    const address = smartAccount.address;

    if (token === 'ETH') {
      const { publicClient } = getViemClients(network);
      const balance = await publicClient.getBalance({ address });
      return ethers.formatEther(balance);
    } else {
      const networkConfig = NETWORKS[network];
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${network}`);
      }

      const tokenAddress = getTokenAddress(token, network);
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const balance = await tokenContract.balanceOf(address);
      const decimals = TOKENS[token]?.decimals || 18;
      return ethers.formatUnits(balance, decimals);
    }
  } catch (error) {
    console.error(`❌ Failed to get ${token} balance:`, error.message);
    return '0';
  }
}

/**
 * Get all token balances for the smart account
 * @param {string} network - Network to check (default: 'sepolia')
 * @returns {Promise<Object>} Object with token balances
 */
export async function getAllBalances(network = 'sepolia') {
  console.log('💰 Checking smart account balances...');
  
  const balances = {};
  const tokens = ['ETH', 'USDC', 'WETH'];
  
  for (const token of tokens) {
    try {
      const balance = await getSmartAccountBalance(token, network);
      balances[token] = balance;
      console.log(`   ${token}: ${balance}`);
    } catch (error) {
      console.warn(`   ${token}: Error - ${error.message}`);
      balances[token] = '0';
    }
  }
  
  return balances;
}

/**
 * Execute a swap from the smart account
 * @param {string} tokenIn - Input token symbol
 * @param {string} tokenOut - Output token symbol
 * @param {string} amount - Amount to swap
 * @param {string} network - Network to use (default: 'sepolia')
 * @returns {Promise<Object>} Swap result
 */
export async function smartSwap(tokenIn, tokenOut, amount, network = 'sepolia') {
  console.log(`\n🔄 Smart Account Swap: ${amount} ${tokenIn} → ${tokenOut} on ${network}`);
  
  try {
    // Check if smart account has sufficient balance
    const balance = await getSmartAccountBalance(tokenIn, network);
    const requiredAmount = parseFloat(amount);
    const availableBalance = parseFloat(balance);
    
    if (availableBalance < requiredAmount) {
      throw new Error(`Insufficient ${tokenIn} balance. Available: ${balance}, Required: ${amount}`);
    }
    
    console.log(`✅ Smart account has sufficient ${tokenIn} balance: ${balance}`);
    
    // Execute the swap
    const result = await executeSwap({ tokenIn, tokenOut, amount, network });
    
    console.log('✅ Smart swap successful!');
    console.log(`   Transaction Hash: ${result.txHash}`);
    console.log(`   Amount Received: ${result.amountOut} ${tokenOut}`);
    console.log(`   Gas Used: ${result.gasUsed}`);
    
    if (result.blockNumber) {
      console.log(`   Block Number: ${result.blockNumber}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Smart swap failed:', error.message);
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

/**
 * Withdraw tokens from smart account to EOA
 * @param {string} token - Token to withdraw (ETH, USDC, etc.)
 * @param {string} amount - Amount to withdraw
 * @param {string} to - Recipient address (defaults to EOA)
 * @param {string} network - Network to use (default: 'sepolia')
 * @returns {Promise<Object>} Withdrawal result
 */
export async function withdrawFromSmartAccount(token, amount, to = null, network = 'sepolia') {
  if (!to) {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    to = wallet.address;
    console.log(`📍 Withdrawing to your EOA address: ${to}`);
  }
  
  console.log(`\n💸 Withdrawing ${amount} ${token} from smart account to ${to}`);
  
  try {
    const result = await withdrawToken({ token, amount, to, network });
    
    console.log('✅ Withdrawal successful!');
    console.log(`   Transaction Hash: ${result.txHash}`);
    console.log(`   Gas Used: ${result.gasUsed}`);
    
    if (result.blockNumber) {
      console.log(`   Block Number: ${result.blockNumber}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Withdrawal failed:', error.message);
    throw error;
  }
}

/**
 * Get token address for a given token symbol
 * @param {string} token - Token symbol
 * @param {string} network - Network
 * @returns {string} Token contract address
 */
function getTokenAddress(token, network) {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  switch (token) {
    case 'ETH':
    case 'WETH':
      return networkConfig.contracts.weth;
    case 'USDC':
      return networkConfig.contracts.usdc;
    default:
      throw new Error(`Token address not configured: ${token}`);
  }
}

/**
 * Display smart account information
 * @param {string} network - Network to check (default: 'sepolia')
 */
export async function displaySmartAccountInfo(network = 'sepolia') {
  console.log('\n📊 Smart Account Information');
  console.log('=' .repeat(50));
  
  try {
    const address = await getSmartAccountAddress(network);
    console.log(`📍 Smart Account Address: ${address}`);
    console.log(`🌐 Network: ${network}`);
    
    const balances = await getAllBalances(network);
    console.log('\n💰 Token Balances:');
    for (const [token, balance] of Object.entries(balances)) {
      console.log(`   ${token}: ${balance}`);
    }
  } catch (error) {
    console.error('❌ Failed to get smart account info:', error.message);
  }
}

// Main execution block - runs when file is executed directly
async function main() {
  console.log('🤖 Smart Account Swap Interface');
  console.log('=' .repeat(50));

  // 1. Setup Wallet
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env file.');
    return;
  }
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
  console.log(`🔑 Using wallet: ${wallet.address}`);

  // 2. Display smart account info
  await displaySmartAccountInfo();

  // 3. Parse command line arguments
  const userInstruction = process.argv.slice(2).join(' ');

  if (!userInstruction) {
    console.log('\n📄 Usage Examples:');
    console.log('   node smartswap.js "swap 0.1 ETH for USDC on sepolia"');
    console.log('   node smartswap.js "swap 10 USDC for ETH on sepolia"');
    console.log('   node smartswap.js "withdraw 0.05 ETH"');
    console.log('   node smartswap.js "withdraw 0.05 ETH to 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"');
    console.log('   node smartswap.js "balance"');
    console.log('\n💡 Commands:');
    console.log('   - swap [amount] [token] for [token] on [network]');
    console.log('   - withdraw [amount] [token] (withdraws to your EOA)');
    console.log('   - withdraw [amount] [token] to [address] (withdraws to specific address)');
    console.log('   - balance (show all balances)');
    return;
  }

  try {
    console.log(`\n🗣️ You said: "${userInstruction}"`);
    
    // Handle balance command
    if (userInstruction.toLowerCase().includes('balance')) {
      await displaySmartAccountInfo();
      return;
    }
    
    // Handle withdraw command
    if (userInstruction.toLowerCase().includes('withdraw')) {
      // Try to match: withdraw [amount] [token] to [address]
      const withdrawWithAddressMatch = userInstruction.match(/withdraw\s+([0-9]+(?:\.[0-9]+)?)\s+(\w+)\s+to\s+(0x[a-fA-F0-9]{40})/i);
      if (withdrawWithAddressMatch) {
        const [, amount, token, address] = withdrawWithAddressMatch;
        await withdrawFromSmartAccount(token.toUpperCase(), amount, address);
        return;
      }
      
      // Try to match: withdraw [amount] [token] (defaults to EOA)
      const withdrawMatch = userInstruction.match(/withdraw\s+([0-9]+(?:\.[0-9]+)?)\s+(\w+)/i);
      if (withdrawMatch) {
        const [, amount, token] = withdrawMatch;
        await withdrawFromSmartAccount(token.toUpperCase(), amount);
        return;
      } else {
        console.error('❌ Invalid withdraw format. Use:');
        console.error('   withdraw [amount] [token] (withdraws to your EOA)');
        console.error('   withdraw [amount] [token] to [address] (withdraws to specific address)');
        return;
      }
    }
    
    // Handle swap command
    if (userInstruction.toLowerCase().includes('swap')) {
      // Try AI parsing first, fallback to simple parsing
      let parsed;
      try {
        parsed = await parseSwapCommand(userInstruction);
      } catch (aiError) {
        console.log('⚠️ AI parsing failed, using simple parsing...');
        parsed = parseSimpleSwapCommand(userInstruction);
      }
      
      console.log(`\n🔄 Executing smart swap: ${parsed.amount} ${parsed.tokenIn} → ${parsed.tokenOut} on ${parsed.network}`);
      const result = await smartSwap(parsed.tokenIn, parsed.tokenOut, parsed.amount, parsed.network);
      
      console.log('\n🎉 Smart swap completed successfully!');
      console.log(`   Input: ${parsed.amount} ${parsed.tokenIn}`);
      console.log(`   Output: ${result.amountOut} ${parsed.tokenOut}`);
      console.log(`   Network: ${parsed.network}`);
      console.log(`   Transaction: ${result.txHash}`);
      
      // Show updated balances
      console.log('\n💰 Updated Balances:');
      await displaySmartAccountInfo(parsed.network);
    } else {
      console.log('❌ Unknown command. Use "swap", "withdraw", or "balance"');
    }

  } catch (error) {
    console.error('\n❌ An error occurred:');
    console.error(error.message);
  }
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
