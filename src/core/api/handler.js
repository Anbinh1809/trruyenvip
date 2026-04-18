import { getSession } from '../security/auth';
import { NextResponse } from 'next/server';

export function withTitan(options) {
  return async (request, context) => {
    try {
      const isAuthRequired = options.auth || options.authenticated;
      const shouldFetchSession = isAuthRequired || options.admin || options.allowOptional;
      const session = shouldFetchSession ? await getSession() : null;

      if (isAuthRequired && !session) return new Response('Unauthorized', { status: 401 });
      if (options.admin && (!session || session.role !== 'admin')) return new Response('Forbidden', { status: 403 });

      const result = await options.handler(request, session, context);
      const response = result instanceof Response || result instanceof NextResponse 
        ? result 
        : NextResponse.json(result || { success: true });

      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      return response;
    } catch (error) {
      const url = new URL(request.url).pathname;
      console.error(`[API ERROR] ${url}:`, error);
      return NextResponse.json({ error: error.message || 'Lỗi hệ thống', timestamp: new Date().toISOString() }, { status: error.status || 500 });
    }
  };
}
