import 'dotenv/config';
import { runTitanWorker } from '../src/core/crawler/index.js';

const TIMEOUT_MS = 20 * 60 * 1000; // 20 min safety valve

if (!process.env.DATABASE_URL) {
    console.error('[Worker] FATAL: DATABASE_URL missing. Check GitHub Secrets.');
    process.exit(1);
}

const safetyTimer = setTimeout(() => {
    console.warn('[Worker] Timeout reached. Forcing exit.');
    process.exit(0);
}, TIMEOUT_MS);

async function main() {
    try {
        console.log('[Worker] Pulse started.');
        await runTitanWorker(true);
        console.log('[Worker] Pulse complete.');
        setTimeout(() => process.exit(0), 1000);
    } catch (err) {
        // ALL_MIRRORS_FAILED = expected when source sites are unreachable from GitHub runners
        if (err.message?.includes('ALL_MIRRORS_FAILED') || err.message?.includes('ECONNREFUSED') || err.message?.includes('timeout')) {
            console.warn('[Worker] Mirror unreachable (expected in CI). No DB changes made. Exiting cleanly.');
            process.exit(0);
        }
        console.error('[Worker] Fatal error:', err.message);
        process.exit(1);
    } finally {
        clearTimeout(safetyTimer);
    }
}

main();
