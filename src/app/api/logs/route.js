import { query } from '@/HeThong/Database/CoSoDuLieu';
import { withTitan } from '@/HeThong/API/XuLyAPI';

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

