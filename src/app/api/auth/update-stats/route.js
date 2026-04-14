import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }

        const { xpDelta, coinDelta } = await request.json();
        const deltaXp = parseInt(xpDelta || 0);
        const deltaCoin = parseInt(coinDelta || 0);

        // 1. Return early if no changes
        if (deltaXp === 0 && deltaCoin === 0) {
            return NextResponse.json({ success: true });
        }

        // 2. Sanity Check: Prevent massive injections
        if (Math.abs(deltaXp) > 1000 || Math.abs(deltaCoin) > 2000) {
            return NextResponse.json({ error: 'Dữ liệu bất thường' }, { status: 400 });
        }

        // 2. High-Frequency Check (Rate Limiting)
        const userRes = await query(`SELECT last_stats_update FROM "Users" WHERE uuid = @uuid`, { uuid: session.uuid });
        const lastUpdate = userRes.recordset[0]?.last_stats_update;
        const now = new Date();

        if (lastUpdate && (now - new Date(lastUpdate)) < 5000) { // Strict 5s cooldown
            const waitTime = Math.ceil((5000 - (now - new Date(lastUpdate))) / 1000);
            return NextResponse.json({ 
              error: `Hệ thống đang bận, vui lòng đợi thêm ${waitTime} giây để cập nhật lại.`,
              nextAvailable: 5000 - (now - new Date(lastUpdate))
            }, { status: 429 });
        }


        // 3. Apply Update
        await query(`
            UPDATE "Users" 
            SET xp = xp + @xp, 
                "vipCoins" = "vipCoins" + @coins,
                last_stats_update = NOW()
            WHERE uuid = @uuid
        `, {
            xp: parseInt(xpDelta || 0),
            coins: parseInt(coinDelta || 0),
            uuid: session.uuid
        });

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('Update stats error', e);
        return NextResponse.json({ error: 'Lỗi đồng bộ dữ liệu' }, { status: 500 });
    }
}
