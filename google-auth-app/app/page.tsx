"use client"

import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  const searchParams = useSearchParams()
  const sessionExpired = searchParams.get("session") === "expired"
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-xl">AuthApp</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Product
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="text-muted-foreground">
            Log in
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
            Try for free
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Session Expired Alert */}
        {sessionExpired && (
          <div className="flex justify-center mb-8">
            <Alert className="max-w-md border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                Your session has expired. Please sign in again to continue.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Announcement Banner */}
        <div className="flex justify-center mb-12">
          <div className="bg-muted rounded-full px-6 py-2 text-sm text-muted-foreground">
            <span className="text-accent font-medium">New:</span> Secure Authentication
            <a href="#" className="text-accent hover:underline ml-2">
              Learn more
            </a>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-8 text-balance leading-tight">
            Secure access for
            <br />
            <span className="text-accent">every user</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto text-pretty">
            Experience seamless authentication with Google OAuth. Sign in securely and access your personalized
            dashboard instantly.
          </p>

          {/* CTA Button */}
          <div className="flex justify-center mb-16">
            <GoogleSignInButton />
          </div>

          {/* Social Proof */}
          <p className="text-muted-foreground text-lg mb-12">
            Trusted by thousands of users worldwide for secure authentication.
          </p>

          {/* Company Logos */}
          <div className="flex items-center justify-center space-x-12 opacity-60">
            <div className="text-2xl font-bold text-muted-foreground">Google</div>
            <div className="text-2xl font-bold text-muted-foreground">Microsoft</div>
            <div className="text-2xl font-bold text-muted-foreground">Apple</div>
            <div className="text-2xl font-bold text-muted-foreground">Meta</div>
            <div className="text-2xl font-bold text-muted-foreground">Amazon</div>
            <div className="text-2xl font-bold text-muted-foreground">Netflix</div>
          </div>
        </div>
      </main>
    </div>
  )
}
