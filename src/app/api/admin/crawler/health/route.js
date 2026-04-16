import { loadSystemState } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';

export const GET = withTitan({
    auth: true,
    handler: async (req, session) => {
        if (session.role !== 'admin') {
            throw { status: 403, message: 'Forbidden' };
        }

        const state = await loadSystemState('crawler_state');
        const mirrorHealth = state?.mirrorHealth || {};
        
        return {
            success: true,
            timestamp: Date.now(),
            mirrors: mirrorHealth
        };
    }
});
