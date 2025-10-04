"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Wallet, Shield, Loader2, RefreshCw } from "lucide-react"

interface SavedWallet {
  filename: string;
  createdAt: string;
  size: number;
}

export function WhatsAppWalletManager() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [passphrase, setPassphrase] = useState("")
  const [selectedWallet, setSelectedWallet] = useState("")
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingWallets, setIsLoadingWallets] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const loadWallets = async () => {
    setIsLoadingWallets(true)
    setError("")

    try {
      const response = await fetch("/api/whatsapp/wallet/list")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load wallets")
      }

      setSavedWallets(data.data.wallets)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallets")
    } finally {
      setIsLoadingWallets(false)
    }
  }

  useEffect(() => {
    loadWallets()
  }, [])

  const handleSendWallet = async () => {
    if (!phoneNumber || !passphrase || !selectedWallet) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/whatsapp/wallet/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          filename: selectedWallet,
          passphrase
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send wallet")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span>Send Existing Wallet via WhatsApp</span>
        </CardTitle>
        <CardDescription>
          Load and send an existing encrypted wallet via WhatsApp message
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Saved Wallets</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={loadWallets}
              disabled={isLoadingWallets}
            >
              {isLoadingWallets ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {savedWallets.length === 0 ? (
            <Alert>
              <AlertDescription>
                No saved wallets found. Create a new wallet first.
              </AlertDescription>
            </Alert>
          ) : (
            <Select value={selectedWallet} onValueChange={setSelectedWallet}>
              <SelectTrigger>
                <SelectValue placeholder="Select a saved wallet" />
              </SelectTrigger>
              <SelectContent>
                {savedWallets.map((wallet) => (
                  <SelectItem key={wallet.filename} value={wallet.filename}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono">{wallet.filename}</span>
                      <Badge variant="secondary" className="ml-2">
                        {new Date(wallet.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Use international format (e.g., +1234567890). Must be a WhatsApp number.
            </p>
          </div>

          <div>
            <Label htmlFor="passphrase">Decryption Passphrase</Label>
            <Input
              id="passphrase"
              type="password"
              placeholder="Enter the passphrase used to encrypt this wallet"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              This must be the same passphrase used when the wallet was encrypted
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>✅ Wallet sent via WhatsApp!</p>
                  <div className="space-y-1">
                    <p><strong>Wallet Address:</strong> {result.data.wallet.address}</p>
                    <p><strong>Message ID:</strong> {result.data.message.messageId}</p>
                    <p><strong>Status:</strong> {result.data.message.status}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleSendWallet} 
            disabled={isLoading || !phoneNumber || !passphrase || !selectedWallet}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Send via WhatsApp
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
