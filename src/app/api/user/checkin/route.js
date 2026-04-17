import { query, withTransaction, checkRateLimit } from '@/HeThong/Database/CoSoDuLieu';
import { withTitan } from '@/HeThong/API/XuLyAPI';
import { NextResponse } from 'next/server';

/**
 * TITAN REWARD SYSTEM: Daily Check-in API
 * Logic: 10 coins base reward + 100 coins bonus on 7-day streak milestone.
 */
export const POST = withTitan({
    auth: true,
    handler: async (request, session) => {
        const userUuid = session.uuid;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // TITAN RATE LIMIT: Prevent rapid clicking / duplicate trigger bypass attempts
        const limiter = await checkRateLimit(`checkin_${userUuid}`, 1, 10); // 1 request / 10s
        if (!limiter.success) {
            throw { status: 429, message: 'Yêu cầu điểm danh quá nhanh. Vui lòng thử lại sau.' };
        }

            const result = await withTransaction(async (tx) => {
                // 1. Check if already checked in today
                const todayCheck = await query(
                    'SELECT id FROM dailycheckins WHERE user_uuid = @userUuid AND checkin_date = @today',
                    { userUuid, today },
                    tx
                );

                if (todayCheck.rowCount > 0) {
                    throw new Error('Bạn đã điểm danh hôm nay rồi.');
                }

                // 2. Check yesterday to calculate streak
                const yesterdayCheck = await query(
                    'SELECT streak FROM dailycheckins WHERE user_uuid = @userUuid AND checkin_date = @yesterday',
                    { userUuid, yesterday },
                    tx
                );

                let newStreak = 1;
                if (yesterdayCheck.rowCount > 0) {
                    newStreak = parseInt(yesterdayCheck.recordset[0].streak) + 1;
                }

                // 3. Calculate Reward
                let reward = 10;
                let message = `Äioƒm danh thành công! Nháº­n Ä‘ưo£c ${reward} xu. Chuo—i: ${newStreak} ngà y.`;
                
                if (newStreak % 7 === 0) {
                    const bonus = 100;
                    reward += bonus;
                    message = `Tuyệt voi! Bạn đã điểm danh liên tiếp 7 ngà y. Nhận thưởng ${reward} xu!`;
                }

                // 4. Record Check-in
                await query(
                    'INSERT INTO dailycheckins (user_uuid, checkin_date, streak) VALUES (@userUuid, @today, @newStreak)',
                    { userUuid, today, newStreak },
                    tx
                );

                // 5. Grant Reward
                await query(
                    'UPDATE users SET vipcoins = vipcoins + @reward, xp = xp + 5 WHERE uuid = @userUuid',
                    { reward, userUuid },
                    tx
                );

                return { reward, streak: newStreak, message };
            });

            return { 
                success: true, 
                message: result.message,
                reward: result.reward,
                streak: result.streak
            };

    }
});

export const GET = withTitan({
    auth: true,
    handler: async (request, session) => {
        const today = new Date().toISOString().split('T')[0];
        const res = await query(`
            SELECT streak, 
                   (SELECT COUNT(*) FROM dailycheckins WHERE user_uuid = @uuid AND checkin_date = @today) as done_today
            FROM dailycheckins 
            WHERE user_uuid = @uuid 
            ORDER BY checkin_date DESC 
            LIMIT 1
        `, { uuid: session.uuid, today });

        const stats = res.recordset[0] || { streak: 0, done_today: 0 };
        return {
            streak: stats.streak,
            doneToday: stats.done_today > 0
        };
    }
});

