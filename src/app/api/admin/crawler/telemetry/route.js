import { withTitan } from '@/core/api/handler';
import { loadSystemState } from '@/core/database/connection';

export const GET = withTitan({
    admin: true,
    handler: async () => {
        // Access the global state managed by crawler.js
        const state = global.crawlerState || {
            status: 'idle',
            concurrencyLimit: 3, // FIX #4: BASE_CONCURRENCY=3 (from engine.js)
            activeWorkers: 0
        };

        const lastPulseAt = await loadSystemState('crawler_last_pulse_at');

        const memory = process.memoryUsage();
        const memoryMB = Math.round(memory.rss / 1024 / 1024);

        return {
            success: true,
            ...state,
            lastPulseAt,
            ramUsage: memoryMB,
            memoryMB
        };
    }
});
