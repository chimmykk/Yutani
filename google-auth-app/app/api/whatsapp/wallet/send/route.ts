import { NextRequest, NextResponse } from 'next/server';
const WhatsAppWalletService = require('../../../../../whatsapp/whatsapp-wallet-service');

// Global WhatsApp service instance
let whatsappService: any = null;

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, filename, passphrase } = await request.json();

    if (!phoneNumber || !filename || !passphrase) {
      return NextResponse.json(
        { error: 'Phone number, filename, and passphrase are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use international format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    if (!whatsappService) {
      whatsappService = new WhatsAppWalletService();
    }

    // Initialize the client if not already done
    await whatsappService.initialize();

    const result = await whatsappService.loadAndSendWallet(phoneNumber, filename, passphrase);

    return NextResponse.json({
      success: true,
      message: 'Wallet loaded and sent via WhatsApp',
      data: {
        wallet: {
          address: result.wallet.address,
          createdAt: result.wallet.createdAt
        },
        message: {
          messageId: result.message.messageId,
          timestamp: result.message.timestamp,
          status: result.message.status
        }
      }
    });

  } catch (error) {
    console.error('Error loading wallet and sending via WhatsApp:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load wallet and send via WhatsApp' },
      { status: 500 }
    );
  }
}
