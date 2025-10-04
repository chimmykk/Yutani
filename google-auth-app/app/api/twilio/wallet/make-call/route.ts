import { NextRequest, NextResponse } from 'next/server';
const TwilioWalletService = require('../../../../../twilio/twilio-wallet-service');

const twilioService = new TwilioWalletService();

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

    const result = await twilioService.loadAndCallWallet(phoneNumber, filename, passphrase);

    return NextResponse.json({
      success: true,
      message: 'Wallet loaded and delivered via call',
      data: {
        wallet: {
          address: result.wallet.address,
          createdAt: result.wallet.createdAt
        },
        call: {
          callSid: result.call.callSid,
          status: result.call.status
        }
      }
    });

  } catch (error) {
    console.error('Error loading wallet and making call:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load wallet and make call' },
      { status: 500 }
    );
  }
}
