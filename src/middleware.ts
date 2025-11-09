/**
 * Next.js Middleware for Route Protection
 * Handles authentication checks before pages render
 */

import { NextRequest, NextResponse } from 'next/server';

// Define protected and public routes
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/delete-account',
  '/change-password',
  '/checkout',
  '/payment/success',
  '/payment/failure',
];

const authRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth status from cookie (Firebase sets this)
  // Firebase Auth uses specific cookie names based on your Firebase config
  const hasAuthCookie = request.cookies.has('__session') || 
                        request.cookies.has('firebaseAuthToken');
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !hasAuthCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    url.searchParams.set('message', 'Please sign in to continue');
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
