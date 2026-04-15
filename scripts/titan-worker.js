import 'dotenv/config';
import { runTitanWorker } from '../src/lib/crawler/index.js';

const WORKER_TIMEOUT_MS = 4 * 60 * 1000; // 4 minutes (Ultra-Fast 5min Pulse)

async function main() {
    console.log('[Titan Worker] Starting autonomous crawl session...');
    console.log(`[Titan Worker] Maximum session duration: ${WORKER_TIMEOUT_MS / 60000} minutes.`);
    
    // SAFETY TIMER: Ensure graceful exit before GitHub Actions kills the process
    const safetyTimeout = setTimeout(() => {
        console.warn('[Titan Worker] SAFETY TIMEOUT REACHED. Triggering graceful shutdown...');
        // We allow 30 seconds for pending DB operations to finalize
        setTimeout(() => {
            console.log('[Titan Worker] Shutdown complete. Exiting.');
            process.exit(0);
        }, 30000);
    }, WORKER_TIMEOUT_MS - 30000);

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
        // Start the Unified Autonomous Engine
        // This will initialize the queue and start the Guardian Autopilot loop
        await runTitanWorker();
    } catch (err) {
        console.error('[Titan Worker] Fatal execution error:', err.message);
        process.exit(1);
    } finally {
        clearTimeout(safetyTimeout);
    }
}

main().catch(err => {
    console.error('[Titan Worker] Fatal error:', err);
    process.exit(1);
});
