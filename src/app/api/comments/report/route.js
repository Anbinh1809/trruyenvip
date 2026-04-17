import { query } from '@/HeThong/Database/CoSoDuLieu';
import { withTitan } from '@/HeThong/API/XuLyAPI';

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
            return { success: true, message: 'Bạn đã báo cáo bà¬nh luáº­n nà y rồni.' };
        }

        await query(`
            INSERT INTO comment_reports (user_uuid, comment_id, reason)
            VALUES (@userUuid, @commentId, @reason)
        `, { userUuid, commentId, reason });

        return { success: true, message: 'Äà£ gửi báo cáo. Chàºng tà´i sáº½ xử là½ so›m nháº¥t cà³ thoƒ.' };
    }
});

