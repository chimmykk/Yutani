"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { getSavedWallets, loadEncryptedCredentials, deleteSavedWallet } from "@/lib/crypto-utils"
import { Wallet, Trash2, Eye, EyeOff, Key } from "lucide-react"

export function WalletManager() {
  const [savedWallets, setSavedWallets] = useState<Array<{filename: string, createdAt: string}>>([])
  const [selectedWallet, setSelectedWallet] = useState<string>("")
  const [passphrase, setPassphrase] = useState("")
  const [decryptedWallet, setDecryptedWallet] = useState<any>(null)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadSavedWallets()
  }, [])

  const loadSavedWallets = async () => {
    setIsLoadingWallets(true)
    try {
      const wallets = await getSavedWallets()
      setSavedWallets(wallets)
    } catch (err) {
      setError("Failed to load saved wallets")
    } finally {
      setIsLoadingWallets(false)
    }
  }

  const handleLoadWallet = async () => {
    if (!selectedWallet || !passphrase) {
      setError("Please select a wallet and enter passphrase")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const wallet = await loadEncryptedCredentials(selectedWallet, passphrase)
      setDecryptedWallet(wallet)
    } catch (err) {
      setError("Failed to decrypt wallet. Wrong passphrase or corrupted data.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWallet = async (filename: string) => {
    if (confirm("Are you sure you want to delete this wallet? This action cannot be undone.")) {
      try {
        await deleteSavedWallet(filename)
        await loadSavedWallets()
        if (selectedWallet === filename) {
          setSelectedWallet("")
          setDecryptedWallet(null)
        }
      } catch (err) {
        setError("Failed to delete wallet")
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span>Wallet Manager</span>
        </CardTitle>
        <CardDescription>
          Manage your saved encrypted wallets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoadingWallets ? (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Loading saved wallets...
            </AlertDescription>
          </Alert>
        ) : savedWallets.length === 0 ? (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              No saved wallets found. Create or import a wallet to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="wallet-select">Select Wallet</Label>
              <div className="flex items-center space-x-2 mt-2">
                <select
                  id="wallet-select"
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className="flex-1 p-2 border rounded"
                >
                  <option value="">Choose a wallet...</option>
                  {savedWallets.map((wallet) => (
                    <option key={wallet.filename} value={wallet.filename}>
                      {wallet.filename} ({new Date(wallet.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                {selectedWallet && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWallet(selectedWallet)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="passphrase">Passphrase</Label>
              <Input
                id="passphrase"
                type="password"
                placeholder="Enter passphrase to decrypt wallet"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button 
              onClick={handleLoadWallet} 
              disabled={!selectedWallet || !passphrase || isLoading}
              className="w-full"
            >
              {isLoading ? "Decrypting..." : "Load Wallet"}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {decryptedWallet && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>Decrypted Wallet</span>
                    <Badge variant="secondary">Decrypted</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Address</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={decryptedWallet.address}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(decryptedWallet.address)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Private Key</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type={showPrivateKey ? "text" : "password"}
                        value={decryptedWallet.privateKey}
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
                        onClick={() => copyToClipboard(decryptedWallet.privateKey)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  {decryptedWallet.mnemonic && (
                    <div>
                      <Label>Mnemonic Phrase</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={decryptedWallet.mnemonic}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(decryptedWallet.mnemonic)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(decryptedWallet.createdAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
