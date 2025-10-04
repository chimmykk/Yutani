import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = process.env.GOOGLE_API_KEY
  ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  : null;

function cleanJSON(str) {
  return str.replace(/```json|```/g, '').trim();
}

export async function interpretSwapInstruction(instruction) {
  const prompt = `
 You are a swap instruction parser for cryptocurrency trading.
 The user will give a swap instruction in natural language.
 Return ONLY valid JSON with the structure:
 {
   "operation": "swap",
   "tokenIn": "TOKEN_SYMBOL",
   "tokenOut": "TOKEN_SYMBOL",
   "amount": "NUMBER",
   "network": "NETWORK_NAME"
 }
 Supported tokens: ETH, WETH, USDC, USDT, DAI
 Supported networks: sepolia, mainnet, polygon, arbitrum
 Default network if not specified: sepolia
 Default amount if not specified clearly: "0.001"
 Examples:
 - "swap 0.5 ETH for USDC" => {"operation":"swap","tokenIn":"ETH","tokenOut":"USDC","amount":"0.5","network":"sepolia"}
 - "exchange 100 USDC to ETH on mainnet" => {"operation":"swap","tokenIn":"USDC","tokenOut":"ETH","amount":"100","network":"mainnet"}
 - "convert 0.001 ETH to USDC" => {"operation":"swap","tokenIn":"ETH","tokenOut":"USDC","amount":"0.001","network":"sepolia"}
 Do not include code fences or extra text.
 Instruction: ${instruction}
 `;
  try {
    if (!model) throw new Error('AI model not configured');
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = cleanJSON(raw);
    return JSON.parse(cleaned);
  } catch (err) {
    // Fallback: simple deterministic parser
    return localParse(instruction);
  }
}

function localParse(instruction) {
  const text = String(instruction || '').toLowerCase();
  const tokenSymbols = ['eth', 'weth', 'usdc', 'usdt', 'dai'];

  const amountMatch = text.match(/([0-9]+(?:\.[0-9]+)?)/);
  const amount = amountMatch ? amountMatch[1] : '0.001';

  // infer tokenIn and tokenOut from phrases like "x for y" or order in text
  let tokenIn = 'ETH';
  let tokenOut = 'USDC';
  const tokensFound = tokenSymbols.filter((t) => text.includes(t));
  if (tokensFound.length >= 2) {
    // choose first and second occurrence
    tokenIn = tokensFound[0].toUpperCase();
    tokenOut = tokensFound[1].toUpperCase();
  } else if (tokensFound.length === 1) {
    const only = tokensFound[0].toUpperCase();
    if (only === 'ETH') {
      tokenIn = 'ETH'; tokenOut = 'USDC';
    } else {
      tokenIn = only; tokenOut = 'ETH';
    }
  }

  // infer network
  let network = 'sepolia';
  if (text.includes('mainnet')) network = 'mainnet';
  else if (text.includes('sepolia')) network = 'sepolia';
  else if (text.includes('polygon')) network = 'polygon';
  else if (text.includes('arbitrum')) network = 'arbitrum';

  return {
    operation: 'swap',
    tokenIn,
    tokenOut,
    amount,
    network,
  };
}
