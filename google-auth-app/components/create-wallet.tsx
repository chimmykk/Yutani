"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { createEvmWallet } from "@/lib/wallet-utils"
import { saveEncryptedCredentials, WalletCredentials } from "@/lib/crypto-utils"
import { Copy, Eye, EyeOff, Shield, Wallet, Phone, MessageSquare } from "lucide-react"
import { TwilioWalletIntegration } from "./twilio-wallet-integration"
import { TwilioWalletManager } from "./twilio-wallet-manager"
import { WhatsAppWalletIntegration } from "./whatsapp-wallet-integration"
import { WhatsAppWalletManager } from "./whatsapp-wallet-manager"
import { WhatsAppSetup } from "./whatsapp-setup"

export function CreateWallet() {
  const [wallet, setWallet] = useState<WalletCredentials | null>(null)
  const [passphrase, setPassphrase] = useState("")
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showMnemonic, setShowMnemonic] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [showTwilioIntegration, setShowTwilioIntegration] = useState(false)
  const [showWhatsAppIntegration, setShowWhatsAppIntegration] = useState(false)

  const handleCreateWallet = async () => {
    setIsCreating(true)
    setError("")
    
    try {
      const walletData = createEvmWallet()
      const credentials: WalletCredentials = {
        address: walletData.address,
        privateKey: walletData.privateKey,
        mnemonic: walletData.mnemonic,
        createdAt: new Date().toISOString(),
        encrypted: false
      }
      setWallet(credentials)
    } catch (err) {
      setError("Failed to create wallet. Please try again.")
    } finally {
      setIsCreating(false)
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

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>Create New Wallet</span>
          </CardTitle>
          <CardDescription>
            Generate a new EVM wallet with secure encryption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!wallet ? (
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  This will generate a new wallet with a random private key and mnemonic phrase. 
                  Make sure to save your credentials securely.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleCreateWallet} 
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? "Creating Wallet..." : "Create New Wallet"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  ⚠️ <strong>Important:</strong> Save your private key and mnemonic phrase securely. 
                  We cannot recover them if lost.
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
                    <div className="space-y-2">
                      <Textarea
                        id="mnemonic"
                        value={wallet.mnemonic}
                        readOnly
                        className="font-mono"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMnemonic(!showMnemonic)}
                        >
                          {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showMnemonic ? "Hide" : "Show"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(wallet.mnemonic || "")}
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
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
                  <div className="space-y-4">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        ✅ Wallet saved successfully! Your credentials have been encrypted and stored securely.
                      </AlertDescription>
                    </Alert>
                    
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowTwilioIntegration(!showTwilioIntegration)}
                      className="flex-1"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {showTwilioIntegration ? "Hide" : "Show"} Twilio Options
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowWhatsAppIntegration(!showWhatsAppIntegration)}
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {showWhatsAppIntegration ? "Hide" : "Show"} WhatsApp Options
                    </Button>
                  </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleSaveWallet} 
                    disabled={isSaving || !passphrase}
                    className="w-full"
                  >
                    {isSaving ? "Saving..." : "Save Encrypted Wallet"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
    {showTwilioIntegration && (
      <div className="space-y-6 mt-6">
        <TwilioWalletIntegration onWalletCreated={setWallet} />
        <TwilioWalletManager />
      </div>
    )}
    
    {showWhatsAppIntegration && (
      <div className="space-y-6 mt-6">
        <WhatsAppSetup />
        <WhatsAppWalletIntegration onWalletCreated={setWallet} />
        <WhatsAppWalletManager />
      </div>
    )}
    </>
  )
}
