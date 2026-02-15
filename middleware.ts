/**
 * Next.js Middleware
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_API_ROUTES = ['/api/health', '/api/openapi'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route));
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  if (!pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    const isDev = process.env.NODE_ENV === 'development';
    const scriptSrc = isDev ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'";
    const csp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.anthropic.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    response.headers.set('Content-Security-Policy', csp);
  }

  // AUTH: в production требуется токен. Dev: ENABLE_DEV_AUTH + NEXT_PUBLIC_DEV_TOKEN на бэкенде
  const isDev = process.env.NODE_ENV === 'development';
  const skipAuth = isDev || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  if (pathname.startsWith('/api') && !isPublicRoute(pathname) && !skipAuth) {
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('auth-token')?.value;
    if (!authHeader && !cookieToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing authentication token' },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/(.*)'],
};
