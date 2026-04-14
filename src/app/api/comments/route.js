import { query } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';

export const GET = withTitan({
    handler: async (req) => {
        const { searchParams } = new URL(req.url);
        const chapterId = searchParams.get('chapterId');

        if (!chapterId) {
            throw { status: 400, message: 'Missing chapterId' };
        }

        const res = await query(`
            SELECT c.id, c.chapter_id, c.user_name, c.content, c.parent_id, c.likes, c.created_at,
                   u.xp as user_xp, u.role as user_role, c.user_uuid
            FROM comments c
            LEFT JOIN users u ON c.user_uuid = u.uuid
            WHERE c.chapter_id = @chapterId 
            ORDER BY c.created_at DESC
        `, { chapterId });
        
        return res.recordset || [];
    }
});

export const POST = withTitan({
    authenticated: true,
    handler: async (req, session) => {
        const body = await req.json();
        const { chapterId, content, parentId } = body;

        if (!chapterId || !content) {
            throw { status: 400, message: 'Missing fields' };
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
        `, { chapterId, userName, content, parentId, userUuid });

        return { success: true, message: 'Bình luận thành công!' };
    }
});

export const PATCH = withTitan({
    authenticated: true,
    handler: async (req, session) => {
        const { id, action } = await req.json();

        if (action === 'like') {
            // Basic throttling in HOF could be added, but here we keep simple update
            await query(`UPDATE comments SET likes = likes + 1 WHERE id = @id`, { id });
            return { success: true };
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
