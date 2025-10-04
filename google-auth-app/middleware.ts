import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard)
  const path = request.nextUrl.pathname

  // Check if the path should be protected
  const isProtectedPath = path.startsWith("/dashboard")

  if (isProtectedPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
    })

    // If no token found, redirect to home page
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Check if session has expired (30 minutes)
    if (token.expiresAt && new Date() > new Date(token.expiresAt as number)) {
      return NextResponse.redirect(new URL("/?session=expired", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
