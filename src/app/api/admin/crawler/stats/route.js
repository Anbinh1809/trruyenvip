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
        const limit = parseInt(searchParams.get('limit') || '50');

        // 1. Get Latest Logs
        const logs = await query(`
            SELECT TOP (@limit) id, message, status, created_at 
            FROM CrawlLogs 
            ORDER BY created_at DESC
        `, { limit });

        // 2. Get Today's Summary
        const summary = await query(`
            SELECT 
                COUNT(*) as total_logs,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_logs,
                SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_logs
            FROM CrawlLogs
            WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
        `);

        // 3. Get Manga Stats
        const counts = await query(`
            SELECT 
                (SELECT COUNT(*) FROM Manga) as total_manga,
                (SELECT COUNT(*) FROM Chapters) as total_chapters,
                (SELECT COUNT(*) FROM CrawlLogs WHERE status = 'error') as total_reports
        `);

        // Only expose true NetTruyen mirrors, not polluted individual chapter URLs
        const cleanMirrorHealth = Object.fromEntries(
            Object.entries(global.mirrorScores || {}).filter(([url]) => 
                url.includes('nettruyen') && !url.includes('/truyen-tranh/')
            )
        );

        return NextResponse.json({
            success: true,
            logs: logs.recordset,
            summary: summary.recordset[0],
            counts: counts.recordset[0],
            mirrorHealth: cleanMirrorHealth
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
