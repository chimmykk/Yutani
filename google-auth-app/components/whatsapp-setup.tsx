"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, QrCode, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"

interface WhatsAppStatus {
  isReady: boolean;
  hasQRCode: boolean;
  needsAuthentication: boolean;
}

export function WhatsAppSetup() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const checkStatus = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/whatsapp/status")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get WhatsApp status")
      }

      setStatus(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status")
    } finally {
      setIsLoading(false)
    }
  }

  const getQRCode = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/whatsapp/qr")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get QR code")
      }

      setQrCode(data.data.qrCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get QR code")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>WhatsApp Setup</span>
        </CardTitle>
        <CardDescription>
          Connect your WhatsApp account to enable wallet delivery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Status Display */}
          {status && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status</span>
                <Badge variant={status.isReady ? "default" : "secondary"}>
                  {status.isReady ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Disconnected
                    </>
                  )}
                </Badge>
              </div>
              
              {status.needsAuthentication && (
                <Alert>
                  <QrCode className="h-4 w-4" />
                  <AlertDescription>
                    WhatsApp needs to be authenticated. Click "Get QR Code" to scan with your phone.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* QR Code Display */}
          {qrCode && (
            <div className="space-y-4">
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertDescription>
                  Scan this QR code with your WhatsApp mobile app to connect:
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {qrCode}
                </pre>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Open WhatsApp → Settings → Linked Devices → Link a Device
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={checkStatus}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check Status
            </Button>
            
            {status?.needsAuthentication && (
              <Button
                onClick={getQRCode}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 mr-2" />
                )}
                Get QR Code
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Setup Instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click "Get QR Code" to generate a QR code</li>
              <li>Open WhatsApp on your mobile device</li>
              <li>Go to Settings → Linked Devices → Link a Device</li>
              <li>Scan the QR code displayed above</li>
              <li>Click "Check Status" to verify the connection</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
