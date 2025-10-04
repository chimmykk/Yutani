"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageSquare, PhoneCall, Wallet, Shield, Loader2 } from "lucide-react"

interface TwilioWalletIntegrationProps {
  onWalletCreated?: (wallet: any) => void;
}

export function TwilioWalletIntegration({ onWalletCreated }: TwilioWalletIntegrationProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [passphrase, setPassphrase] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState<"sms" | "call">("sms")
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
      const endpoint = deliveryMethod === "sms" 
        ? "/api/twilio/wallet/create-sms"
        : "/api/twilio/wallet/create-call"

      const response = await fetch(endpoint, {
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
          <Phone className="w-5 h-5" />
          <span>Twilio Wallet Delivery</span>
        </CardTitle>
        <CardDescription>
          Create a new wallet and deliver it via SMS or phone call
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
              Use international format (e.g., +1234567890)
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

          <div>
            <Label htmlFor="deliveryMethod">Delivery Method</Label>
            <Select value={deliveryMethod} onValueChange={(value: "sms" | "call") => setDeliveryMethod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select delivery method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS Text Message</span>
                  </div>
                </SelectItem>
                <SelectItem value="call">
                  <div className="flex items-center space-x-2">
                    <PhoneCall className="w-4 h-4" />
                    <span>Phone Call</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
                  <p>✅ Wallet created and delivered successfully!</p>
                  <div className="space-y-1">
                    <p><strong>Wallet Address:</strong> {result.data.wallet.address}</p>
                    <p><strong>Delivery Method:</strong> {deliveryMethod.toUpperCase()}</p>
                    {result.data.sms && (
                      <p><strong>SMS Status:</strong> {result.data.sms.status}</p>
                    )}
                    {result.data.call && (
                      <p><strong>Call Status:</strong> {result.data.call.status}</p>
                    )}
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
                {deliveryMethod === "sms" ? (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Create & Send via SMS
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Create & Deliver via Call
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
