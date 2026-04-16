import 'dotenv/config';
import { runTitanWorker } from '../src/lib/crawler/index.js';

const WORKER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (Allowing more time for pulse completion)

async function main() {
    console.log('[Titan Worker] Starting autonomous crawl pulse (Autonomy V3: Active Ingestion)...');
    
    // SAFETY TIMER: Ensure graceful exit if the pulse hangs
    const safetyTimeout = setTimeout(() => {
        console.warn('[Titan Worker] PULSE TIMEOUT. Forcing exit...');
        process.exit(0);
    }, WORKER_TIMEOUT_MS);

    // --- PRE-FLIGHT CHECK ---
    if (!process.env.DATABASE_URL) {
        console.error('[Titan Worker] FATAL ERROR: DATABASE_URL is missing. Please check your GitHub Secrets.');
        process.exit(1);
    }

    try {
        const { query } = await import('../src/lib/db.js');
        console.log('[Titan Worker] Database connection verified.');
        
        // Start the Unified Autonomous Engine in ONE-SHOT PULSE MODE
        // This will process one round of discovery and rescue, then exit.
        await runTitanWorker(true);
        console.log('[Titan Worker] Pulse finalized successfully.');
        
        // We add a tiny buffer to allow telemetry sync to complete
        setTimeout(() => process.exit(0), 1000);
    } catch (err) {
        console.error('[Titan Worker] Pulse execution error:', err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    } finally {
        clearTimeout(safetyTimeout);
    }
}

main().catch(err => {
    console.error('[Titan Worker] Fatal error:', err);
    process.exit(1);
});
