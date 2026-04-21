import { query, checkRateLimit } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

/**
 * Fix #6: Added IP-based rate limiting to prevent Log Flooding / DoS.
 */
export const POST = withTitan({
    handler: async (request) => {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // Rate limit: 5 crash reports per minute per IP
        const limiter = await checkRateLimit(`crash_${ip}`, 5, 60);
        if (!limiter.success) {
            // Silently ignore excess reports to avoid feedback loops
            return { success: true };
        }

        const body = await request.json();
        const { message, stack, digest, url } = body;

        await query(`
            INSERT INTO guardianreports (manga_name, chapter_title, event_type, message)
            VALUES ('CRASH', @message, 'CLIENT_CRASH', @details)
        `, {
            message: (message || 'Web Crash').substring(0, 255),
            details: JSON.stringify({
                stack,
                digest,
                url,
                ip,
                userAgent: request.headers.get('user-agent'),
                timestamp: new Date().toISOString()
            })
        });

        return { success: true };
    }
});
