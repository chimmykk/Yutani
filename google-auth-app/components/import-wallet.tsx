"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createWalletFromMnemonic, createWalletFromPrivateKey } from "@/lib/wallet-utils"
import { saveEncryptedCredentials, WalletCredentials } from "@/lib/crypto-utils"
import { Copy, Eye, EyeOff, Shield, Download, Key } from "lucide-react"

export function ImportWallet() {
  const [wallet, setWallet] = useState<WalletCredentials | null>(null)
  const [mnemonic, setMnemonic] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [passphrase, setPassphrase] = useState("")
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const handleImportFromMnemonic = async () => {
    if (!mnemonic.trim()) {
      setError("Please enter a mnemonic phrase")
      return
    }

    setIsImporting(true)
    setError("")

    try {
      const walletData = createWalletFromMnemonic(mnemonic.trim())
      if (!walletData) {
        setError("Invalid mnemonic phrase. Please check and try again.")
        return
      }

      const credentials: WalletCredentials = {
        address: walletData.address,
        privateKey: walletData.privateKey,
        mnemonic: walletData.mnemonic,
        createdAt: new Date().toISOString(),
        encrypted: false
      }
      setWallet(credentials)
    } catch (err) {
      setError("Failed to import wallet from mnemonic. Please check your phrase and try again.")
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportFromPrivateKey = async () => {
    if (!privateKey.trim()) {
      setError("Please enter a private key")
      return
    }

    setIsImporting(true)
    setError("")

    try {
      const walletData = createWalletFromPrivateKey(privateKey.trim())
      if (!walletData) {
        setError("Invalid private key. Please check and try again.")
        return
      }

      const credentials: WalletCredentials = {
        address: walletData.address,
        privateKey: walletData.privateKey,
        createdAt: new Date().toISOString(),
        encrypted: false
      }
      setWallet(credentials)
    } catch (err) {
      setError("Failed to import wallet from private key. Please check your key and try again.")
    } finally {
      setIsImporting(false)
    }
  }

  const handleSaveWallet = async () => {
    if (!wallet || !passphrase) {
      setError("Please enter a passphrase to encrypt your wallet")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const filename = `wallet_${wallet.address.slice(0, 8)}_${Date.now()}`
      await saveEncryptedCredentials(wallet, passphrase, filename)
      setSaved(true)
    } catch (err) {
      setError("Failed to save wallet. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const resetForm = () => {
    setWallet(null)
    setMnemonic("")
    setPrivateKey("")
    setPassphrase("")
    setError("")
    setSaved(false)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Import Existing Wallet</span>
        </CardTitle>
        <CardDescription>
          Import an existing wallet using mnemonic phrase or private key
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!wallet ? (
          <Tabs defaultValue="mnemonic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mnemonic">Mnemonic Phrase</TabsTrigger>
              <TabsTrigger value="privateKey">Private Key</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mnemonic" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Enter your 12 or 24-word mnemonic phrase to import your wallet.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="mnemonic">Mnemonic Phrase</Label>
                <Textarea
                  id="mnemonic"
                  placeholder="Enter your mnemonic phrase (12 or 24 words)"
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  rows={3}
                  className="font-mono"
                />
              </div>
              
              <Button 
                onClick={handleImportFromMnemonic} 
                disabled={isImporting || !mnemonic.trim()}
                className="w-full"
              >
                {isImporting ? "Importing..." : "Import from Mnemonic"}
              </Button>
            </TabsContent>
            
            <TabsContent value="privateKey" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Enter your private key to import your wallet.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="privateKey">Private Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="privateKey"
                    type={showPrivateKey ? "text" : "password"}
                    placeholder="Enter your private key"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={handleImportFromPrivateKey} 
                disabled={isImporting || !privateKey.trim()}
                className="w-full"
              >
                {isImporting ? "Importing..." : "Import from Private Key"}
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                ✅ Wallet imported successfully! Your wallet details are shown below.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Wallet Address</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="address"
                    value={wallet.address}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(wallet.address)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="privateKey">Private Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="privateKey"
                    type={showPrivateKey ? "text" : "password"}
                    value={wallet.privateKey}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(wallet.privateKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {wallet.mnemonic && (
                <div>
                  <Label htmlFor="mnemonic">Mnemonic Phrase</Label>
                  <Textarea
                    id="mnemonic"
                    value={wallet.mnemonic}
                    readOnly
                    className="font-mono"
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="passphrase">Encryption Passphrase</Label>
                <Input
                  id="passphrase"
                  type="password"
                  placeholder="Enter a strong passphrase to encrypt your wallet"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This passphrase will be used to encrypt your wallet data for secure storage.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {saved ? (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Wallet saved successfully! Your credentials have been encrypted and stored securely.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSaveWallet} 
                    disabled={isSaving || !passphrase}
                    className="flex-1"
                  >
                    {isSaving ? "Saving..." : "Save Encrypted Wallet"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetForm}
                  >
                    Import Another
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
