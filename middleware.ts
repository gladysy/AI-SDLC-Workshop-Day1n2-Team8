// Middleware for protecting authenticated routes (PRP 11).
// Protects `/` and `/calendar` - redirects unauthenticated users to `/login`.

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from './lib/middleware-auth';

export async function middleware(request: NextRequest) {
  const protectedPaths = ['/', '/calendar'];
  const pathname = request.nextUrl.pathname;

  if (protectedPaths.includes(pathname)) {
    const token = request.cookies.get('session')?.value;
    const session = await verifySessionToken(token);
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/calendar'],
};
