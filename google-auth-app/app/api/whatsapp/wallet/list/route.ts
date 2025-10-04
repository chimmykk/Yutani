import { NextRequest, NextResponse } from 'next/server';
const WhatsAppWalletService = require('../../../../../whatsapp/whatsapp-wallet-service');

// Global WhatsApp service instance
let whatsappService: any = null;

export async function GET(request: NextRequest) {
  try {
    if (!whatsappService) {
      whatsappService = new WhatsAppWalletService();
    }

    const wallets = await whatsappService.listWallets();

    return NextResponse.json({
      success: true,
      data: {
        wallets: wallets.map((wallet: any) => ({
          filename: wallet.filename,
          createdAt: wallet.createdAt,
          size: wallet.size
        }))
      }
    });

  } catch (error) {
    console.error('Error listing WhatsApp wallets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list wallets' },
      { status: 500 }
    );
  }
}
