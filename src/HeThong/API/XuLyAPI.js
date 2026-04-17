import { getSession } from '../BaoMat/XacThuc';
import { NextResponse } from 'next/server';

/**
 * withTitan: Industrial-grade API Handler
 * @param {Object} options 
 * @param {boolean} options.auth - Requires authentication
 * @param {boolean} options.admin - Requires admin role
 * @param {Function} options.handler - The actual API logic
 */
export function withTitan(options) {
  return async (request, context) => {
    try {
      // TITAN FAIL-SAFE: Handle the 'authenticated' vs 'auth' typo seen in legacy/drifted routes
      const isAuthRequired = options.auth || options.authenticated;

      // TITAN-GRADE ISOLATION: 
      // We ONLY call getSession if this endpoint explicitly requires auth, admin, 
      // or allows optional identification (e.g. Identity API).
      const shouldFetchSession = isAuthRequired || options.admin || options.allowOptional;
      const session = shouldFetchSession ? await getSession() : null;

      // 1. Auth Guard (Robust check)
      if (isAuthRequired && !session) {
        return new Response('Unauthorized', { status: 401 });
      }

      // 2. Admin Guard
      if (options.admin && (!session || session.role !== 'admin')) {
        return new Response('Forbidden', { status: 403 });
      }

      // 3. Execute Handler
      const result = await options.handler(request, session, context);

      const response = result instanceof Response || result instanceof NextResponse 
        ? result 
        : NextResponse.json(result || { success: true });

      // TITAN SECURITY HEADERS: Industrial protection suite
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      return response;
    } catch (error) {
      const url = new URL(request.url).pathname;
      console.error(`[API ERROR] ${url} (${options.handler.name || 'Anonymous'}):`, error);
      
      const status = error.status || 500;
      const message = error.message || 'Lỗi hệ thống';
      
      return NextResponse.json({ 
        error: message,
        timestamp: new Date().toISOString()
      }, { status });
    }
  };
}
