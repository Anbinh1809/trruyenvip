import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * TruyenVip Global TITAN Proxy & Middleware (Next.js 16)
 * Orchestrates Edge-level security, Rate Limiting, RBAC, and Security Headers.
 */

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const CRON_SECRET = process.env.CRON_SECRET;

// --- RATE LIMITING STATE (Memory-Safe Guard) ---
const RATE_LIMIT_MAP = new Map();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // Standard 1 req/sec average

export default async function proxy(request) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || '127.0.0.1';

  // --- TITAN-0: RATE LIMITING ---
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/admin')) {
      if (RATE_LIMIT_MAP.size > 5000) {
          const oldestKey = RATE_LIMIT_MAP.keys().next().value;
          RATE_LIMIT_MAP.delete(oldestKey);
      }

      const now = Date.now();
      const userLog = RATE_LIMIT_MAP.get(ip) || { count: 0, startTime: now };
      
      if (now - userLog.startTime > LIMIT_WINDOW) {
          userLog.count = 1;
          userLog.startTime = now;
      } else {
          userLog.count++;
      }
      
      RATE_LIMIT_MAP.set(ip, userLog);
      
      if (userLog.count > MAX_REQUESTS) {
          return new NextResponse(
              JSON.stringify({ error: 'Đạo hữu thao tác quá nhanh! Vui lòng tịnh tâm trong giây lát.' }),
              { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
      }
  }

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
  const adminPaths = ['/admin', '/api/admin', '/api/crawler/stats', '/api/migration'];

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
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ],
};
