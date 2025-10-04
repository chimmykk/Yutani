import { createDelegation } from './delegation.js';
import { createSmartAccount } from './smart-account.js';
import { ethers } from 'ethers';
import { privateKeyToAccount } from 'viem/accounts';
import { Implementation, toMetaMaskSmartAccount } from '@metamask/delegation-toolkit';
import { getViemClients } from './mm-clients.js';
import { getPrivateKeyHex } from './key-utils.js';
import 'dotenv/config';

/**
 * Creates a delegation for the AI agent to act on behalf of the smart account
 * @param {string} smartAccountAddress - The smart account address
 * @param {string} agentAddress - The agent wallet address
 * @param {string} network - The network to create delegation on (default: 'sepolia')
 * @returns {Promise<Object>} Delegation object with delegationId and scope
 */
export async function createAgentDelegation(smartAccountAddress, agentAddress, network = 'sepolia') {
  console.log('\n--- Creating Delegation ---');
  
  // Define permissions for the AI agent
  const permissions = {
    // Define specific permissions here, e.g., allowed contracts, functions, spending limits.
    // For this demo, we'll assume the agent has permission to call the swap router.
    allowedContracts: [
        '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E' // Sepolia Uniswap v3 Router
    ],
    allowAllFunctions: true // Be very careful with this in production!
  };

  try {
    const delegation = await createDelegation(smartAccountAddress, agentAddress, permissions, network);
    console.log(`✅ Delegation created with ID: ${delegation.delegationId}`);
    if (delegation.scope) {
      console.log(`   Scope target: ${delegation.scope?.caveats?.[0]?.value?.target || permissions.allowedContracts?.[0] || 'none'}`);
    }
    return delegation;
  } catch (error) {
    console.error('❌ Failed to create delegation:', error.message);
    throw error;
  }
}

/**
 * Funds and deploys the smart account on-chain
 * @param {string} smartAccountAddress - The smart account address
 * @param {string} network - The network to deploy on (default: 'sepolia')
 * @param {string} amountEth - Amount of ETH to fund (default: '0.01')
 * @returns {Promise<Object>} Deployment result with transaction details
 */
export async function fundAndDeploySmartAccount(smartAccountAddress, network = 'sepolia', amountEth = '0.01') {
  console.log('\n--- Step 2: Funding and Deploying Smart Account ---');
  
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  const { publicClient } = getViemClients(network);
  const account = privateKeyToAccount(getPrivateKeyHex());

  // Create the smart account instance for deployment
  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [account.address, [], [], []],
    deploySalt: '0x',
    signer: { account },
  });

  // Get RPC URL for the network
  const rpcUrl = network === 'mainnet' ? process.env.MAINNET_RPC_URL : process.env.SEPOLIA_RPC_URL;
  if (!rpcUrl) {
    throw new Error(`Missing RPC URL for ${network}. Set SEPOLIA_RPC_URL or MAINNET_RPC_URL`);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(getPrivateKeyHex(), provider);

  console.log(`💰 Funding smart account ${smartAccountAddress} from ${wallet.address} with ${amountEth} ETH`);
  
  // Send funding transaction
  const tx = await wallet.sendTransaction({
    to: smartAccountAddress,
    value: ethers.parseEther(amountEth)
  });
  
  console.log(`📤 Sent funding tx: ${tx.hash}`);
  console.log('⏳ Waiting for confirmation...');
  
  const receipt = await tx.wait();
  console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
  
  // Now deploy the smart account by sending a user operation
  console.log('🚀 Deploying smart account to blockchain...');
  
  try {
    const { bundlerClient } = getViemClients(network);
    
    if (!bundlerClient) {
      console.log('⚠️ No bundler client available, smart account will be deployed on first use');
      return {
        fundingTx: tx.hash,
        fundingBlock: receipt.blockNumber,
        userOpHash: null,
        deploymentTx: null,
        deploymentBlock: null,
        note: 'Smart account will be deployed automatically on first user operation'
      };
    }

    // Dynamic gas from bundler
    let maxFeePerGas = 1n;
    let maxPriorityFeePerGas = 1n;
    try {
      const gasResult = await bundlerClient.request({ method: 'pimlico_getUserOperationGasPrice' });
      const standard = gasResult?.standard || gasResult || {};
      if (standard.maxFeePerGas) maxFeePerGas = BigInt(standard.maxFeePerGas);
      if (standard.maxPriorityFeePerGas) maxPriorityFeePerGas = BigInt(standard.maxPriorityFeePerGas);
    } catch (e) {
      console.warn('Failed to fetch bundler gas price, using defaults:', e?.message || e);
    }

    // This will trigger the actual deployment since it's the first user operation
    const userOperationHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [{ to: smartAccountAddress, data: '0x', value: 0n }], // Self-call to trigger deployment
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
    
    console.log(`📤 User operation sent: ${userOperationHash}`);
    console.log('⏳ Waiting for user operation confirmation...');
    
    // Wait for the user operation to be mined
    const userOpReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOperationHash });
    console.log(`✅ Smart account deployed! Transaction: ${userOpReceipt.receipt?.transactionHash}`);
    
    return {
      fundingTx: tx.hash,
      fundingBlock: receipt.blockNumber,
      userOpHash: userOperationHash,
      deploymentTx: userOpReceipt.receipt?.transactionHash,
      deploymentBlock: userOpReceipt.receipt?.blockNumber
    };
  } catch (error) {
    console.error('❌ Failed to deploy smart account:', error.message);
    console.log('⚠️ Smart account will be deployed automatically on first use');
    return {
      fundingTx: tx.hash,
      fundingBlock: receipt.blockNumber,
      userOpHash: null,
      deploymentTx: null,
      deploymentBlock: null,
      note: 'Smart account will be deployed automatically on first user operation'
    };
  }
}

// Main execution block - runs when file is executed directly
async function main() {
  console.log('🤖 Starting Delegation Creation...');

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

  // 3. Fund and Deploy Smart Account
  const deploymentResult = await fundAndDeploySmartAccount(smartAccountAddress);
  console.log(`✅ Smart Account funded and deployed on-chain!`);

  // 4. Create Delegation
  const agentAddress = wallet.address;
  const delegation = await createAgentDelegation(smartAccountAddress, agentAddress);
  
  console.log('\n🎉 Delegation setup complete!');
  console.log('\n📋 Summary:');
  console.log(`   Smart Account: ${smartAccountAddress}`);
  console.log(`   Funding TX: ${deploymentResult.fundingTx}`);
  if (deploymentResult.deploymentTx) {
    console.log(`   Deployment TX: ${deploymentResult.deploymentTx}`);
  } else {
    console.log(`   Deployment: ${deploymentResult.note || 'Will be deployed on first use'}`);
  }
  console.log(`   Delegation ID: ${delegation.delegationId}`);
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
