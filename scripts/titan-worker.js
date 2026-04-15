import 'dotenv/config';
import { runTitanWorker } from '../src/lib/crawler/index.js';

const WORKER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (Allowing more time for pulse completion)

async function main() {
    console.log('[Titan Worker] Starting autonomous crawl pulse...');
    
    // SAFETY TIMER: Ensure graceful exit if the pulse hangs
    const safetyTimeout = setTimeout(() => {
        console.warn('[Titan Worker] PULSE TIMEOUT. Forcing exit...');
        process.exit(0);
    }, WORKER_TIMEOUT_MS);

    // --- PRE-FLIGHT CHECK ---
    try {
        const { query } = await import('../src/lib/db.js');
        await query('SELECT 1');
        console.log('[Titan Worker] Database connection verified.');
    } catch (err) {
        console.error('[Titan Worker] Pre-flight DB check failed:', err.message);
        process.exit(1);
    }

    try {
        // Start the Unified Autonomous Engine in ONE-SHOT PULSE MODE
        // This will process one round of discovery and rescue, then exit.
        await runTitanWorker(true);
        console.log('[Titan Worker] Pulse finalized successfully.');
        process.exit(0);
    } catch (err) {
        console.error('[Titan Worker] Pulse execution error:', err.message);
        process.exit(1);
    } finally {
        clearTimeout(safetyTimeout);
    }
}

main().catch(err => {
    console.error('[Titan Worker] Fatal error:', err);
    process.exit(1);
});
