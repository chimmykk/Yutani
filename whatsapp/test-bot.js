const { Client, LocalAuth } = require("whatsapp-web.js");

console.log('🚀 Starting Test WhatsApp Bot...');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('📱 QR Code received!');
  console.log('Scan this QR code with your WhatsApp app');
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  console.log('📋 Bot is now listening for messages...');
  console.log('💡 Send any message to test the bot!');
});

client.on('message', async (message) => {
  console.log('📨 Message received:', message.body);
  console.log('📨 From:', message.from);
  console.log('📨 Is from me:', message.fromMe);
  
  // Process ALL messages (including from yourself)
  if (message.body) {
    console.log(`📨 Processing: "${message.body}"`);
    
    // Simple echo response
    await client.sendMessage(message.from, `🤖 Bot received: "${message.body}"`);
    console.log('✅ Response sent');
  }
});

console.log('🔌 Initializing...');
client.initialize();

