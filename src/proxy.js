import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * TruyenVip Global TITAN Proxy (Next.js 16)
 * Orchestrates Edge-level security, RBAC, and Security Headers.
 */

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const CRON_SECRET = process.env.CRON_SECRET;

export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  // --- TITAN-1: API CRON PROTECTION ---
  if (pathname === '/api/cron') {
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
       console.warn(`[Security Alert] Unauthorized access attempt to CRON service from ${request.ip}`);
       return new NextResponse('Unauthorized', { status: 401 });
    }
    return NextResponse.next();
  }

  // --- TITAN-2: RBAC (Role-Based Access Control) ---
  const protectedPaths = ['/profile', '/favorites', '/history', '/rewards', '/leaderboard', '/transfer'];
  const adminPaths = ['/admin', '/api/admin', '/api/crawler', '/api/migration'];

  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));

  if (isProtected || isAdminPath) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    try {
      if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not configured in production environment.');
      }

      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Admin route enforcement
      if (isAdminPath && payload.role !== 'admin') {
        console.warn(`[Security Alert] User ${payload.username} [${payload.role}] attempted to access restricted path: ${pathname}`);
        return NextResponse.redirect(new URL('/', request.url));
      }

      const response = NextResponse.next();
      applyTitanHeaders(response);
      return response;
    } catch (err) {
      console.error(`[Proxy] Token verification failed for ${pathname}:`, err.message);
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  const response = NextResponse.next();
  applyTitanHeaders(response);
  return response;
}

function applyTitanHeaders(response) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Titan-Security', 'Ironclad-Enforced');
}

export const config = {
  matcher: [
    '/profile/:path*', 
    '/favorites/:path*', 
    '/history/:path*',
    '/history',
    '/transfer/:path*', 
    '/admin/:path*', 
    '/rewards/:path*',
    '/rewards',
    '/leaderboard/:path*',
    '/leaderboard',
    '/api/cron',
    '/api/transfer/:path*', 
    '/api/migration/:path*', 
    '/api/crawler/:path*',
    '/api/favorites/:path*'
  ],
};
