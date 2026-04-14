import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * Maintenance tool to repair 404/Relative links in the database.
 * Usage: GET /api/admin/crawler/repair-links
 */
export async function GET() {
    try {
        const session = await getSession();
        if (session?.role !== 'admin') {
            return new Response('Unauthorized', { status: 401 });
        }
        
        console.log('[Maintenance] Starting Link Repair Process...');
        
        // 1. Repair relative Chapter URLs
        const relativeChapters = await query(`
            SELECT id, source_url FROM chapters 
            WHERE source_url LIKE '/%'
        `);
        
        let repairedCount = 0;
        const taskRows = relativeChapters.recordset || [];
        for (const chap of taskRows) {
            let newUrl = '';
            // Majority of relative links are from TruyenQQ in this DB state
            if (chap.source_url.includes('chap')) {
                newUrl = 'https://truyenqqno.com' + chap.source_url;
            } else {
                newUrl = 'https://nettruyennew.com' + chap.source_url;
            }
            
            await query('UPDATE "Chapters" SET source_url = @newUrl WHERE id = @id', { newUrl, id: chap.id });
            repairedCount++;
        }

        // 2. Clear images for 404 logs so they can be re-crawled with fixed links
        // (Simplified: Just delete logs and let the scheduler retry)
        await query('DELETE FROM crawllogs WHERE status = \'error\'');

        return NextResponse.json({
            status: 'success',
            repairedChapters: repairedCount,
            message: `Repaired ${repairedCount} relative URLs and cleared error logs for retry.`
        });
    } catch (e) {
        console.error('[Repair] Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
