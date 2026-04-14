import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Maintenance tool to repair NULL 'chapter_number' values by parsing titles.
 * Usage: GET /api/admin/crawler/repair-chapter-numbers
 */
export async function GET() {
    try {
        console.log('[Maintenance] Starting Chapter Number Repair...');
        
        const chapters = await query(`
            SELECT id, title FROM "Chapters" 
            WHERE chapter_number IS NULL
        `);
        
        let repairedCount = 0;
        const numberRegex = /(\d+(\.\d+)?)/; // Match integers and decimals

        const tasks = chapters.recordset || [];
        for (const chap of tasks) {
            const match = chap.title.match(numberRegex);
            if (match) {
                const num = parseFloat(match[1]);
                await query('UPDATE "Chapters" SET chapter_number = @num WHERE id = @id', { num, id: chap.id });
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
