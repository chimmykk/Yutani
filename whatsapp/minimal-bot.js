console.log('🚀 Starting Minimal WhatsApp Bot...');

try {
  const { Client, LocalAuth } = require("whatsapp-web.js");
  
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
  });

  client.on('message', async (message) => {
    console.log('📨 Message received:', message.body);
    
    // Process ALL messages (including from yourself)
    if (message.body && !message.isGroupMsg) {
      console.log(`📨 Processing: "${message.body}"`);
      
      try {
        await client.sendMessage(message.from, `🤖 Bot received: "${message.body}"`);
        console.log('✅ Response sent');
      } catch (error) {
        console.error('❌ Error sending response:', error);
      }
    }
  });

  console.log('🔌 Initializing WhatsApp client...');
  client.initialize().catch(console.error);

} catch (error) {
  console.error('❌ Error starting bot:', error);
}

