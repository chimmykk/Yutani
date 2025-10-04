import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { credentials, passphrase, filename } = await request.json()
    
    if (!credentials || !passphrase || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Import encryption function
    const { encryptWalletCredentials } = await import('@/lib/server-crypto')
    
    // Encrypt the credentials
    const encrypted = await encryptWalletCredentials(credentials, passphrase)
    
    // Ensure credentials directory exists
    const credentialsDir = path.join(process.cwd(), 'credentials')
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir, { recursive: true })
    }
    
    // Save encrypted data to file
    const filePath = path.join(credentialsDir, `${filename}.json`)
    fs.writeFileSync(filePath, JSON.stringify(encrypted, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Wallet saved successfully',
      filePath: filePath
    })
    
  } catch (error) {
    console.error('Error saving wallet:', error)
    return NextResponse.json(
      { error: 'Failed to save wallet' },
      { status: 500 }
    )
  }
}
