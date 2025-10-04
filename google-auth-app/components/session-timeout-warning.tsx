"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export function SessionTimeoutWarning() {
  const { logout } = useAuth()
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1
        
        // Show warning when 5 minutes left
        if (newTime <= 5 * 60 && !showWarning) {
          setShowWarning(true)
        }
        
        // Auto logout when time is up
        if (newTime <= 0) {
          logout()
          return 0
        }
        
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [logout, showWarning])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!showWarning) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session expires in {formatTime(timeLeft)}</p>
              <p className="text-sm">Please save your work or extend your session.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWarning(false)}
              className="ml-2"
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
