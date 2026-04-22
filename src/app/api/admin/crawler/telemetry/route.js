import { withTitan } from '@/core/api/handler';
import { loadSystemState } from '@/core/database/connection';

export const GET = withTitan({
    admin: true,
    handler: async () => {
        // Access the global state managed by crawler.js
        const state = global.crawlerState || {
            status: 'idle',
            concurrencyLimit: 10, 
            activeWorkers: 0
        };

        const lastPulseAt = await loadSystemState('crawler_last_pulse_at');

        const memory = process.memoryUsage();
        const memoryMB = Math.round(memory.rss / 1024 / 1024);
        
        // Fetch task counts
        const { query } = await import('@/core/database/connection');
        const tasksRes = await query('SELECT status, COUNT(*) as cnt FROM crawlertasks GROUP BY status');
        const taskCounts = { processing: 0, pending: 0, completed: 0, failed: 0 };
        if (tasksRes.recordset) {
            tasksRes.recordset.forEach(row => {
                if (taskCounts[row.status] !== undefined) taskCounts[row.status] = row.cnt;
            });
        }

        return {
            success: true,
            ...state,
            lastPulseAt,
            ramUsage: memoryMB,
            memoryMB,
            taskCounts
        };
    }
});
