import { query } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';

export const GET = withTitan({
    handler: async (req) => {
        const { searchParams } = new URL(req.url);
        const chapterId = searchParams.get('chapterId');
        const userUuid = searchParams.get('userUuid') || ''; // For highlighting own likes

        if (!chapterId) {
            throw { status: 400, message: 'Missing chapterId' };
        }

        const res = await query(`
            SELECT c.id, c.chapter_id, c.user_name, c.content, c.parent_id, c.likes, c.created_at,
                   u.xp as user_xp, u.role as user_role, c.user_uuid,
                   (CASE WHEN cl.user_uuid IS NOT NULL THEN TRUE ELSE FALSE END) as has_liked
            FROM comments c
            LEFT JOIN users u ON c.user_uuid = u.uuid
            LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_uuid = @userUuid
            WHERE c.chapter_id = @chapterId 
            ORDER BY c.created_at DESC
        `, { chapterId, userUuid });
        
        return res.recordset || [];
    }
});

/**
 * Basic HTML/XSS Sanitizer
 */
function sanitizeContent(text) {
    if (!text) return '';
    return text
        .replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, '')
        .replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gim, '')
        .trim();
}

export const POST = withTitan({
    authenticated: true,
    handler: async (req, session) => {
        const body = await req.json();
        const { chapterId, content, parentId } = body;

        if (!chapterId || !content) {
            throw { status: 400, message: 'Missing fields' };
        }

        const sanitized = sanitizeContent(content);
        if (sanitized.length < 2) {
            throw { status: 400, message: 'Nội dung bình luận quá ngắn hoặc không hợp lệ.' };
        }

        const userUuid = session.uuid;
        const userName = session.username || 'Khách ẩn danh';

        // RATE LIMIT: 10s between comments
        const recentCheck = await query(`
            SELECT created_at FROM comments 
            WHERE user_uuid = @userUuid 
            AND created_at > NOW() - INTERVAL '10 seconds'
            LIMIT 1
        `, { userUuid });

        if (recentCheck.recordset?.length > 0) {
            throw { status: 429, message: 'Yêu cầu bình luận quá nhanh. Vui lòng đợi 10 giây.' };
        }

        await query(`
            INSERT INTO comments (chapter_id, user_name, content, parent_id, user_uuid)
            VALUES (@chapterId, @userName, @content, @parentId, @userUuid)
        `, { chapterId, userName, content: sanitized, parentId, userUuid });

        return { success: true, message: 'Bình luận thành công!' };
    }
});

export const PATCH = withTitan({
    authenticated: true,
    handler: async (req, session) => {
        const { id, action } = await req.json();
        const userUuid = session.uuid;

        if (action === 'like') {
            try {
                // PERSISTENT LIKE: Insert into pivot table, then increment counter
                await query(`
                    INSERT INTO comment_likes (user_uuid, comment_id)
                    VALUES (@userUuid, @id)
                `, { userUuid, id });

                await query(`UPDATE comments SET likes = likes + 1 WHERE id = @id`, { id });
                return { success: true };
            } catch (e) {
                // If unique constraint fails, they already liked it
                return { success: false, message: 'Bạn đã thích bình luận này rồi.' };
            }
        }
        
        throw { status: 400, message: 'Invalid action' };
    }
});

export const DELETE = withTitan({
    authenticated: true,
    handler: async (req, session) => {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw { status: 400, message: 'Missing ID' };

        // Permission check
        const comment = await query(`SELECT user_uuid FROM comments WHERE id = @id`, { id });
        if (!comment.recordset?.length) throw { status: 404, message: 'Bình luận không tồn tại' };

        const isOwner = comment.recordset[0].user_uuid === session.uuid;
        const isAdmin = session.role === 'admin';

        if (!isOwner && !isAdmin) {
            throw { status: 403, message: 'Bạn không có quyền xóa bình luận này' };
        }

        await query(`DELETE FROM comments WHERE id = @id OR parent_id = @id`, { id });
        return { success: true, message: 'Đã xóa bình luận' };
    }
});
