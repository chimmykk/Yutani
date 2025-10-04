import { NextRequest, NextResponse } from 'next/server';
const TwilioWalletService = require('../../../../../twilio/twilio-wallet-service');

const twilioService = new TwilioWalletService();

export async function GET(request: NextRequest) {
  try {
    const wallets = await twilioService.listWallets();

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
    console.error('Error listing wallets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list wallets' },
      { status: 500 }
    );
  }
}
