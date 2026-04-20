import { query, checkRateLimit } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const POST = withTitan({
    auth: true,
    handler: async (req, session) => {
        try {
            const { commentId, reason } = await req.json();
            const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

            // 1. Rate Limit: 10 reports / 1 hour
            const limiter = await checkRateLimit(`report_${session.uuid || ip}`, 10, 3600);
            if (!limiter.success) {
                throw { status: 429, message: 'Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau.' };
            }

            if (!commentId || !reason) {
                throw { status: 400, message: 'Thiếu thông tin báo cáo' };
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
        } catch (e) {
            console.error('Report comment error:', e);
            throw e;
        }
    }
});
