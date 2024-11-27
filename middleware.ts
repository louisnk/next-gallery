export const runtime = 'experimental-edge'

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { PUBLIC_PATHS, PUBLIC_APIS } from '@/app/lib/constants'


export function middleware(request: NextRequest) {
  const headersList = headers()
  const token = headersList.get('Authorization')?.split(' ')[1]

  console.log("request.nextUrl.pathname", request.nextUrl.pathname)
  const isPublicApi = PUBLIC_APIS.includes(request.nextUrl.pathname)
  const isPublicPath = PUBLIC_PATHS.includes(request.nextUrl.pathname)

  // Modify API requests to include the token
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log("<Token>", token, "</Token>")
    if (!token && !isPublicApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Clone the request headers and add the token
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('Authorization', `Bearer ${token}`)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // // Handle page routes
  // if (!token && !isPublicPath) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  // if (token && isPublicPath) {
  //   return NextResponse.redirect(new URL('/', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}