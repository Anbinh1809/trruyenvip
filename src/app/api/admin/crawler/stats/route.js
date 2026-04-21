import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const GET = withTitan({
    admin: true,
    handler: async (req) => {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // 1. Get Latest Logs
        const logs = await query(`
            SELECT TOP(@limit) id, message, status, created_at 
            FROM crawllogs 
            ORDER BY created_at DESC
            
        `, { limit });

        // 2. Get Today's Summary
        const summaryArr = await query(`
            SELECT 
                COUNT(*) as total_logs,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_logs,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_logs,
                (SELECT COUNT(*) FROM chapterimages WHERE created_at >= CAST(GETDATE() AS DATE)) as total_images_today
            FROM crawllogs
            WHERE created_at >= CAST(GETDATE() AS DATE)
        `);

        // 3. Get Manga Stats
        const countsArr = await query(`
            SELECT 
                (SELECT COUNT(*) FROM manga) as total_manga,
                (SELECT COUNT(*) FROM chapters) as total_chapters,
                (SELECT COUNT(*) FROM crawllogs WHERE status = 'error') as total_reports
        `);

        // Only expose true NetTruyen mirrors, not polluted individual chapter URLs
        const cleanMirrorHealth = Object.fromEntries(
            Object.entries(global.mirrorScores || {}).filter(([url]) => 
                url.includes('nettruyen') && !url.includes('/truyen-tranh/')
            )
        );

        return {
            success: true,
            logs: logs.recordset || [],
            summary: summaryArr.recordset?.[0] || { total_logs: 0, success_logs: 0, error_logs: 0 },
            counts: countsArr.recordset?.[0] || { total_manga: 0, total_chapters: 0, total_reports: 0 },
            mirrorHealth: cleanMirrorHealth
        };
    }
});
