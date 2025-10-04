import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { filename, passphrase } = await request.json()
    
    if (!filename || !passphrase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Import decryption function
    const { decryptWalletCredentials } = await import('@/lib/server-crypto')
    
    // Read encrypted data from file
    const credentialsDir = path.join(process.cwd(), 'credentials')
    const filePath = path.join(credentialsDir, `${filename}.json`)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Wallet file not found' },
        { status: 404 }
      )
    }
    
    const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const decryptedWallet = await decryptWalletCredentials(encryptedData, passphrase)
    
    return NextResponse.json({ 
      success: true, 
      wallet: decryptedWallet
    })
    
  } catch (error) {
    console.error('Error loading wallet:', error)
    return NextResponse.json(
      { error: 'Failed to decrypt wallet - wrong passphrase or corrupted data' },
      { status: 500 }
    )
  }
}
