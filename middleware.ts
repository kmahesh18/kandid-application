import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];

// Define auth routes that should redirect to dashboard if user is authenticated
const authRoutes = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Get the session token from cookies - try different possible cookie names
  const sessionToken =
  request.cookies.get('__Secure-better-auth.session_token')?.value ||
  request.cookies.get('__Secure-better-auth.session-token')?.value ||
  request.cookies.get('better-auth.session_token')?.value ||
  request.cookies.get('better-auth.session-token')?.value ||
  request.cookies.get('session_token')?.value ||
  request.cookies.get('session-token')?.value;

  
  const isAuthenticated = !!sessionToken;
  
  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && !isPublicRoute && pathname !== '/' && !pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  // Redirect root to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!auth|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api/auth (auth API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - public folder files
//      */
//     '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
//   ],
// };
