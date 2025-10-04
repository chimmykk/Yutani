const { Web3 } = require('web3');
// BSC Testnet ERC-20 Transfer Example
// for evm based token transfer
const ABI = [
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
];

async function transferevmtoken(privateKey, contractAddress, toAddress, value) {
  try {
    const web3 = new Web3('https://bsc-testnet-rpc.publicnode.com');

    if (privateKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(privateKey)) {
      throw new Error('Invalid private key format.');
    }

    const wallet = web3.eth.accounts.wallet.add(`0x${privateKey}`);
    const myERC20 = new web3.eth.Contract(ABI, contractAddress);

    const txReceipt = await myERC20.methods.transfer(toAddress, value).send({
      from: wallet[0].address,
      type: 2, // EIP-1559 transaction
    });

    console.log('Transaction successful. Hash:', txReceipt.transactionHash);
  } catch (error) {
    console.error('Error during transfer:', error.message);
  }
}

// 🟡 Replace these with your actual values or get from CLI input/env vars
async function main() {
  const privateKey = ''; // 64 hex chars
  const contractAddress = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';
  const toAddress = '0x4e79442b5667c8dfC097c698da93e905A3A0d83E';
  const value = '1000000000000000000'; // amount in wei (e.g., 1 token with 18 decimals)

  await transferevmtoken(privateKey, contractAddress, toAddress, value);
}

main();
