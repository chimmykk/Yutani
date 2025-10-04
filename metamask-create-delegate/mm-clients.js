import 'dotenv/config';
import { http, createPublicClient } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { sepolia, mainnet } from 'viem/chains';

function resolveChain(network) {
  switch ((network || 'sepolia').toLowerCase()) {
    case 'mainnet':
      return mainnet;
    case 'sepolia':
    default:
      return sepolia;
  }
}

function resolveBundlerUrl(network) {
  const net = (network || 'sepolia').toLowerCase();
  if (net === 'mainnet') {
    return process.env.BUNDLER_RPC_URL_MAINNET || process.env.BUNDLER_RPC_URL;
  }
  // Public Pimlico endpoint as safe default for demos; consider configuring your own in production
  return process.env.BUNDLER_RPC_URL_SEPOLIA || process.env.BUNDLER_RPC_URL || 'https://api.pimlico.io/v2/11155111/rpc?apikey=pim_DgBeb1uoMpzzV4RG1Kxy6E';
}

export function getViemClients(network) {
  const chain = resolveChain(network);

  const rpcUrlEnv = chain.id === 1
    ? (process.env.MAINNET_RPC_URL || undefined)
    : (process.env.SEPOLIA_RPC_URL || undefined);

  const transport = rpcUrlEnv ? http(rpcUrlEnv) : http();

  const publicClient = createPublicClient({
    chain,
    transport,
  });

  const bundlerUrl = resolveBundlerUrl(network);
  const bundlerClient = bundlerUrl
    ? createBundlerClient({ client: publicClient, transport: http(bundlerUrl), paymaster: true })
    : undefined;

  return { publicClient, bundlerClient, chain };
}


