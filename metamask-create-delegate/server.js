import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { interpretSwapInstruction } from './gemini-swap.js';
import { executeSwap } from './swap-functions.js';
import { createSmartAccount } from './smart-account.js';
import { createDelegation } from './delegation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/create-smart-account', async (req, res) => {
  try {
    const { ownerAddress } = req.body;
    const smartAccountAddress = await createSmartAccount(ownerAddress);
    res.json({ success: true, smartAccountAddress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/create-delegation', async (req, res) => {
  try {
    const { smartAccountAddress, agentAddress, permissions } = req.body;
    const delegation = await createDelegation(smartAccountAddress, agentAddress, permissions);
    res.json({ success: true, ...delegation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/swap', async (req, res) => {
  try {
    const { instruction } = req.body;
    const parsedInstruction = await interpretSwapInstruction(instruction);
    const result = await executeSwap(parsedInstruction);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
