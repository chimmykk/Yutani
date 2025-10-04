import { NextRequest, NextResponse } from 'next/server';
const WhatsAppWalletService = require('../../../../../whatsapp/whatsapp-wallet-service');

// Global WhatsApp service instance
let whatsappService: any = null;

export async function GET(request: NextRequest) {
  try {
    if (!whatsappService) {
      whatsappService = new WhatsAppWalletService();
    }

    // Initialize the client if not already done
    await whatsappService.initialize();
    
    const qrCode = await whatsappService.getQRCode();
    
    return NextResponse.json({
      success: true,
      data: {
        qrCode: qrCode
      }
    });

  } catch (error) {
    console.error('Error getting WhatsApp QR code:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get WhatsApp QR code' },
      { status: 500 }
    );
  }
}
