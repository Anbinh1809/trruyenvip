import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const GET = withTitan({
    admin: true,
    handler: async () => {
        const taskCounts = await query(`
            SELECT 
                status, 
                COUNT(*) as count
            FROM CrawlerTasks
            GROUP BY status
        `);

        // Get recent failures for diagnostics
        const recentFailures = await query(`
            SELECT id, type, last_error, attempts, updated_at
            FROM CrawlerTasks
            WHERE status = 'failed'
            ORDER BY updated_at DESC
            LIMIT 10
        `);

        // ERROR HEATmap: Group errors by signature
        const errorHeatmap = await query(`
            SELECT 
                LEFT(last_error, 50) as signature,
                COUNT(*) as count
            FROM CrawlerTasks
            WHERE status = 'failed'
            GROUP BY LEFT(last_error, 50)
            ORDER BY count DESC
            LIMIT 5
        `);

        return {
            counts: taskCounts.recordset,
            failures: recentFailures.recordset,
            heatmap: errorHeatmap.recordset
        };
    }
});

export const POST = withTitan({
    admin: true,
    handler: async (request, session) => {
        const { action } = await request.json();

        if (action === 'retry_failed') {
            await query("UPDATE crawlertasks SET status = 'pending', attempts = 0 WHERE status = 'failed'");
            await query("INSERT INTO crawllogs (message, status) VALUES (@msg, 'success')", { msg: `Admin ${session.uuid} triggered bulk retry for all failed tasks` });
            return { message: 'Retrying failed tasks' };
        }

        if (action === 'purge_completed') {
            await query("DELETE FROM crawlertasks WHERE status = 'completed'");
            await query("INSERT INTO crawllogs (message, status) VALUES (@msg, 'success')", { msg: `Admin ${session.uuid} purged all completed crawler task records` });
            return { message: 'Purged completed tasks' };
        }

        throw Object.assign(new Error('Invalid action'), { status: 400 });
    }
});
