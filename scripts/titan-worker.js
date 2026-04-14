import 'dotenv/config';
import { runTitanWorker } from '../src/lib/crawler/index.js';

const WORKER_TIMEOUT_MS = 14 * 60 * 1000; // 14 minutes (GitHub Actions has 6hr limit but Vercel free has 10s)

async function main() {
    console.log('[Titan Worker] Starting autonomous crawl session...');
    console.log(`[Titan Worker] Will run for ${WORKER_TIMEOUT_MS / 60000} minutes.`);
    
    const start = Date.now();
    let cycles = 0;

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
    }
}

main().catch(err => {
    console.error('[Titan Worker] Fatal error:', err);
    process.exit(1);
});
