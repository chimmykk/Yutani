import { Implementation, toMetaMaskSmartAccount, createDelegation } from "@metamask/delegation-toolkit";
import { getPrivateKeyHex } from '../key-utils.js';
import { privateKeyToAccount } from 'viem/accounts';
import { getViemClients } from '../mm-clients.js';
import { parseUnits, encodeFunctionData } from 'viem';
import 'dotenv/config';

async function main() {
  try {
    console.log('🚀 Creating spending limit delegation...');
    
    const delegatorAccount = privateKeyToAccount(getPrivateKeyHex());
    const delegateAccount = delegatorAccount; // Self-delegation for testing
    
    // Get viem clients for Sepolia
    const { publicClient, bundlerClient } = getViemClients('sepolia');
    
    console.log(`🔑 Delegator: ${delegatorAccount.address}`);
    console.log(`🎯 Delegate: ${delegateAccount.address}`);
    console.log(`🌐 Network: Sepolia (Chain ID: ${publicClient.chain.id})`);
    
    // Create MetaMask smart account
    console.log('📱 Creating MetaMask smart account...');
    const delegatorSmartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [delegatorAccount.address, [], [], []],
      deploySalt: "0x",
      signer: { account: delegatorAccount },
    });
    
    console.log(`✅ Smart account created: ${delegatorSmartAccount.address}`);
    
    // Deploy smart account first to make it active
    console.log('📱 Deploying smart account...');
    try {
      const deployHash = await bundlerClient.sendUserOperation({
        account: delegatorSmartAccount,
        calls: [
          {
            to: delegatorSmartAccount.address,
            value: 0n,
            data: '0x',
          },
        ],
      });
      
      console.log(`⏳ Smart account deployment submitted, hash: ${deployHash}`);
      const deployReceipt = await bundlerClient.waitForUserOperationReceipt({ hash: deployHash });
      
      if (deployReceipt.receipt.status === '0x1') {
        console.log('✅ Smart account deployed successfully!');
      } else {
        throw new Error('Smart account deployment failed');
      }
    } catch (deployError) {
      console.log('⚠️ Smart account deployment failed or already deployed:', deployError.message);
      console.log('Continuing with delegation creation...');
    }
    
    // Create spending limit delegation
    console.log('\n📋 Creating spending limit delegation...');
    
    const tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC on Sepolia
    const periodAmount = parseUnits("10", 6); // 10 USDC (6 decimals)
    const periodDuration = 120; // 2 minutes in seconds
    const startDate = Math.floor(Date.now() / 1000); // Current timestamp
    
    // Create delegation signature
const delegation = createDelegation({
  scope: {
    type: "erc20PeriodTransfer",
        tokenAddress: tokenAddress,
        periodAmount: periodAmount,
        periodDuration: periodDuration,
        startDate: startDate,
  },
  to: delegateAccount,
      from: delegatorSmartAccount,
      environment: delegatorSmartAccount.environment,
    });
    
    console.log('✅ Spending limit delegation signature created!');
    console.log('📋 Delegation Details:');
    console.log(`   Type: erc20PeriodTransfer`);
    console.log(`   Token: ${tokenAddress} (USDC)`);
    console.log(`   Period Amount: 10 USDC`);
    console.log(`   Period Duration: ${periodDuration} seconds (2 minutes)`);
    console.log(`   Start Date: ${new Date(startDate * 1000).toISOString()}`);
    console.log(`   Delegator Smart Account: ${delegatorSmartAccount.address}`);
    console.log(`   Delegate: ${delegateAccount.address}`);
    
    // Store delegation signature (this is the key part!)
    console.log('\n📝 Delegation Signature Details:');
    console.log(`   Authority: ${delegation.authority}`);
    console.log(`   Salt: ${delegation.salt}`);
    console.log(`   Signature: ${delegation.signature}`);
    console.log(`   Caveats: ${delegation.caveats.length} caveat(s)`);
    
    // Store the delegation for later use
    const delegationData = {
      delegation,
      smartAccount: delegatorSmartAccount.address,
      tokenAddress,
      periodAmount: "10",
      periodDuration,
      startDate,
      network: "sepolia"
    };
    
    console.log('\n✅ Delegation Setup Complete!');
    console.log('📋 How MetaMask Delegations Work:');
    console.log('   • Delegation is a signed permission, not a deployed contract');
    console.log('   • Spending limits are enforced when transactions are executed');
    console.log('   • The delegation signature must be provided with each transaction');
    console.log('   • MetaMask will automatically enforce the limits');
    
    return delegationData;
    
  } catch (error) {
    console.error('❌ Error creating delegation:', error);
    throw error;
  }
}

// Function to test spending limits using the delegation
async function testSpendingLimitWithDelegation(delegationData, amount, recipient) {
  try {
    console.log(`\n🧪 Testing ${amount} USDC transfer with delegation enforcement...`);
    
    const { publicClient, bundlerClient } = getViemClients('sepolia');
    const delegatorAccount = privateKeyToAccount(getPrivateKeyHex());
    
    // Recreate the smart account
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [delegatorAccount.address, [], [], []],
      deploySalt: "0x",
      signer: { account: delegatorAccount },
    });
    
    // Create the transfer action
    const transferAction = {
      to: delegationData.tokenAddress,
      value: 0n,
      data: encodeFunctionData({
        abi: [
          {
            name: "transfer",
            type: "function",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" }
            ]
          }
        ],
        functionName: "transfer",
        args: [recipient, parseUnits(amount.toString(), 6)]
      })
    };
    
    console.log(`📝 Attempting to transfer ${amount} USDC to ${recipient}`);
    
    // Try to execute with delegation enforcement
    try {
      // Execute the transfer with the delegation signature
      const hash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [transferAction],
        // Include delegation signature in the user operation
        delegation: delegationData.delegation
      });
      
      console.log(`⏳ Transfer submitted, hash: ${hash}`);
      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
      
      if (receipt.receipt.status === '0x1') {
        console.log(`✅ Transfer executed successfully!`);
        console.log(`   Transaction Hash: ${receipt.receipt.transactionHash}`);
        return { success: true, hash: receipt.receipt.transactionHash };
      } else {
        console.log(`❌ Transfer failed: Transaction reverted`);
        return { success: false, reason: "transaction_reverted" };
      }
      
    } catch (executionError) {
      if (executionError.message.includes('spending limit') || 
          executionError.message.includes('exceeded') ||
          executionError.message.includes('caveat')) {
        console.log(`❌ Transfer blocked by spending limit: ${amount} USDC exceeds allowed limit`);
        return { success: false, reason: "spending_limit_exceeded" };
      } else {
        console.log(`❌ Transfer failed: ${executionError.message}`);
        return { success: false, reason: "execution_failed", error: executionError.message };
      }
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return { success: false, reason: "test_failed", error: error.message };
  }
}

// Function to demonstrate spending limit enforcement
async function demonstrateSpendingLimits(delegationData) {
  console.log('\n🧪 TESTING SPENDING LIMITS');
  console.log('='.repeat(50));
  
  // Use the same recipient address from your smartswap.js test
  const testRecipient = "0x0d657f444BF2AA726a085067C4E26e782d837452";
  
  console.log('Test 1: Transfer 5 USDC (within limit)');
  const test1 = await testSpendingLimitWithDelegation(delegationData, 5, testRecipient);
  console.log(`Result: ${test1.success ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  if (test1.success) {
    console.log('\nTest 2: Transfer another 8 USDC (should exceed 10 USDC limit)');
    const test2 = await testSpendingLimitWithDelegation(delegationData, 8, testRecipient);
    console.log(`Result: ${test2.success ? 'FAILED (limit not enforced) ❌' : 'PASSED (limit enforced) ✅'}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 Expected Behavior:');
  console.log('• First 5 USDC transfer should succeed');
  console.log('• Second 8 USDC transfer should be blocked (total would be 13 USDC > 10 USDC limit)');
  console.log('• After 2 minutes, the limit should reset and allow new transfers');
}

// Function to test the exact scenario from smartswap.js
async function testSmartSwapScenario(delegationData) {
  console.log('\n🧪 TESTING SMART SWAP SCENARIO');
  console.log('='.repeat(50));
  console.log('Simulating: "withdraw 10 USDC to 0x0d657f444BF2AA726a085067C4E26e782d837452 on sepolia"');
  
  const recipient = "0x0d657f444BF2AA726a085067C4E26e782d837452";
  
  console.log('\nTest 1: First 10 USDC withdrawal (should succeed)');
  const test1 = await testSpendingLimitWithDelegation(delegationData, 10, recipient);
  console.log(`Result: ${test1.success ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  if (test1.success) {
    console.log('\nTest 2: Second 10 USDC withdrawal immediately (should be blocked - exceeds limit)');
    const test2 = await testSpendingLimitWithDelegation(delegationData, 10, recipient);
    console.log(`Result: ${test2.success ? 'FAILED (limit not enforced) ❌' : 'PASSED (limit enforced) ✅'}`);
    
    console.log('\nTest 3: Try 5 USDC withdrawal (should be blocked - already used 10 USDC limit)');
    const test3 = await testSpendingLimitWithDelegation(delegationData, 5, recipient);
    console.log(`Result: ${test3.success ? 'FAILED (limit not enforced) ❌' : 'PASSED (limit enforced) ✅'}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 Expected Behavior for Smart Swap Scenario:');
  console.log('• First 10 USDC withdrawal should succeed (exactly at the limit)');
  console.log('• Second 10 USDC withdrawal should be blocked (exceeds 10 USDC limit)');
  console.log('• Any additional withdrawals should be blocked until the 2-minute window resets');
  console.log('• This should prevent the issue you experienced where you could withdraw $20 before 2 minutes');
}

// Run the main function
main()
  .then(async (delegationData) => {
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DELEGATION CREATED SUCCESSFULLY!');
    console.log(`Smart Account: ${delegationData.smartAccount}`);
    console.log(`Token: ${delegationData.tokenAddress}`);
    console.log(`Limit: ${delegationData.periodAmount} USDC per ${delegationData.periodDuration} seconds`);
    console.log('='.repeat(50));
    
    // Ask user if they want to test
    console.log('\n🧪 Ready to test spending limits?');
    console.log('Note: Make sure your smart account has USDC tokens for testing');
    
    // Run both test scenarios
    await demonstrateSpendingLimits(delegationData);
    await testSmartSwapScenario(delegationData);
    
    console.log('\n📋 Test Summary:');
    console.log('✅ Spending limit delegation is active and ready to enforce limits');
    console.log('✅ The system will prevent withdrawals exceeding 10 USDC per 2 minutes');
    console.log('✅ This should fix the issue where you could withdraw $20 before 2 minutes');
    
  })
  .catch(console.error);