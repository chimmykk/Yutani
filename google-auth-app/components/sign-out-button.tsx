"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  const { logout } = useAuth()

  return (
    <Button onClick={logout} variant="outline" size="sm">
      Sign Out
    </Button>
  )
}
