import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/study-materials', '/login', '/register', '/forgot-password'];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get the auth cookie
  const authCookie = request.cookies.get('connect.sid');

  // If no auth cookie, redirect to login
  if (!authCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For protected routes with cookie, validate session with backend
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';
    const response = await fetch(`${apiUrl}/auth/check`, {
      method: 'GET',
      headers: {
        'Cookie': `connect.sid=${authCookie.value}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    // If session is invalid, clear cookie and redirect to login
    if (!response.ok || response.status === 401) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);

      // Clear the invalid cookie
      redirectResponse.cookies.delete('connect.sid');

      return redirectResponse;
    }

    // Session is valid, allow access
    return NextResponse.next();

  } catch (error) {
    // If validation fails, redirect to login
    console.error('Session validation error:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);

    // Clear the cookie on error
    redirectResponse.cookies.delete('connect.sid');

    return redirectResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};