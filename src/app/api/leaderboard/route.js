import { query } from '@/HeThong/Database/CoSoDuLieu';
import { withTitan } from '@/HeThong/API/XuLyAPI';

export const revalidate = 300; // Cache for 5 minutes

/**
 * GET: Leaderboard retrieval
 * Hardened: Hidden sensitive user fields (vipcoins, role) to ensure privacy.
 * Wrapped in withTitan for global security headers.
 */
export const GET = withTitan({
    handler: async () => {
        // SELECT only public-safe fields
        const result = await query(`
            SELECT username, xp, avatar
            FROM users
            ORDER BY xp DESC
            LIMIT 100
        `);

        return result.recordset || [];
    }
});

