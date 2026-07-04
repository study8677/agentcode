// middleware.ts -- review context snapshot (excerpt, unrelated config
// omitted). This is the code BEFORE the PR is applied.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from './lib/auth'

const protectedRoutes = ['/admin', '/billing', '/settings']

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const requiresAuth = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!requiresAuth) {
    return NextResponse.next()
  }

  // Gate protected routes on a valid session cookie; anonymous users are
  // redirected to the login page with a return path.
  const session = verifySession(req.cookies.get('session')?.value)
  if (!session) {
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/billing/:path*', '/settings/:path*'],
}
