import { getSession } from './auth';
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
      const session = await getSession();

      // 1. Auth Guard
      if (options.auth && !session) {
        return new Response('Unauthorized', { status: 401 });
      }

      // 2. Admin Guard
      if (options.admin && (!session || session.role !== 'admin')) {
        return new Response('Forbidden', { status: 403 });
      }

      // 3. Execute Handler
      const result = await options.handler(request, session, context);

      // 4. Transform to NextResponse if needed
      if (result instanceof Response || result instanceof NextResponse) {
        return result;
      }

      return NextResponse.json(result || { success: true });
    } catch (error) {
      console.error(`[API ERROR] ${options.handler.name || 'Anonymous'}:`, error);
      
      const status = error.status || 500;
      const message = error.message || 'Lỗi hệ thống';
      
      return NextResponse.json({ 
        error: message,
        timestamp: new Date().toISOString()
      }, { status });
    }
  };
}
