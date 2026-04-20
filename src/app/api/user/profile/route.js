import { query, checkRateLimit } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const PATCH = withTitan({
    auth: true,
    handler: async (request, session) => {
        try {
            const body = await request.json();
            const { avatar } = body;

            // Validation: Ensure valid HTTP/HTTPS URL only (prevent XSS/SSRF via javascript:/data: URIs)
            if (avatar) {
                if (avatar.length > 500) {
                    throw { status: 400, message: 'URL quá dài' };
                }
                try {
                    const parsed = new URL(avatar);
                    if (!['http:', 'https:'].includes(parsed.protocol)) {
                        throw new Error('invalid protocol');
                    }
                } catch {
                    throw { status: 400, message: 'URL avatar không hợp lệ (chỉ chấp nhận http/https)' };
                }
            }

            // TITAN RATE LIMIT: Prevent profile spamming
            const limiter = await checkRateLimit(`profile_${session.uuid}`, 2, 60); // 2 updates / minute
            if (!limiter.success) {
                throw { status: 429, message: 'Bạn đang cập nhật quá nhanh. Vui lòng đợi 1 phút.' };
            }

            await query('UPDATE users SET avatar = @avatar WHERE uuid = @uuid', { 
                avatar: avatar || null, 
                uuid: session.uuid 
            });

            return { success: true, message: 'Profile updated' };
        } catch (e) {
            console.error('Profile PATCH error:', e);
            throw e;
        }
    }
});
