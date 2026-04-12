import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
        return new Response('Missing chapterId', { status: 400 });
    }

    try {
        const res = await query(`
            SELECT c.id, c.chapter_id, c.user_name, c.content, c.parent_id, c.likes, c.created_at,
                   u.xp as user_xp, u.role as user_role
            FROM Comments c
            LEFT JOIN Users u ON c.user_uuid = u.uuid
            WHERE c.chapter_id = @chapterId 
            ORDER BY c.created_at DESC
        `, { chapterId });
        return Response.json(res.recordset);
    } catch (err) {
        return new Response('Database error', { status: 500 });
    }
}
export async function PATCH(request) {
    try {
        const session = await getSession();
        if (!session) return new Response('Vui lòng đăng nhập để thích bình luận.', { status: 401 });

        const body = await request.json();
        const { id, action } = body;

        if (action === 'like') {
            // OPTIONAL: Preventive measure against vote manipulation could go here
            await query("UPDATE Comments SET likes = likes + 1 WHERE id = @id", { id });
            return new Response('Liked', { status: 200 });
        }
        return new Response('Invalid action', { status: 400 });
    } catch (err) {
        return new Response('Database error', { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await getSession();
        if (!session) return new Response('Unauthorized', { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return new Response('Missing ID', { status: 400 });

        // Authenticate permission: Only owner or admin can delete
        const comment = await query("SELECT user_uuid FROM Comments WHERE id = @id", { id });
        if (comment.recordset.length === 0) return new Response('Bình luận không tồn tại', { status: 404 });

        const isOwner = comment.recordset[0].user_uuid === session.uuid;
        const isAdmin = session.role === 'admin';

        if (!isOwner && !isAdmin) {
            return new Response('Bạn không có quyền xóa bình luận này', { status: 403 });
        }

        await query("DELETE FROM Comments WHERE id = @id OR parent_id = @id", { id });
        return new Response('Đã xóa bình luận', { status: 200 });
    } catch (err) {
        console.error('Delete error', err);
        return new Response('Lỗi hệ thống khi xóa bình luận', { status: 500 });
    }
}


export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return new Response('Vui lòng đăng nhập để bình luận', { status: 401 });
        }

        const body = await request.json();
        const { chapterId, content, parentId } = body;

        if (!chapterId || !content) {
            return new Response('Missing fields', { status: 400 });
        }

        const userUuid = session.uuid;
        const userName = session.username || session.name || 'Đạo hữu ẩn danh';

        // --- RATE LIMITING (HARDENED) ---
        // Check if user recently commented (within 10 seconds) by UUID to prevent name-change bypass
        const recentCheck = await query(`
            SELECT TOP 1 created_at FROM Comments 
            WHERE user_uuid = @userUuid 
            AND created_at > DATEADD(second, -10, GETDATE())
        `, { userUuid });

        if (recentCheck.recordset.length > 0) {
            return new Response('Yêu cầu bình luận quá nhanh. Vui lòng đợi 10 giây.', { status: 429 });
        }

        await query(`
            INSERT INTO Comments (chapter_id, user_name, content, parent_id, user_uuid)
            VALUES (@chapterId, @userName, @content, @parentId, @userUuid)
        `, { chapterId, userName, content, parentId, userUuid });

        return new Response('Bình luận thành công!', { status: 201 });
    } catch (err) {
        console.error('[Comments API] Add error:', err.message);
        return new Response('Lỗi hệ thống khi gửi bình luận', { status: 500 });
    }
}
