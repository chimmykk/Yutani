import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "1057451768541-52utm07bhbgrogbcjdii4funf63t8acp.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add session timeout tracking
      if (token.expiresAt && new Date() > new Date(token.expiresAt as number)) {
        return session // Return session instead of null
      }
      
      // Ensure user ID is available
      if (session.user && token.sub) {
        (session.user as any).id = token.sub
      }
      
      return session
    },
    async jwt({ token, account, profile }) {
      // Set session expiration to 30 minutes from now
      if (account) {
        token.expiresAt = Date.now() + 30 * 60 * 1000 // 30 minutes
      }
      return token
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes in seconds
  },
  jwt: {
    maxAge: 30 * 60, // 30 minutes in seconds
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
}
