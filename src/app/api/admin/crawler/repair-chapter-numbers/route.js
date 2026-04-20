import { withTitan } from '@/core/api/handler';
import { query } from '@/core/database/connection';
import { parseChapterNumber } from '@/core/crawler';

/**
 * Maintenance tool to repair NULL 'chapter_number' values by parsing titles.
 * Usage: GET /api/admin/crawler/repair-chapter-numbers
 * FIX #8: Added auth guard — previously anyone could call this endpoint.
 */
export const GET = withTitan({
    admin: true,
    handler: async () => {
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

        return {
            status: 'success',
            repairedChapters: repairedCount,
            totalChecked: chapters.recordset?.length || 0,
            message: `Successfully repaired ${repairedCount} chapter numbers from titles.`
        };
    }
});
