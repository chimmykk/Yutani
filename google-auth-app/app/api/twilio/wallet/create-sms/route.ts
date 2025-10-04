import { NextRequest, NextResponse } from 'next/server';
const TwilioWalletService = require('../../../../../twilio/twilio-wallet-service');

const twilioService = new TwilioWalletService();

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, passphrase } = await request.json();

    if (!phoneNumber || !passphrase) {
      return NextResponse.json(
        { error: 'Phone number and passphrase are required' },
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

    const result = await twilioService.createAndSendWalletSMS(phoneNumber, passphrase);

    return NextResponse.json({
      success: true,
      message: 'Wallet created and sent via SMS',
      data: {
        wallet: {
          address: result.wallet.address,
          createdAt: result.wallet.createdAt
        },
        filename: result.filename,
        sms: {
          messageSid: result.sms.messageSid,
          status: result.sms.status
        }
      }
    });

  } catch (error) {
    console.error('Error creating wallet and sending SMS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create wallet and send SMS' },
      { status: 500 }
    );
  }
}
