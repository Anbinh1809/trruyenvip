import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req) {
    try {
        const session = await getSession();
        if (session?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        const reports = await query(`
            SELECT gr.*, m.title as manga_name, m.cover, c.retry_count
            FROM GuardianReports gr
            JOIN Manga m ON gr.manga_id = m.id
            LEFT JOIN Chapters c ON gr.chapter_title = c.title AND gr.manga_id = c.manga_id
            ORDER BY gr.created_at DESC
            LIMIT @limit
        `, { limit });

        // Get daily metrics
        const metrics = await query(`
            SELECT 
                COUNT(*) as total_fixes,
                SUM(CASE WHEN event_type = 'FIX_GAP' THEN 1 ELSE 0 END) as gaps_filled,
                SUM(CASE WHEN event_type = 'FIX_IMAGE' THEN 1 ELSE 0 END) as images_rescued
            FROM GuardianReports
            WHERE created_at > NOW() - INTERVAL '1 day'
        `);

        return NextResponse.json({
            success: true,
            reports: reports.recordset,
            metrics: metrics.recordset[0]
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
