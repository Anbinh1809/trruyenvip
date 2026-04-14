import { query } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';

export const GET = withTitan({
    admin: true,
    handler: async () => {
        // TITAN CACHE: 5-minute statistical caching
        if (global.adminStatsCache && Date.now() - global.adminStatsCache.time < 300000) {
            return global.adminStatsCache.data;
        }

        try {
            const statsRes = await query(`
                SELECT 
                    (SELECT COUNT(*) FROM users) as "totalUsers",
                    (SELECT COUNT(*) FROM manga) as "totalManga",
                    (SELECT COUNT(*) FROM chapters) as "totalChapters",
                    (SELECT COUNT(*) FROM redemptionrequests WHERE status = 'pending') as "pendingRewards",
                    (SELECT COUNT(*) FROM crawlertasks WHERE status = 'pending') as "taskPending",
                    (SELECT COUNT(*) FROM crawlertasks WHERE status = 'failed') as "taskFailed",
                    (SELECT COUNT(*) FROM chapters WHERE updated_at > NOW() - INTERVAL '1 hour') as "syncsLastHour",
                    COALESCE((SELECT MAX(created_at) FROM crawllogs), NOW()) as "lastCrawl"
            `);
    
            const recentFailures = await query(`
                SELECT id, type, LEFT(last_error, 100) as last_error 
                FROM crawlertasks 
                WHERE status = 'failed' 
                ORDER BY updated_at DESC 
                LIMIT 5
            `);
    
            const heatmap = await query(`
                SELECT LEFT(last_error, 50) as signature, COUNT(*) as count
                FROM crawlertasks
                WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '24 hours'
                GROUP BY signature
                ORDER BY count DESC
                LIMIT 5
            `);
    
            const baseStats = statsRes.recordset?.[0] || {
                totalUsers: 0, totalManga: 0, totalChapters: 0, pendingRewards: 0,
                taskPending: 0, taskFailed: 0, syncsLastHour: 0, lastCrawl: new Date().toISOString()
            };
    
            const data = {
                ...baseStats,
                failures: recentFailures.recordset || [],
                heatmap: heatmap.recordset || [],
                serverTime: new Date().toISOString()
            };
            
            global.adminStatsCache = { data, time: Date.now() };
            return data;
        } catch (err) {
            console.error('[STATS_API_ERROR]', err);
            // Fallback to minimal data instead of 500
            return {
                totalUsers: 0, totalManga: 0, totalChapters: 0, pendingRewards: 0,
                taskPending: 0, taskFailed: 0, syncsLastHour: 0,
                failures: [], heatmap: [], error: err.message
            };
        }
    }
});

