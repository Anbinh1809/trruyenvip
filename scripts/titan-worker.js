import 'dotenv/config';
import { runTitanWorker } from '../src/core/crawler/index.js';

// BUDGET MODE:
// - light: 4 min timeout — chỉ cào truyện mới nhất (latest)
// - deep:  8 min timeout — cào sâu + vá lỗ hổng chương + rescue ảnh hỏng
const MODE = process.env.TITAN_MODE || 'light';
const TIMEOUT_MS = MODE === 'deep' ? 8 * 60 * 1000 : 4 * 60 * 1000;

if (!process.env.DATABASE_URL) {
    console.error('[Worker] FATAL: DATABASE_URL missing. Check GitHub Secrets.');
    process.exit(1);
}

console.log(`[Worker] Mode: ${MODE.toUpperCase()} | Timeout: ${TIMEOUT_MS / 60000} min`);

const safetyTimer = setTimeout(() => {
    console.warn('[Worker] Timeout reached. Forcing exit.');
    process.exit(0);
}, TIMEOUT_MS);

async function main() {
    try {
        console.log('[Worker] Pulse started.');
        await runTitanWorker(true, MODE);
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
