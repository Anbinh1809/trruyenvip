import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const revalidate = 300; // Cache for 5 minutes

/**
 * GET: Leaderboard retrieval
 * Hardened: Hidden sensitive user fields (vipcoins, role) to ensure privacy.
 * Wrapped in withTitan for global security headers.
 */
export const GET = withTitan({
    handler: async () => {
        try {
            // SELECT only public-safe fields
            const result = await query(`
                SELECT username, xp, avatar
                FROM users
                ORDER BY xp DESC
                LIMIT 100
            `);

            return result.recordset || [];
        } catch (e) {
            console.error('Leaderboard error:', e);
            throw e;
        }
    }
});

