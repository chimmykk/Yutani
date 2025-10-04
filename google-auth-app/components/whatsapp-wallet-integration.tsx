"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Wallet, Shield, Loader2, QrCode } from "lucide-react"

interface WhatsAppWalletIntegrationProps {
  onWalletCreated?: (wallet: any) => void;
}

export function WhatsAppWalletIntegration({ onWalletCreated }: WhatsAppWalletIntegrationProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [passphrase, setPassphrase] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleCreateAndSend = async () => {
    if (!phoneNumber || !passphrase) {
      setError("Please enter both phone number and passphrase")
      return
    }

    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch("/api/whatsapp/wallet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          passphrase
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create and send wallet")
      }

      setResult(data)
      if (onWalletCreated) {
        onWalletCreated(data.data.wallet)
      }
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
          <MessageSquare className="w-5 h-5" />
          <span>WhatsApp Wallet Delivery</span>
        </CardTitle>
        <CardDescription>
          Create a new wallet and deliver it via WhatsApp message
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
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
            <Label htmlFor="passphrase">Encryption Passphrase</Label>
            <Input
              id="passphrase"
              type="password"
              placeholder="Enter a strong passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              This passphrase will encrypt your wallet data
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
                  <p>✅ Wallet created and sent via WhatsApp!</p>
                  <div className="space-y-1">
                    <p><strong>Wallet Address:</strong> {result.data.wallet.address}</p>
                    <p><strong>Message ID:</strong> {result.data.message.messageId}</p>
                    <p><strong>Status:</strong> {result.data.message.status}</p>
                    <p><strong>Filename:</strong> {result.data.filename}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleCreateAndSend} 
            disabled={isLoading || !phoneNumber || !passphrase}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating and Sending...
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Create & Send via WhatsApp
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
