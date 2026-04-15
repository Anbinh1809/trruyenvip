import { query } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';

/**
 * GET: Retrieve crawler logs
 * Hardened: Wrapped in withTitan for global security headers.
 */
export const GET = withTitan({
    admin: true,
    handler: async () => {
        const res = await query('SELECT * FROM crawllogs ORDER BY created_at DESC LIMIT 50');
        return res.recordset || [];
    }
});
