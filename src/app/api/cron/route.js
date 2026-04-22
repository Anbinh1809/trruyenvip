import { queueDiscovery } from '@/core/crawler';
import { withTitan } from '@/core/api/handler';
import { runFullMaintenance } from '@/core/database/maintenance';

/**
 * TITAN CRON TRIGGER
 * M6 FIX: Primary auth handled by middleware (proxy.js).
 * This is a defensive fallback only — ensures misconfigured middleware can't bypass auth.
 */
export const GET = withTitan({
    handler: async (request) => {
        const authHeader = request.headers.get('authorization');
        const secret = process.env.CRON_SECRET;

        // Defensive fallback: middleware should have already blocked unauthorized requests
        if (!secret || authHeader !== `Bearer ${secret}`) {
            throw { status: 401, message: 'Unauthorized' };
        }

        // 1. PERFORM SYSTEM MAINTENANCE FIRST
        const maintenanceResult = await runFullMaintenance();

        // 2. Queue discovery tasks
        await queueDiscovery('nettruyen', 3, 1, 10);
        await queueDiscovery('truyenqq', 3, 1, 10);

        return {
            success: true,
            message: 'Cron triggered: Maintenance complete and tasks queued.',
            maintenance: maintenanceResult
        };
    }
});
