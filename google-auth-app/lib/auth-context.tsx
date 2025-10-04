"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useSession, signOut } from "next-auth/react"

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

interface AuthContextType {
  user: GoogleUser | null
  isLoading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true)
    } else if (status === "authenticated" && session?.user) {
      // Convert NextAuth session to our GoogleUser format
      const googleUser: GoogleUser = {
        id: (session.user as any).id || session.user.email || "",
        email: session.user.email || "",
        name: session.user.name || "",
        picture: session.user.image || "",
      }
      setUser(googleUser)
      setIsLoading(false)
    } else {
      setUser(null)
      setIsLoading(false)
    }
  }, [session, status])

  const logout = () => {
    signOut({ callbackUrl: "/" })
  }

  return <AuthContext.Provider value={{ user, isLoading, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
