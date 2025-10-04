import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json()
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Missing filename' },
        { status: 400 }
      )
    }

    const credentialsDir = path.join(process.cwd(), 'credentials')
    const filePath = path.join(credentialsDir, `${filename}.json`)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Wallet file not found' },
        { status: 404 }
      )
    }
    
    fs.unlinkSync(filePath)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Wallet deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting wallet:', error)
    return NextResponse.json(
      { error: 'Failed to delete wallet' },
      { status: 500 }
    )
  }
}
