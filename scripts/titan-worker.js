import 'dotenv/config';
import { runTitanWorker } from '../src/lib/crawler.js';

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

    while (Date.now() - start < WORKER_TIMEOUT_MS) {
        cycles++;
        console.log(`\n[Titan Worker] === Cycle ${cycles} | Elapsed: ${Math.floor((Date.now() - start) / 1000)}s ===`);
        try {
            await runTitanWorker();
        } catch (err) {
            console.error(`[Titan Worker] Cycle ${cycles} error:`, err.message);
        }
        // Small pause between cycles to avoid DB hammering
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log(`\n[Titan Worker] Session complete after ${cycles} cycles.`);
    process.exit(0);
}

main().catch(err => {
    console.error('[Titan Worker] Fatal error:', err);
    process.exit(1);
});
