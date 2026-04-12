import { NextResponse } from 'next/server';

// TITAN DEFENSE SHIELD: Global Security Middleware
// Protects sensitive routes and enforces premium security headers.

const RATE_LIMIT_MAP = new Map();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // Standard 1 req/sec average

export function middleware(request) {
    const { pathname } = request.nextUrl;
    const ip = request.ip || '127.0.0.1';
    
    // 1. IP-Based Rate Limiting (Memory-Safe Guard)
    if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/admin')) {
        // AUTOPURGE: Prevent map leak (Max 5000 entries)
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

    const response = NextResponse.next();

    // 2. Titan Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // 3. Sliding Session Window Logic (Conceptual)
    // If the user has a valid token, we could potentially set it again with a fresh expiry here.
    // But since Next.js Middleware can't easily sign JWTs without importing the whole jose lib 
    // (which might bloat the edge), we'll keep it simple for now and handle 
    // session extension in the Auth route or via a dedicated API.

    return response;
}

export const config = {
    matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
