"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SignOutButton } from "@/components/sign-out-button"
import { Badge } from "@/components/ui/badge"
import { SessionTimeoutWarning } from "@/components/session-timeout-warning"
import { CreateWallet } from "@/components/create-wallet"
import { ImportWallet } from "@/components/import-wallet"
import { WalletDemo } from "@/components/wallet-demo"
import { WalletManager } from "@/components/wallet-manager"

export default function WelcomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SessionTimeoutWarning />
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-xl">AuthApp</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.picture || ""} alt={user.name || ""} />
                <AvatarFallback className="bg-accent text-accent-foreground">{userInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Welcome Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Success Message */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Welcome, <span className="text-accent">{user.name?.split(" ")[0]}!</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            🎉 Authentication successful! You're now securely signed in with your Google account.
          </p>

          <div className="flex justify-center mb-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Session Active (30 min)
            </Badge>
          </div>
        </div>

        {/* User Profile Card */}
        <Card className="max-w-2xl mx-auto mb-12 border-2 border-accent/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.picture || ""} alt={user.name || ""} />
                <AvatarFallback className="bg-accent text-accent-foreground text-2xl">{userInitials}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">Your Profile</CardTitle>
            <CardDescription>Here are your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="font-medium text-lg">Name:</span>
              <span className="text-muted-foreground text-lg">{user.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="font-medium text-lg">Email:</span>
              <span className="text-muted-foreground text-lg">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <span className="font-medium text-lg">Authentication:</span>
              <Badge className="bg-accent text-accent-foreground">Google OAuth</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="font-medium text-lg">Status:</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Active & Secure</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span>Profile Settings</span>
              </CardTitle>
              <CardDescription>Manage your account preferences and personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Manage Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>Security</span>
              </CardTitle>
              <CardDescription>Your account is secured with Google OAuth 2.0</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Security Details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>Help & Support</span>
              </CardTitle>
              <CardDescription>Get help and find answers to your questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Get Help
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Management Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">Wallet Management</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create a new EVM wallet or import an existing one. All wallet data is encrypted and stored securely.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CreateWallet />
            <ImportWallet />
          </div>
          
          {/* Wallet Manager */}
          <div className="mt-12">
            <WalletManager />
          </div>
          
          {/* Demo Section */}
          <div className="mt-12">
            <WalletDemo />
          </div>
        </div>

        {/* Session Info */}
        <Card className="max-w-4xl mx-auto bg-muted/30">
          <CardHeader>
            <CardTitle className="text-center">Session Information</CardTitle>
            <CardDescription className="text-center">Your current session details and security status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Session Duration:</span>
                  <span className="text-muted-foreground">30 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Authentication Method:</span>
                  <span className="text-muted-foreground">Google OAuth 2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Connection Status:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">Secure</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Last Sign In:</span>
                  <span className="text-muted-foreground">Just now</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Account Type:</span>
                  <span className="text-muted-foreground">Google Account</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Data Privacy:</span>
                  <span className="text-green-600 font-medium">Protected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
