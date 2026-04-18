import { query, checkRateLimit } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

export const PATCH = withTitan({
    auth: true,
    handler: async (request, session) => {
        const body = await request.json();
        const { avatar } = body;

        // Validation: Simple URL check or length limit
        if (avatar && avatar.length > 500) {
            throw { status: 400, message: 'URL too long' };
        }

        // TITAN RATE LIMIT: Prevent profile spamming
        const limiter = await checkRateLimit(`profile_${session.uuid}`, 2, 60); // 2 updates / minute
        if (!limiter.success) {
            throw { status: 429, message: 'B?n đang c?p nh?t qu� nhanh. Vui l�ng đo�i 1 ph�t.' };
        }

        await query('UPDATE users SET avatar = @avatar WHERE uuid = @uuid', { 
            avatar: avatar || null, 
            uuid: session.uuid 
        });

        return { success: true, message: 'Profile updated' };
    }
});

