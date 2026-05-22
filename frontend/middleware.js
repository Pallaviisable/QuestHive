import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/request-access', '/invite-preview', '/register'];
  const authFlowRoutes = ['/forgot-password', '/reset-password'];

  const isPublic = publicRoutes.some(route => pathname.startsWith(route));
  const isAuthFlow = authFlowRoutes.some(route => pathname.startsWith(route));

  if (isAuthFlow) return NextResponse.next();

  // Not logged in → send to login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already logged in → redirect away from public pages
  if (token && isPublic) {
    if (role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Super Admin trying to access normal app → redirect to superadmin dashboard
  if (token && role === 'SUPER_ADMIN' && !pathname.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/superadmin', request.url));
  }

  // Non-Super-Admin trying to access superadmin → redirect to dashboard
  if (token && role !== 'SUPER_ADMIN' && pathname.startsWith('/superadmin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};