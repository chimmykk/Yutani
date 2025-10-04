import { privateKeyToAccount } from 'viem/accounts';
import { keccak256, stringToBytes } from 'viem';
import 'dotenv/config';
import { getViemClients } from './mm-clients.js';

// Create a function-call scoped delegation per docs. This returns a structured
// delegation scope that can be enforced by the toolkit during execution.
export async function createDelegation(smartAccountAddress, agentAddress, permissions, network = 'sepolia') {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  const { chain } = getViemClients(network);
  privateKeyToAccount((await import('./key-utils.js')).getPrivateKeyHex());

  // permissions.allowedContracts can be used to constrain allowed calls
  const allowedTargets = Array.isArray(permissions?.allowedContracts)
    ? permissions.allowedContracts
    : [];

  const scope = {
    type: 'functionCall',
    delegator: smartAccountAddress,
    delegate: agentAddress,
    chainId: Number(chain.id),
    target: allowedTargets.length ? allowedTargets[0] : null,
    allowAllFunctions: Boolean(permissions?.allowAllFunctions),
  };
  const delegationId = keccak256(stringToBytes(JSON.stringify(scope)));
  return { delegationId, scope };
}
