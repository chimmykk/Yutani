"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createEvmWallet, createWalletFromMnemonic, createWalletFromPrivateKey } from "@/lib/wallet-utils"
import { Wallet, Shield, Key } from "lucide-react"

export function WalletDemo() {
  const [demoWallet, setDemoWallet] = useState<any>(null)
  const [passphrase, setPassphrase] = useState("")
  const [encryptedData, setEncryptedData] = useState<any>(null)
  const [decryptedWallet, setDecryptedWallet] = useState<any>(null)
  const [error, setError] = useState("")

  const handleCreateDemo = () => {
    try {
      const wallet = createEvmWallet()
      setDemoWallet(wallet)
      setError("")
    } catch (err) {
      setError("Failed to create demo wallet")
    }
  }

  const handleEncrypt = async () => {
    if (!demoWallet || !passphrase) {
      setError("Please create a wallet and enter a passphrase")
      return
    }

    try {
      const credentials = {
        address: demoWallet.address,
        privateKey: demoWallet.privateKey,
        mnemonic: demoWallet.mnemonic,
        createdAt: new Date().toISOString(),
        encrypted: false
      }
      
      const response = await fetch('/api/wallet/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credentials,
          passphrase
        })
      });

      if (!response.ok) {
        throw new Error('Failed to encrypt wallet');
      }

      const data = await response.json();
      setEncryptedData(data.encrypted)
      setError("")
    } catch (err) {
      setError("Failed to encrypt wallet")
    }
  }

  const handleDecrypt = async () => {
    if (!encryptedData || !passphrase) {
      setError("Please encrypt a wallet first")
      return
    }

    try {
      const response = await fetch('/api/wallet/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedData,
          passphrase
        })
      });

      if (!response.ok) {
        throw new Error('Failed to decrypt wallet');
      }

      const data = await response.json();
      setDecryptedWallet(data.wallet)
      setError("")
    } catch (err) {
      setError("Failed to decrypt wallet - wrong passphrase or corrupted data")
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span>Wallet Encryption Demo</span>
        </CardTitle>
        <CardDescription>
          Demonstration of wallet creation, encryption, and decryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={handleCreateDemo} className="h-20">
            <div className="text-center">
              <Wallet className="w-6 h-6 mx-auto mb-2" />
              <div>Create Wallet</div>
            </div>
          </Button>
          
          <Button 
            onClick={handleEncrypt} 
            disabled={!demoWallet || !passphrase}
            className="h-20"
          >
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto mb-2" />
              <div>Encrypt</div>
            </div>
          </Button>
          
          <Button 
            onClick={handleDecrypt} 
            disabled={!encryptedData || !passphrase}
            className="h-20"
          >
            <div className="text-center">
              <Key className="w-6 h-6 mx-auto mb-2" />
              <div>Decrypt</div>
            </div>
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Passphrase:</label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Enter passphrase for encryption"
            className="w-full p-2 border rounded"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {demoWallet && (
          <Card>
            <CardHeader>
              <CardTitle>Created Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><strong>Address:</strong> {demoWallet.address}</div>
                <div><strong>Private Key:</strong> {demoWallet.privateKey.slice(0, 20)}...</div>
                {demoWallet.mnemonic && (
                  <div><strong>Mnemonic:</strong> {demoWallet.mnemonic.slice(0, 30)}...</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {encryptedData && (
          <Card>
            <CardHeader>
              <CardTitle>Encrypted Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(encryptedData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {decryptedWallet && (
          <Card>
            <CardHeader>
              <CardTitle>Decrypted Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div><strong>Address:</strong> {decryptedWallet.address}</div>
                <div><strong>Private Key:</strong> {decryptedWallet.privateKey.slice(0, 20)}...</div>
                {decryptedWallet.mnemonic && (
                  <div><strong>Mnemonic:</strong> {decryptedWallet.mnemonic.slice(0, 30)}...</div>
                )}
                <div><strong>Created:</strong> {new Date(decryptedWallet.createdAt).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
