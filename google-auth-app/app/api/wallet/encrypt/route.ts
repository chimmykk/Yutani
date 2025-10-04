import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { credentials, passphrase } = await request.json()
    
    if (!credentials || !passphrase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Import encryption function
    const { encryptWalletCredentials } = await import('@/lib/server-crypto')
    
    // Encrypt the credentials
    const encrypted = await encryptWalletCredentials(credentials, passphrase)
    
    return NextResponse.json({ 
      success: true, 
      encrypted
    })
    
  } catch (error) {
    console.error('Error encrypting wallet:', error)
    return NextResponse.json(
      { error: 'Failed to encrypt wallet' },
      { status: 500 }
    )
  }
}
