import { queueDiscovery } from '@/core/crawler';
import { withTitan } from '@/core/api/handler';
import { runFullMaintenance } from '@/core/database/maintenance';

/**
 * TITAN CRON TRIGGER
 * Auth: Bearer token must match CRON_SECRET env var (no fallback default allowed).
 */
export const GET = withTitan({
    handler: async (request) => {
        const authHeader = request.headers.get('authorization');
        const secret = process.env.CRON_SECRET;

        if (!secret) {
            throw { status: 500, message: 'Server misconfiguration: CRON_SECRET not set.' };
        }

        if (authHeader !== `Bearer ${secret}`) {
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
            maintenance: maintenanceResult.results
        };
    }
});
