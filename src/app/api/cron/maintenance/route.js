import { runFullMaintenance } from '@/core/database/maintenance';
import { withTitan } from '@/core/api/handler';

/**
 * TITAN MAINTENANCE ENDPOINT
 * Auth: Query param ?key= must match MAINTENANCE_KEY env var (no fallback default).
 */
async function handleMaintenance(request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const secret = process.env.MAINTENANCE_KEY;

    if (!secret) {
        throw { status: 500, message: 'Server misconfiguration: MAINTENANCE_KEY not set.' };
    }

    if (key !== secret) {
        throw { status: 401, message: 'Unauthorized' };
    }

    const results = await runFullMaintenance();
    return {
        success: true,
        timestamp: new Date().toISOString(),
        results
    };
}

export const GET = withTitan({ handler: handleMaintenance });
export const POST = withTitan({ handler: handleMaintenance });
