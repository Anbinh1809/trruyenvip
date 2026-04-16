import { query } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';

export const POST = withTitan({
    auth: true,
    handler: async (req, session) => {
        const { commentId, reason } = await req.json();

        if (!commentId || !reason) {
            throw { status: 400, message: 'Missing fields' };
        }

        const userUuid = session.uuid;

        // Prevent duplicate reporting by same user
        const check = await query(`
            SELECT id FROM comment_reports 
            WHERE user_uuid = @userUuid AND comment_id = @commentId
        `, { userUuid, commentId });

        if (check.recordset?.length > 0) {
            return { success: true, message: 'Bạn đã báo cáo bình luận này rồi.' };
        }

        await query(`
            INSERT INTO comment_reports (user_uuid, comment_id, reason)
            VALUES (@userUuid, @commentId, @reason)
        `, { userUuid, commentId, reason });

        return { success: true, message: 'Đã gửi báo cáo. Chúng tôi sẽ xử lý sớm nhất có thể.' };
    }
});
