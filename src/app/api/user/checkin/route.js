import { query, withTransaction, checkRateLimit } from '@/lib/db';
import { withTitan } from '@/lib/api-handler';
import { NextResponse } from 'next/server';

/**
 * TITAN REWARD SYSTEM: Daily Check-in API
 * Logic: 10 coins base reward + 100 coins bonus on 7-day streak milestone.
 */
export const POST = withTitan({
    authenticated: true,
    handler: async (request, session) => {
        const userUuid = session.uuid;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // TITAN RATE LIMIT: Prevent rapid clicking / duplicate trigger bypass attempts
        const limiter = await checkRateLimit(`checkin_${userUuid}`, 1, 10); // 1 request / 10s
        if (!limiter.success) {
            throw { status: 429, message: 'Yêu cầu điểm danh quá nhanh. Vui lòng thử lại sau.' };
        }

        try {
            const result = await withTransaction(async (tx) => {
                // 1. Check if already checked in today
                const todayCheck = await tx.query(
                    'SELECT id FROM dailycheckins WHERE user_uuid = $1 AND checkin_date = $2',
                    [userUuid, today]
                );

                if (todayCheck.rowCount > 0) {
                    throw new Error('Bạn đã điểm danh hôm nay rồi.');
                }

                // 2. Check yesterday to calculate streak
                const yesterdayCheck = await tx.query(
                    'SELECT streak FROM dailycheckins WHERE user_uuid = $1 AND checkin_date = $2',
                    [userUuid, yesterday]
                );

                let newStreak = 1;
                if (yesterdayCheck.rowCount > 0) {
                    newStreak = yesterdayCheck.rows[0].streak + 1;
                }

                // 3. Calculate Reward
                let reward = 10;
                let message = `Điểm danh thành công! Nhận được ${reward} xu. Chuỗi: ${newStreak} ngày.`;
                
                if (newStreak % 7 === 0) {
                    const bonus = 100;
                    reward += bonus;
                    message = `Tuyệt vời! Bạn đã điểm danh liên tiếp 7 ngày. Nhận thưởng ${reward} xu!`;
                }

                // 4. Record Check-in
                await tx.query(
                    'INSERT INTO dailycheckins (user_uuid, checkin_date, streak) VALUES ($1, $2, $3)',
                    [userUuid, today, newStreak]
                );

                // 5. Grant Reward
                await tx.query(
                    'UPDATE users SET vipcoins = vipcoins + $1, xp = xp + 5 WHERE uuid = $2',
                    [reward, userUuid]
                );

                return { reward, streak: newStreak, message };
            });

            return { 
                success: true, 
                message: result.message,
                reward: result.reward,
                streak: result.streak
            };

        } catch (innerErr) {
            throw { status: 400, message: innerErr.message };
        }
    }
});

export const GET = withTitan({
    authenticated: true,
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
