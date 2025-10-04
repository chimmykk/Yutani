import { ethers } from 'ethers';
import 'dotenv/config';
import { getViemClients } from './mm-clients.js';
import { privateKeyToAccount } from 'viem/accounts';
import { encodeFunctionData, parseUnits } from 'viem';
import { Implementation, toMetaMaskSmartAccount } from '@metamask/delegation-toolkit';
import { getPrivateKeyHex } from './key-utils.js';

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

const ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)',
  'function multicall(bytes[] calldata data) payable returns (bytes[] memory)',
  'function refundETH() payable',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) payable'
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

export async function executeSwap({ tokenIn, tokenOut, amount, network = 'sepolia' }) {
  try {
    if (!NETWORKS[network]) {
      throw new Error(`Unsupported network: ${network}`);
    }
    if (!TOKENS[tokenIn] || !TOKENS[tokenOut]) {
      throw new Error(`Unsupported token: ${tokenIn} or ${tokenOut}`);
    }

    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    const { publicClient, bundlerClient, chain } = getViemClients(network);
    const account = privateKeyToAccount(getPrivateKeyHex());
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [account.address, [], [], []],
      deploySalt: '0x',
      signer: { account },
    });

    const networkConfig = NETWORKS[network];
    const tokenInAddress = getTokenAddress(tokenIn, network);
    const tokenOutAddress = getTokenAddress(tokenOut, network);

    const tokenInDecimals = TOKENS[tokenIn].decimals;
    const amountIn = parseUnits(amount.toString(), tokenInDecimals);

    // Prepare approve call for ERC20 inputs
    const calls = [];
    if (tokenIn !== 'ETH') {
      const approveData = encodeFunctionData({
        abi: ERC20_ABI_VIEM,
        functionName: 'approve',
        args: [networkConfig.contracts.swapRouter, amountIn],
      });
      calls.push({ to: tokenInAddress, data: approveData, value: 0n });
    }

    const exactInputData = encodeFunctionData({
      abi: ROUTER_ABI_VIEM,
      functionName: 'exactInputSingle',
      args: [{
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        fee: 3000,
        recipient: smartAccount.address,
        amountIn,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      }],
    });

    const swapCall = {
      to: networkConfig.contracts.swapRouter,
      data: exactInputData,
      value: tokenIn === 'ETH' ? amountIn : 0n,
    };
    calls.push(swapCall);

    // Fetch gas via bundler (Pimlico extension)
    let maxFeePerGas = 1n;
    let maxPriorityFeePerGas = 1n;
    if (bundlerClient) {
      try {
        const gasResult = await bundlerClient.request({ method: 'pimlico_getUserOperationGasPrice' });
        // Pimlico returns hex strings in wei: { standard: { maxFeePerGas, maxPriorityFeePerGas }, fast: {...} }
        const standard = gasResult?.standard || gasResult || {};
        if (standard.maxFeePerGas) maxFeePerGas = BigInt(standard.maxFeePerGas);
        if (standard.maxPriorityFeePerGas) maxPriorityFeePerGas = BigInt(standard.maxPriorityFeePerGas);
      } catch (e) {
        console.warn('Failed to fetch bundler gas price, using defaults:', e?.message || e);
      }
    }

    if (!bundlerClient) {
      // Fallback: execute via direct transaction using ethers
      console.warn('Bundler RPC URL missing. Falling back to direct transaction.');
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const walletEthers = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      await checkBalance(walletEthers, tokenIn, amountIn, network);

      const router = new ethers.Contract(
        networkConfig.contracts.swapRouter,
        ROUTER_ABI,
        walletEthers
      );

      const params = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        fee: 3000,
        recipient: walletEthers.address,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };

      const txOptions = {
        gasLimit: 300000n
      };

      if (tokenIn === 'ETH') {
        txOptions.value = amountIn;
      } else {
        await approveToken(walletEthers, tokenInAddress, networkConfig.contracts.swapRouter, amountIn);
      }

      const tx = await router.exactInputSingle(params, txOptions);
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error(`Transaction failed: ${tx.hash}`);
      }

      const amountOutDirect = await calculateReceivedAmount(
        walletEthers.address,
        tokenOut,
        network,
        receipt
      );

      return {
        success: true,
        txHash: tx.hash,
        amountOut: ethers.formatUnits(amountOutDirect, TOKENS[tokenOut].decimals),
        gasUsed: receipt.gasUsed?.toString?.() ?? String(receipt.gasUsed),
        blockNumber: receipt.blockNumber
      };
    }

    try {
      const userOperationHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });

      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOperationHash });

      const amountOut = await calculateReceivedAmountViem(
        publicClient,
        smartAccount.address,
        tokenOut,
        network
      );

      return {
        success: true,
        txHash: receipt.receipt?.transactionHash || userOperationHash,
        amountOut: ethers.formatUnits(amountOut, TOKENS[tokenOut].decimals),
        gasUsed: receipt.receipt?.gasUsed ? String(receipt.receipt.gasUsed) : '0',
        blockNumber: receipt.receipt?.blockNumber ? Number(receipt.receipt.blockNumber) : undefined,
      };
    } catch (bundlerError) {
      console.warn('Bundler path failed, falling back to direct transaction. Reason:', bundlerError?.message || bundlerError);
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const walletEthers = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      await checkBalance(walletEthers, tokenIn, amountIn, network);

      const router = new ethers.Contract(
        networkConfig.contracts.swapRouter,
        ROUTER_ABI,
        walletEthers
      );

      const params = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        fee: 3000,
        recipient: walletEthers.address,
        amountIn: amountIn,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };

      const txOptions = {
        gasLimit: 300000n
      };

      if (tokenIn === 'ETH') {
        txOptions.value = amountIn;
      } else {
        await approveToken(walletEthers, tokenInAddress, networkConfig.contracts.swapRouter, amountIn);
      }

      const tx = await router.exactInputSingle(params, txOptions);
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error(`Transaction failed: ${tx.hash}`);
      }

      const amountOutDirect = await calculateReceivedAmount(
        walletEthers.address,
        tokenOut,
        network,
        receipt
      );

      return {
        success: true,
        txHash: tx.hash,
        amountOut: ethers.formatUnits(amountOutDirect, TOKENS[tokenOut].decimals),
        gasUsed: receipt.gasUsed?.toString?.() ?? String(receipt.gasUsed),
        blockNumber: receipt.blockNumber
      };
    }
  } catch (error) {
    console.error('❌ Swap execution failed:', error.message);
    throw error;
  }
}

function getTokenAddress(token, network) {
  const networkConfig = NETWORKS[network];
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

async function checkBalance(wallet, token, requiredAmount, network) {
  if (token === 'ETH') {
    const balance = await wallet.provider.getBalance(wallet.address);
    if (balance < requiredAmount) {
      throw new Error('Insufficient ETH balance');
    }
  } else {
    const tokenAddress = getTokenAddress(token, network);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet.provider);
    const balance = await tokenContract.balanceOf(wallet.address);
    if (balance < requiredAmount) {
      throw new Error(`Insufficient ${token} balance`);
    }
  }
}

async function approveToken(wallet, tokenAddress, spenderAddress, amount) {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const approveTx = await tokenContract.approve(spenderAddress, amount);
  await approveTx.wait();
}

async function calculateReceivedAmount(walletAddress, tokenOut, network, receipt) {
  if (tokenOut === 'ETH') {
    const provider = new ethers.JsonRpcProvider(NETWORKS[network].rpcUrl);
    return await provider.getBalance(walletAddress);
  } else {
    const tokenAddress = getTokenAddress(tokenOut, network);
    const provider = new ethers.JsonRpcProvider(NETWORKS[network].rpcUrl);
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return await tokenContract.balanceOf(walletAddress);
  }
}

// viem-compatible minimal ABIs
const ROUTER_ABI_VIEM = [
  {
    type: 'function',
    name: 'exactInputSingle',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
];

const ERC20_ABI_VIEM = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
];

async function calculateReceivedAmountViem(publicClient, walletAddress, tokenOut, network) {
  if (tokenOut === 'ETH') {
    return await publicClient.getBalance({ address: walletAddress });
  } else {
    const tokenAddress = getTokenAddress(tokenOut, network);
    const data = encodeFunctionData({
      abi: ERC20_ABI_VIEM,
      functionName: 'balanceOf',
      args: [walletAddress],
    });
    const result = await publicClient.call({ to: tokenAddress, data });
    // result.data is 0x...; viem call returns { data }
    return result.data ? BigInt(result.data) : 0n;
  }
}

// Withdraw/transfer ETH or ERC20 from the smart account to any address
export async function withdrawToken({ token, amount, to, network = 'sepolia' }) {
  try {
    if (!NETWORKS[network]) {
      throw new Error(`Unsupported network: ${network}`);
    }
    if (token !== 'ETH' && !TOKENS[token]) {
      throw new Error(`Unsupported token: ${token}`);
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    const account = privateKeyToAccount(getPrivateKeyHex());
    const smartAccountAddress = account.address;

    const { publicClient, bundlerClient } = getViemClients(network);
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [account.address, [], [], []],
      deploySalt: '0x',
      signer: { account },
    });

    const calls = [];
    if (token === 'ETH') {
      const wei = parseUnits(amount.toString(), 18);
      calls.push({ to, data: '0x', value: wei });
    } else {
      const tokenAddress = getTokenAddress(token, network);
      const tokenDecimals = TOKENS[token].decimals;
      const amt = parseUnits(amount.toString(), tokenDecimals);
      const data = encodeFunctionData({
        abi: ERC20_ABI_VIEM,
        functionName: 'transfer',
        args: [to, amt],
      });
      calls.push({ to: tokenAddress, data, value: 0n });
    }

    // Dynamic gas from bundler
    let maxFeePerGas = 1n;
    let maxPriorityFeePerGas = 1n;
    if (bundlerClient) {
      try {
        const gasResult = await bundlerClient.request({ method: 'pimlico_getUserOperationGasPrice' });
        const standard = gasResult?.standard || gasResult || {};
        if (standard.maxFeePerGas) maxFeePerGas = BigInt(standard.maxFeePerGas);
        if (standard.maxPriorityFeePerGas) maxPriorityFeePerGas = BigInt(standard.maxPriorityFeePerGas);
      } catch (e) {
        console.warn('Failed to fetch bundler gas price, using defaults:', e?.message || e);
      }
    }

    if (!bundlerClient) {
      // Fallback to direct transaction via ethers
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      if (token === 'ETH') {
        const wei = ethers.parseUnits(amount.toString(), 18);
        const tx = await wallet.sendTransaction({ to, value: wei });
        const receipt = await tx.wait();
        if (receipt.status === 0) throw new Error(`Transaction failed: ${tx.hash}`);
        return { success: true, txHash: tx.hash, gasUsed: String(receipt.gasUsed), blockNumber: receipt.blockNumber };
      }

      const tokenAddress = getTokenAddress(token, network);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
      const amt = ethers.parseUnits(amount.toString(), TOKENS[token].decimals);
      const tx = await tokenContract.transfer(to, amt);
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error(`Transaction failed: ${tx.hash}`);
      return { success: true, txHash: tx.hash, gasUsed: String(receipt.gasUsed), blockNumber: receipt.blockNumber };
    }

    // Try user operation via bundler
    try {
      const userOperationHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
      const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOperationHash });
      
      return {
        success: true,
        txHash: receipt.receipt?.transactionHash || userOperationHash,
        gasUsed: receipt.receipt?.gasUsed ? String(receipt.receipt.gasUsed) : '0',
        blockNumber: receipt.receipt?.blockNumber ? Number(receipt.receipt.blockNumber) : undefined,
      };
    } catch (bundlerError) {
      console.warn('Bundler withdraw failed, falling back to direct transaction. Reason:', bundlerError?.message || bundlerError);
      const networkConfig = NETWORKS[network];
      const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      if (token === 'ETH') {
        const wei = ethers.parseUnits(amount.toString(), 18);
        const tx = await wallet.sendTransaction({ to, value: wei });
        const receipt = await tx.wait();
        if (receipt.status === 0) throw new Error(`Transaction failed: ${tx.hash}`);
        return { success: true, txHash: tx.hash, gasUsed: String(receipt.gasUsed), blockNumber: receipt.blockNumber };
      }

      const tokenAddress = getTokenAddress(token, network);
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
      const amt = ethers.parseUnits(amount.toString(), TOKENS[token].decimals);
      const tx = await tokenContract.transfer(to, amt);
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error(`Transaction failed: ${tx.hash}`);
      
      return { success: true, txHash: tx.hash, gasUsed: String(receipt.gasUsed), blockNumber: receipt.blockNumber };
    }
  } catch (error) {
    console.error('❌ Withdraw failed:', error.message);
    throw error;
  }
}
