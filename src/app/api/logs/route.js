import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

/**
 * GET: Retrieve crawler logs
 * Hardened: Wrapped in withTitan for global security headers.
 */
export const GET = withTitan({
    admin: true,
    handler: async () => {
        try {
            const res = await query('SELECT TOP(50) * FROM crawllogs ORDER BY created_at DESC');
            return res.recordset || [];
        } catch (e) {
            console.error('Logs error:', e);
            throw e;
        }
    }
});

