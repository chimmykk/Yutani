const { ethers } = require('ethers');

const infuraUrl = "https://bsc-testnet-rpc.publicnode.com";
const provider = new ethers.JsonRpcProvider(infuraUrl);

const sendtxnevm = async (tx, privateKey) => {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const txResponse = await wallet.sendTransaction(tx);
        console.log("Transaction hash:", txResponse.hash);
        console.log("Full transaction response:", txResponse); // Optional
    } catch (error) {
        console.error("Error sending transaction:", error);
    }
};

async function main() {
    // Replace these with your actual transaction data and private key
    const privateKey = ""; // Must start with 0x
    const tx = {
        to: "0x4e79442b5667c8dfC097c698da93e905A3A0d83E",
        value: ethers.parseEther("0.0001"), // Sending 0.01 BNB

    };

    await sendtxnevm(tx, privateKey);
}

main();
