import { withTitan } from '@/core/api/handler';
import { query } from '@/core/database/connection';
import { SOURCES } from '@/core/crawler/mirrors';

/**
 * Maintenance tool to repair 404/Relative links in the database.
 * Usage: GET /api/admin/crawler/repair-links
 */
export const GET = withTitan({
    admin: true,
    handler: async () => {
        const relativeChapters = await query(`
            SELECT id, source_url FROM chapters 
            WHERE source_url LIKE '/%'
        `);
        
        let repairedCount = 0;
        const taskRows = relativeChapters.recordset || [];
        for (const chap of taskRows) {
            if (!chap.source_url) continue;
            let newUrl = '';
            if (chap.source_url?.includes('chap')) {
                newUrl = SOURCES.TRUYENQQ + (chap.source_url.startsWith('/') ? '' : '/') + chap.source_url;
            } else {
                newUrl = SOURCES.NETTRUYEN + (chap.source_url.startsWith('/') ? '' : '/') + chap.source_url;
            }
            await query('UPDATE chapters SET source_url = @newUrl WHERE id = @id', { newUrl, id: chap.id });
            repairedCount++;
        }

        // 2. Clear images for 404 logs so they can be re-crawled with fixed links
        // (Simplified: Just delete logs and let the scheduler retry)
        await query('DELETE FROM crawllogs WHERE status = \'error\'');

        return {
            status: 'success',
            repairedChapters: repairedCount,
            message: `Repaired ${repairedCount} relative URLs and cleared error logs for retry.`
        };
    }
});


