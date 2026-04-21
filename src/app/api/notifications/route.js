import { query } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

/**
 * GET: Retrieve user notifications
 * Hardened: Wrapped in withTitan for secure headers and atomic error handling.
 */
export const GET = withTitan({
    auth: true,
    handler: async (req, session) => {
        try {
            const res = await query(`
                SELECT TOP(20) n.*, m.cover 
                FROM notifications n
                LEFT JOIN manga m ON n.manga_id = m.id
                WHERE n.user_uuid = @uuid
                ORDER BY n.created_at DESC
            `, { uuid: session.uuid });

            return res.recordset || [];
        } catch (e) {
            console.error('Notifications GET error:', e);
            throw e;
        }
    }
});
/**
 * PATCH: Mark notifications as read
 */
export const PATCH = withTitan({
    auth: true,
    handler: async (req, session) => {
        try {
            const { id, all } = await req.json();

            if (all) {
                await query('UPDATE notifications SET is_read = 1 WHERE user_uuid = @uuid', { uuid: session.uuid });
            } else if (id) {
                await query('UPDATE notifications SET is_read = 1 WHERE id = @id AND user_uuid = @uuid', { id, uuid: session.uuid });
            }

            return { success: true };
        } catch (e) {
            console.error('Notifications PATCH error:', e);
            throw e;
        }
    }
});