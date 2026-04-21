import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const GET = withTitan({
    admin: true,
    handler: async () => {
        // NOTE: Fix #13 - Removed `global.adminStatsCache` — unreliable on Serverless/Vercel.
        // Stats are lightweight enough for direct DB fetch with Next.js ISR if needed.
        try {
            // TITAN ROBUSTNESS: Verify table exists before querying to avoid 500s
            const tablesRes = await query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE LOWER(table_name) IN ('users', 'redemptionrequests')
            `);
            const existingTables = (tablesRes.recordset || []).map(t => (t.table_name || t.TABLE_NAME || '').toLowerCase());
            const hasUsers = existingTables.includes('users');
            const hasRewards = existingTables.includes('redemptionrequests');

            const statsRes = await query(`
                SELECT 
                    (SELECT COUNT(*) FROM ${hasUsers ? 'users' : 'profiles'}) as "totalUsers",
                    (SELECT COUNT(*) FROM manga) as "totalManga",
                    (SELECT COUNT(*) FROM chapters) as "totalChapters",
                    (SELECT COUNT(*) FROM ${hasRewards ? 'redemptionrequests' : 'crawlertasks WHERE 1=0'}) as "pendingRewards",
                    (SELECT COUNT(*) FROM crawlertasks WHERE status = 'pending') as "taskPending",
                    (SELECT COUNT(*) FROM crawlertasks WHERE status = 'failed') as "taskFailed",
                    (SELECT COUNT(*) FROM chapters WHERE updated_at > DATEADD(hour, -1, GETDATE())) as "syncsLastHour",
                    COALESCE((SELECT MAX(created_at) FROM crawllogs), GETDATE()) as "lastCrawl"
            `);
    
            const recentFailures = await query(`
                SELECT TOP(5) id, type, LEFT(last_error, 100) as "last_error"
                FROM crawlertasks 
                WHERE status = 'failed' 
                ORDER BY updated_at DESC 
            `);
    
            const heatmap = await query(`
                SELECT TOP(5) LEFT(last_error, 50) as "signature", COUNT(*) as "count"
                FROM crawlertasks
                WHERE status = 'failed' AND updated_at > DATEADD(hour, -24, GETDATE())
                GROUP BY LEFT(last_error, 50)
                ORDER BY "count" DESC
            `);
    
            // Key Normalizer: Handles Postgres lowercase response keys
            const row = statsRes.recordset?.[0] || {};
            const normalize = (key) => row[key] ?? row[key.toLowerCase()] ?? 0;

            const baseStats = {
                totalUsers: normalize('totalUsers'),
                totalManga: normalize('totalManga'),
                totalChapters: normalize('totalChapters'),
                pendingRewards: normalize('pendingRewards'),
                taskPending: normalize('taskPending'),
                taskFailed: normalize('taskFailed'),
                syncsLastHour: normalize('syncsLastHour'),
                lastCrawl: row.lastCrawl || row.lastcrawl || new Date().toISOString()
            };
    
            const data = {
                ...baseStats,
                failures: recentFailures.recordset || [],
                heatmap: heatmap.recordset || [],
                serverTime: new Date().toISOString()
            };
            
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


