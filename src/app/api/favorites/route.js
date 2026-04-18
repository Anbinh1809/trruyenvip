import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

/**
 * GET: Retrieve user favorites
 */
export const GET = withTitan({
    auth: true,
    handler: async (req, session) => {
        try {
            const results = await query(`
                SELECT m.id, m.title, m.cover,
                       (SELECT MAX(chapter_number) FROM chapters WHERE manga_id = m.id) as latest_chapter_number
                FROM favorites f
                JOIN manga m ON f.manga_id = m.id
                WHERE f.user_uuid = @uuid
                ORDER BY f.created_at DESC
            `, { uuid: session.uuid });

            return results.recordset || [];
        } catch (e) {
            console.error('Favorites GET error:', e);
            throw e;
        }
    }
});

/**
 * POST: Toggle favorite status
 */
export const POST = withTitan({
    auth: true,
    handler: async (req, session) => {
        try {
            const { mangaId } = await req.json();
            
            // Toggle logic
            const exists = await query(`
                SELECT id FROM favorites 
                WHERE user_uuid = @uuid 
                AND manga_id = @mangaId
            `, { uuid: session.uuid, mangaId });

            if (exists.recordset && exists.recordset.length > 0) {
                await query(`
                    DELETE FROM favorites 
                    WHERE user_uuid = @uuid 
                    AND manga_id = @mangaId
                `, { uuid: session.uuid, mangaId });
                return { message: 'Removed', status: 'removed' };
            } else {
                await query(`
                    INSERT INTO favorites (user_uuid, manga_id) 
                    VALUES (@uuid, @mangaId)
                `, { uuid: session.uuid, mangaId });
                return { message: 'Added', status: 'added' };
            }
        } catch (e) {
            console.error('Favorites POST error:', e);
            throw e;
        }
    }
});

