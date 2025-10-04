import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { encryptedData, passphrase } = await request.json()
    
    if (!encryptedData || !passphrase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Import decryption function
    const { decryptWalletCredentials } = await import('@/lib/server-crypto')
    
    // Decrypt the credentials
    const decrypted = await decryptWalletCredentials(encryptedData, passphrase)
    
    return NextResponse.json({ 
      success: true, 
      wallet: decrypted
    })
    
  } catch (error) {
    console.error('Error decrypting wallet:', error)
    return NextResponse.json(
      { error: 'Failed to decrypt wallet - wrong passphrase or corrupted data' },
      { status: 500 }
    )
  }
}
