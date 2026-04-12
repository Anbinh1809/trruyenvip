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

        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM Users) as totalUsers,
                (SELECT COUNT(*) FROM Manga) as totalManga,
                (SELECT COUNT(*) FROM Chapters) as totalChapters,
                (SELECT COUNT(*) FROM RedemptionRequests WHERE status = 'Pending') as pendingRewards,
                (SELECT COUNT(*) FROM CrawlerTasks WHERE status = 'pending') as taskPending,
                (SELECT COUNT(*) FROM CrawlerTasks WHERE status = 'failed') as taskFailed,
                (SELECT COUNT(*) FROM Chapters WHERE created_at > DATEADD(hour, -1, GETDATE())) as syncsLastHour,
                (SELECT COUNT(*) FROM CrawlerTasks WHERE status = 'completed' AND updated_at > DATEADD(hour, -1, GETDATE())) as tasksLastHour,
                (SELECT TOP 1 created_at FROM CrawlLogs ORDER BY created_at DESC) as lastCrawl
        `);

        const data = stats.recordset[0];
        global.adminStatsCache = { data, time: Date.now() };

        return Response.json(data);
    } catch (err) {
        console.error('Admin Stats Error:', err);
        return new Response('Error fetching stats', { status: 500 });
    }
}
