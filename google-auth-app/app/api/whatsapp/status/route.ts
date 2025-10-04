import { NextRequest, NextResponse } from 'next/server';
const WhatsAppWalletService = require('../../../../../whatsapp/whatsapp-wallet-service');

// Global WhatsApp service instance
let whatsappService: any = null;

export async function GET(request: NextRequest) {
  try {
    if (!whatsappService) {
      whatsappService = new WhatsAppWalletService();
    }

    const status = whatsappService.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        isReady: status.isReady,
        hasQRCode: status.hasQRCode,
        needsAuthentication: !status.isReady && !status.hasQRCode
      }
    });

  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get WhatsApp status' },
      { status: 500 }
    );
  }
}
