import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const GET = withTitan({
    admin: true,
    handler: async (req) => {
        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

        const reports = await query(`
            SELECT TOP(@limit) gr.*
            FROM guardianreports gr
            ORDER BY gr.created_at DESC
        `, { limit });

        // Get daily metrics
        const metricsArr = await query(`
            SELECT 
                COUNT(*) as total_fixes,
                SUM(CASE WHEN event_type = 'FIX_GAP' THEN 1 ELSE 0 END) as gaps_filled,
                SUM(CASE WHEN event_type = 'FIX_IMAGE' THEN 1 ELSE 0 END) as images_rescued
            FROM guardianreports
            WHERE created_at > DATEADD(day, -1, GETDATE())
        `);

        return {
            success: true,
            reports: reports.recordset || [],
            metrics: metricsArr.recordset?.[0] || { total_fixes: 0, gaps_filled: 0, images_rescued: 0 }
        };
    }
});
