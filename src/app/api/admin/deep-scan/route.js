import { queueDiscovery } from '@/core/crawler';
import { withTitan } from '@/core/api/handler';

/**
 * POST: Manual/Cron Deep Scan Trigger
 * Hardened: 
 * 1. Switched from GET to POST to prevent URL parameter leakage in logs.
 * 2. Wrapped in withTitan for global security headers.
 * 3. Maintains CRON_SECRET check for industrial task automation.
 */
export const POST = withTitan({
    handler: async (request) => {
        // Auth check for CRON_SECRET or Admin Session
        const authHeader = request.headers.get('authorization');
        const secret = process.env.CRON_SECRET;
        
        // Allow if CRON_SECRET matches OR if it's an authenticated Admin session
        // (withTitan already provides the session if available)
        const isCron = secret && authHeader === `Bearer ${secret}`;
        
        // Note: we don't set 'admin: true' in withTitan because we want to allow 
        // the machine-to-machine CRON_SECRET bypass. We handle authorization manually inside.
        const session = await (require('@/core/security/auth').getSession());
        const isAdmin = session?.role === 'admin';

        if (!isCron && !isAdmin) {
            throw { status: 401, message: 'Unauthorized' };
        }

        const body = await request.json().catch(() => ({}));
        const pages = parseInt(body.pages || '20');
        const start = parseInt(body.start || '1');
        const source = body.source || 'nettruyen';
        
        try {
            console.log(`[TITAN INFO] Deep Scan Triggered: ${source}, ${pages} pages from ${start}`);
            
            const batchSize = 10;
            const batches = Math.ceil(pages / batchSize);
            
            for (let i = 0; i < batches; i++) {
                const batchStart = start + (i * batchSize);
                const batchCount = Math.min(batchSize, pages - (i * batchSize));
                
                // Priority 8 for manual/cron admin triggers
                await queueDiscovery(source, batchCount, batchStart, 8);
            }

            return { 
                success: true, 
                message: `Queued ${pages} pages for deep scan in ${batches} high-priority batches.` 
            };
        } catch (err) {
            console.error('[TITAN ERROR] Deep Scan trigger failed:', err.message);
            throw { status: 500, message: 'Failed to queue deep scan tasks' };
        }
    }
});


