import { loadSystemState } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

/**
 * Fix #7: Changed from auth:true + manual role check → admin:true directly.
 * Eliminates the redundant double-check pattern.
 */
export const GET = withTitan({
    admin: true,
    handler: async () => {
        const state = await loadSystemState('crawler_state');
        const mirrorHealth = state?.mirrorHealth || {};

        return {
            success: true,
            timestamp: Date.now(),
            mirrors: mirrorHealth
        };
    }
});
