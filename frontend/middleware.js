import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/register'];
  const authFlowRoutes = ['/forgot-password', '/reset-password'];
  
  const isPublic = publicRoutes.some(route => pathname.startsWith(route));
  const isAuthFlow = authFlowRoutes.some(route => pathname.startsWith(route));

  // Always allow forgot/reset password pages
  if (isAuthFlow) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if already logged in and trying to access login/register
  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};