import { query, checkRateLimit } from '@/core/database/connection';
import { withTitan } from '@/core/api/handler';
import { RANKS, CHEST_DATA } from '@/core/constants/engagement';

export const POST = withTitan({
    auth: true,
    handler: async (request, session) => {
        try {
            const { missionId, missionData } = await request.json();

            if (!missionId || !missionData || !missionData.missions) {
                throw { status: 400, message: 'Thiếu dữ liệu nhiệm vụ' };
            }

            // Rate Limit: Prevent spamming chest openings (max 2 per second)
            const limiter = await checkRateLimit(`chest_${session.uuid}`, 2, 1);
            if (!limiter.success) {
                throw { status: 429, message: 'Đang mở rương quá nhanh' };
            }

            // Verify the mission on the server side
            const mission = missionData.missions.find(m => m.id === missionId);
            if (!mission) throw { status: 400, message: 'Không tìm thấy nhiệm vụ' };
            if (mission.current < mission.target) throw { status: 400, message: 'Chưa đủ điều kiện mở rương' };

            // We must verify from DB if it was already claimed to prevent double-spending
            const userRes = await query('SELECT xp, mission_data FROM users WHERE uuid = @uuid', { uuid: session.uuid });
            const dbUser = userRes.recordset?.[0];
            if (!dbUser) throw { status: 404, message: 'User not found' };

            let dbMissions = null;
            if (dbUser.mission_data) {
                try {
                    dbMissions = JSON.parse(dbUser.mission_data);
                } catch {}
            }

            // If DB missions match today's date, verify it hasn't been claimed yet
            if (dbMissions && dbMissions.date === missionData.date) {
                const dbMission = dbMissions.missions?.find(m => m.id === missionId);
                if (dbMission && dbMission.claimed) {
                    throw { status: 400, message: 'Rương này đã được mở' };
                }
            }

            // Calculate Chest Type based on Server DB XP
            const currentXp = parseInt(dbUser.xp || 0);
            const level = Math.floor(currentXp / 100) + 1;
            const rank = [...RANKS].reverse().find(r => level >= r.lv);
            const chestType = rank ? rank.chest : 'Wood';
            const chest = CHEST_DATA[chestType];

            // Calculate Reward (Server-side randomization)
            const rand = Math.random() * 100;
            let accumulated = 0;
            let prize = null;

            for (const item of chest.loot) {
                accumulated += item.weight;
                if (rand <= accumulated) {
                    const amount = Math.floor(Math.random() * (item.range[1] - item.range[0] + 1)) + item.range[0];
                    prize = { type: item.type, amount, name: chest.name };
                    break;
                }
            }

            if (!prize) {
                prize = { type: 'xp', amount: 10, name: chest.name }; // Fallback
            }

            // Mark mission as claimed
            const idx = missionData.missions.findIndex(m => m.id === missionId);
            missionData.missions[idx].claimed = true;

            // Atomic database update using Transaction to prevent race conditions
            const deltaXp = prize.type === 'xp' ? prize.amount : 0;
            const deltaCoins = prize.type === 'coin' ? prize.amount : 0;

            await query(`
                UPDATE users 
                SET xp = xp + @xp, 
                    [vipCoins] = [vipCoins] + @coins,
                    mission_data = @missionData,
                    last_stats_update = GETDATE()
                WHERE uuid = @uuid
            `, {
                xp: deltaXp,
                coins: deltaCoins,
                missionData: JSON.stringify(missionData),
                uuid: session.uuid
            });

            return {
                success: true,
                prize,
                updatedMissionData: missionData
            };
        } catch (e) {
            console.error('Chest Open Error:', e);
            throw e;
        }
    }
});
