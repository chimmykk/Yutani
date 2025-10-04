const { config: dotenv } = require("dotenv");
const {
  createWalletClient,
  http,
  getContract,
  erc20Abi,
  parseUnits,
  maxUint256,
  publicActions,
} = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const {  base  } = require("viem/chains");
const { wethAbi } = require("./abi/weth-abi");


// load env vars
dotenv();
const { PRIVATE_KEY, ZERO_EX_API_KEY, ALCHEMY_HTTP_TRANSPORT_URL } =
  process.env;

// validate requirements
if (!PRIVATE_KEY) throw new Error("missing PRIVATE_KEY.");
if (!ZERO_EX_API_KEY) throw new Error("missing ZERO_EX_API_KEY.");
if (!ALCHEMY_HTTP_TRANSPORT_URL)
  throw new Error("missing ALCHEMY_HTTP_TRANSPORT_URL.");

// fetch headers
const headers = new Headers({
  "Content-Type": "application/json",
  "0x-api-key": ZERO_EX_API_KEY,
  "0x-version": "v2",
});

// setup wallet client
const client = createWalletClient({
  account: privateKeyToAccount("0x" + PRIVATE_KEY),
  chain: base ,
  transport: http(ALCHEMY_HTTP_TRANSPORT_URL),
}).extend(publicActions); // extend wallet client with publicActions for public client

const main = async () => {
  const [address] = await client.getAddresses();

  // set up contracts
  const usdc = getContract({
    address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // USDC on Base
    abi: erc20Abi,
    client,
  });
  const weth = getContract({
    address: "0x4200000000000000000000000000000000000006",
    abi: wethAbi,
    client,
  });
  // specify sell amount
  const sellAmount = parseUnits("0.1", 6); // USDC has 6 decimals

  // 1. fetch price
  const priceParams = new URLSearchParams({
    chainId: client.chain.id.toString(),
    sellToken: usdc.address,
    buyToken: weth.address,
    sellAmount: sellAmount.toString(),
  });

  const priceResponse = await fetch(
    "https://api.0x.org/swap/allowance-holder/price?" + priceParams.toString(),
    {
      headers,
    }
  );

  const price = await priceResponse.json();
  console.log("Fetching price to swap 0.1 USDC for WETH");
  console.log(
    `https://api.0x.org/swap/allowance-holder/price?${priceParams.toString()}`
  );
  console.log("priceResponse: ", price);

  // Check if the API returned an error
  if (price.name === 'INPUT_INVALID') {
    console.log("Error: 0x API returned INPUT_INVALID. This might be because:");
    console.log("1. Base Sepolia testnet is not supported by 0x API");
    console.log("2. The token addresses are incorrect for Base Sepolia");
    console.log("3. There's insufficient liquidity for this token pair");
    return;
  }

  // Check if there's no liquidity available
  if (price.liquidityAvailable === false) {
    console.log("Error: No liquidity available for this token pair. Cannot proceed with swap.");
    return;
  }

  // 2. check if taker needs to set an allowance for AllowanceHolder
  if (price.issues && price.issues.allowance !== null) {
    try {
      const { request } = await usdc.simulate.approve([
        price.issues.allowance.spender,
        maxUint256,
      ]);
      console.log("Approving AllowanceHolder to spend USDC...", request);
      // set approval
      const hash = await usdc.write.approve(request.args);
      console.log(
        "Approved AllowanceHolder to spend USDC.",
        await client.waitForTransactionReceipt({ hash })
      );
    } catch (error) {
      console.log("Error approving AllowanceHolder:", error);
    }
  } else {
    console.log("USDC already approved for AllowanceHolder");
  }

  // 3. fetch quote
  const quoteParams = new URLSearchParams();

  quoteParams.append("taker", client.account.address);

  for (const [key, value] of priceParams.entries()) {
    quoteParams.append(key, value);
  }

  const quoteResponse = await fetch(
    "https://api.0x.org/swap/allowance-holder/quote?" + quoteParams.toString(),
    {
      headers,
    }
  );

  const quote = await quoteResponse.json();
  console.log("Fetching quote to swap 0.1 USDC for WETH");
  console.log("quoteResponse: ", quote);

  // Check if the quote API returned an error
  if (quote.name === 'INPUT_INVALID') {
    console.log("Error: Quote API returned INPUT_INVALID. Cannot proceed with transaction.");
    return;
  }

  // Check if there's no liquidity available
  if (quote.liquidityAvailable === false) {
    console.log("Error: No liquidity available for this token pair. Cannot proceed with transaction.");
    return;
  }

  // Check if transaction data is available
  if (!quote.transaction) {
    console.log("Error: No transaction data available. Cannot proceed with transaction.");
    return;
  }

  // 4. send txn
  const hash = await client.sendTransaction({
    to: quote.transaction.to,
    data: quote.transaction.data,
    value: quote.transaction.value
      ? BigInt(quote.transaction.value)
      : undefined, // value is used for native tokens
  });

  console.log("Tx hash: ", hash);
  console.log(`See tx details at https://basescan.org/tx/${hash}`);
};

main();