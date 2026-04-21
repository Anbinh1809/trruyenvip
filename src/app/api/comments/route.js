import { query, checkRateLimit, withTransaction } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const GET = withTitan({
    handler: async (req) => {
        const { searchParams } = new URL(req.url);
        const chapterId = searchParams.get('chapterId');
        const userUuid = searchParams.get('userUuid') || '';

        if (!chapterId) {
            throw { status: 400, message: 'Missing chapterId' };
        }

        const res = await query(`
            SELECT c.id, c.chapter_id, c.user_name, c.content, c.parent_id, c.likes, c.created_at,
                   u.xp as user_xp, u.role as user_role, c.user_uuid,
                   (CASE WHEN cl.user_uuid IS NOT NULL THEN 1 ELSE 0 END) as has_liked
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
 * TITAN XSS SHIELD: Encodes HTML characters to prevent script injection.
 */
function sanitizeContent(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .trim();
}

export const POST = withTitan({
    auth: true,
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

        const limiter = await checkRateLimit(`comment_${userUuid}`, 2, 30);
        if (!limiter.success) {
            throw { status: 429, message: 'Yêu cầu bình luận quá nhanh. Vui lòng đợi thêm giây lát.' };
        }

        await query(`
            INSERT INTO comments (chapter_id, user_name, content, parent_id, user_uuid)
            VALUES (@chapterId, @userName, @content, @parentId, @userUuid)
        `, { chapterId, userName, content: sanitized, parentId, userUuid });

        return { success: true, message: 'Bình luận thành công!' };
    }
});

export const PATCH = withTitan({
    auth: true,
    handler: async (req, session) => {
        const { id, action } = await req.json();
        const userUuid = session.uuid;

        if (action === 'like') {
            try {
                // Fix #15: Wrap in transaction so INSERT and UPDATE are atomic
                await withTransaction(async (tx) => {
                    await query(`
                        INSERT INTO comment_likes (user_uuid, comment_id)
                        VALUES (@userUuid, @id)
                    `, { userUuid, id }, tx);

                    await query(`UPDATE comments SET likes = likes + 1 WHERE id = @id`, { id }, tx);
                });
                return { success: true };
            } catch (e) {
                return { success: false, message: 'Bạn đã thích bình luận này rồi.' };
            }
        }
        
        throw { status: 400, message: 'Invalid action' };
    }
});

export const DELETE = withTitan({
    auth: true,
    handler: async (req, session) => {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) throw { status: 400, message: 'Missing ID' };

        const comment = await query(`SELECT user_uuid FROM comments WHERE id = @id`, { id });
        if (!comment.recordset?.length) throw { status: 404, message: 'Bình luận không tồn tại' };

        const isOwner = comment.recordset?.[0]?.user_uuid === session.uuid;
        const isAdmin = session.role === 'admin';

        if (!isOwner && !isAdmin) {
            throw { status: 403, message: 'Bạn không có quyền xóa bình luận này' };
        }

        await query(`DELETE FROM comment_likes WHERE comment_id = @id`, { id });
        await query(`DELETE FROM comments WHERE id = @id OR parent_id = @id`, { id });
        return { success: true, message: 'Đã xóa bình luận' };
    }
});
