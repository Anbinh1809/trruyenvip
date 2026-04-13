import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return new Response('Unauthorized', { status: 401 });
        }

        // TITAN CACHE: 5-minute statistical caching
        if (global.adminStatsCache && Date.now() - global.adminStatsCache.time < 300000) {
            return Response.json(global.adminStatsCache.data);
        }

        const statsRes = await query(`
            SELECT 
                (SELECT COUNT(*) FROM Users) as "totalUsers",
                (SELECT COUNT(*) FROM Manga) as "totalManga",
                (SELECT COUNT(*) FROM Chapters) as "totalChapters",
                (SELECT COUNT(*) FROM RedemptionRequests WHERE status = 'Pending') as "pendingRewards",
                (SELECT COUNT(*) FROM CrawlerTasks WHERE status = 'pending') as "taskPending",
                (SELECT COUNT(*) FROM CrawlerTasks WHERE status = 'failed') as "taskFailed",
                (SELECT COUNT(*) FROM Chapters WHERE created_at > NOW() - INTERVAL '1 hour') as "syncsLastHour",
                (SELECT created_at FROM CrawlLogs ORDER BY created_at DESC LIMIT 1) as "lastCrawl"
        `);
 
        const recentFailures = await query(`
            SELECT id, type, last_error 
            FROM CrawlerTasks 
            WHERE status = 'failed' 
            ORDER BY updated_at DESC 
            LIMIT 5
        `);
 
        const heatmap = await query(`
            SELECT SUBSTRING(last_error, 1, 50) as signature, COUNT(*) as count
            FROM CrawlerTasks
            WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '24 hours'
            GROUP BY signature
            ORDER BY count DESC
            LIMIT 5
        `);
 
        const data = {
            ...statsRes.recordset[0],
            recentFailures: recentFailures.recordset,
            heatmap: heatmap.recordset
        };
        global.adminStatsCache = { data, time: Date.now() };

        return Response.json(data);
    } catch (err) {
        console.error('Admin Stats Error:', err);
        return Response.json({ error: 'Error fetching stats', details: err.message }, { status: 500 });
    }
}
