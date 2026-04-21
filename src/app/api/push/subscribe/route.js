import { query, checkRateLimit } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

/**
 * Fix #3: Added auth + rate limit to prevent anonymous spam into pushsubscriptions.
 */
export const POST = withTitan({
    auth: true,
    handler: async (req, session) => {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

        // Rate limit: 20 subscriptions per minute per user
        const limiter = await checkRateLimit(`push_sub_${session.uuid}`, 20, 60);
        if (!limiter.success) {
            throw { status: 429, message: 'Quá nhiều yêu cầu đăng ký thông báo.' };
        }

        const body = await req.json();
        const { mangaId, subscription } = body;

        if (!mangaId || !subscription || !subscription.endpoint) {
            throw { status: 400, message: 'Missing mangaId or valid subscription' };
        }

        const { endpoint, keys } = subscription;
        const { p256dh, auth } = keys || {};

        if (!p256dh || !auth) {
            throw { status: 400, message: 'Invalid subscription keys' };
        }

        await query(`
            MERGE pushsubscriptions AS target
            USING (SELECT @mangaId AS t_manga_id, @endpoint AS t_endpoint) AS source
            ON target.manga_id = source.t_manga_id AND target.endpoint = source.t_endpoint
            WHEN MATCHED THEN UPDATE SET p256dh = @p256dh, auth = @auth
            WHEN NOT MATCHED THEN INSERT (manga_id, endpoint, p256dh, auth) 
            VALUES (@mangaId, @endpoint, @p256dh, @auth);
        `, { mangaId, endpoint, p256dh, auth });

        return { success: true, message: 'Subscribed successfully' };
    }
});
