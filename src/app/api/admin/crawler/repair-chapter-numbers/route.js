import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseChapterNumber } from '@/lib/crawler';

/**
 * Maintenance tool to repair NULL 'chapter_number' values by parsing titles.
 * Usage: GET /api/admin/crawler/repair-chapter-numbers
 */
export async function GET() {
    try {
        console.log('[Maintenance] Starting Chapter Number Repair...');
        
        const chapters = await query(`
            SELECT id, title FROM chapters 
            WHERE chapter_number IS NULL
        `);
        
        let repairedCount = 0;

        const tasks = chapters.recordset || [];
        for (const chap of tasks) {
            const num = parseChapterNumber(chap.title);
            if (num !== null) {
                await query('UPDATE chapters SET chapter_number = @num WHERE id = @id', { num, id: chap.id });
                repairedCount++;
            }
        }

        return NextResponse.json({
            status: 'success',
            repairedChapters: repairedCount,
            totalChecked: chapters.recordset?.length || 0,
            message: `Successfully repaired ${repairedCount} chapter numbers from titles.`
        });
    } catch (e) {
        console.error('[Repair] Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
