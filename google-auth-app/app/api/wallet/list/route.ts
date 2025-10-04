import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const credentialsDir = path.join(process.cwd(), 'credentials')
    
    if (!fs.existsSync(credentialsDir)) {
      return NextResponse.json({ wallets: [] })
    }
    
    const files = fs.readdirSync(credentialsDir)
    const walletFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => ({
        filename: file.replace('.json', ''),
        createdAt: fs.statSync(path.join(credentialsDir, file)).birthtime
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({ wallets: walletFiles })
    
  } catch (error) {
    console.error('Error listing wallets:', error)
    return NextResponse.json(
      { error: 'Failed to list wallets' },
      { status: 500 }
    )
  }
}
