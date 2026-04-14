import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * TruyenVip Global TITAN Proxy & Middleware (Next.js 16)
 * Orchestrates Edge-level security, Rate Limiting, RBAC, and Security Headers.
 */

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'truyenvip_default_secret_key_change_me');
const CRON_SECRET = process.env.CRON_SECRET;

// --- RATE LIMITING STATE (Memory-Safe Guard) ---
const RATE_LIMIT_MAP = new Map();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 120; // Increased for high-traffic scalability

export default async function proxy(request) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  // --- TITAN-0: RATE LIMITING (Excluding static assets & heavy proxy) ---
  const isSlightlyProtected = pathname.startsWith('/api/auth') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/user');
  if (isSlightlyProtected && !pathname.startsWith('/api/proxy')) {
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
              JSON.stringify({ error: 'Bạn thao tác quá nhanh! Vui lòng đợi trong giây lát.' }),
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
  // --- TITAN INDUSTRIAL SECURITY SUITE ---
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com", // unsafe-inline for Next.js hydration
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: *", // flexible for proxied images
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: *",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Titan-Security', 'Ironclad-Enforced');
  response.headers.set('X-Powered-By', 'Titan-Engine');
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
