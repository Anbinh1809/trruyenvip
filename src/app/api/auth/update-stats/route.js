import { query, checkRateLimit } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';

/**
 * Fix #5: Wrapped in withTitan for unified security headers.
 * Fix #6 (rate limit): same pattern used here for stats updates.
 * Replaces the old manual getSession() pattern.
 */
export const POST = withTitan({
    auth: true,
    handler: async (request, session) => {
        // 1. Robust body parsing (handles sendBeacon text/plain payloads)
        let body;
        try {
            body = await request.json();
        } catch {
            const text = await request.text();
            try {
                body = JSON.parse(text);
            } catch {
                throw { status: 400, message: 'Invalid payload format' };
            }
        }

        const { xpDelta, coinDelta, missionData } = body;
        const deltaXp = parseInt(xpDelta || 0);
        const deltaCoins = parseInt(coinDelta || 0);

        // Return early if no changes
        if (deltaXp === 0 && deltaCoins === 0 && !missionData) {
            return { success: true };
        }

        // Sanity check: Max 500 XP and 100 Coins per heartbeat
        if (deltaXp > 500 || deltaCoins > 100) {
            throw { status: 400, message: 'Dữ liệu bất thường (Deltas excessive)' };
        }

        // Rate limit: 1 update per 3 seconds
        const limiter = await checkRateLimit(`stats_${session.uuid}`, 1, 3);
        if (!limiter.success) {
            throw {
                status: 429,
                message: 'Hệ thống đang bận',
                nextAvailable: limiter.reset - Date.now()
            };
        }

        // Atomic update
        await query(`
            UPDATE users 
            SET xp = xp + @xp, 
                vipcoins = vipcoins + @coins,
                mission_data = CASE 
                    WHEN @missionData IS NOT NULL THEN @missionData
                    ELSE mission_data 
                END,
                last_stats_update = GETDATE()
            WHERE uuid = @uuid
        `, {
            xp: deltaXp,
            coins: deltaCoins,
            missionData: missionData ? JSON.stringify(missionData) : null,
            uuid: session.uuid
        });

        return { success: true };
    }
});
