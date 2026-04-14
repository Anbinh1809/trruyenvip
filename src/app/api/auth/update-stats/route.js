import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
        }

        // 1. Robust Parsing for Beacon/Keepalive (handles missing Content-Type)
        let body;
        try {
            body = await request.json();
        } catch (e) {
            // Fallback for beacon payloads which might be sent as text/plain strings
            const text = await request.text();
            try {
                body = JSON.parse(text);
            } catch (inner) {
                return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
            }
        }

        const { xpDelta, coinDelta } = body;
        const deltaXp = parseInt(xpDelta || 0);
        const deltaCoins = parseInt(coinDelta || 0);

        // 2. Return early if no changes
        if (deltaXp === 0 && deltaCoins === 0) {
            return NextResponse.json({ success: true });
        }

        // 3. Sanity Check: Prevent massive injections (Hardened for Production)
        if (Math.abs(deltaXp) > 2000 || Math.abs(deltaCoins) > 10000) {
            return NextResponse.json({ error: 'Dữ liệu bất thường (Deltas excessive)' }, { status: 400 });
        }

        // 4. High-Frequency Check (Rate Limiting)
        const userRes = await query(`SELECT last_stats_update FROM users WHERE uuid = @uuid`, { uuid: session.uuid });
        const lastUpdate = userRes.recordset[0]?.last_stats_update;
        const now = new Date();

        if (lastUpdate && (now - new Date(lastUpdate)) < 3000) { // Slight reduction to 3s for better UX
            return NextResponse.json({ 
              error: 'Hệ thống đang bận',
              nextAvailable: 3000 - (now - new Date(lastUpdate))
            }, { status: 429 });
        }

        // 5. Apply Update (ATOMIC RECONCILIATION)
        await query(`
            UPDATE users 
            SET xp = xp + @xp, 
                vipcoins = vipcoins + @coins,
                last_stats_update = NOW()
            WHERE uuid = @uuid
        `, {
            xp: deltaXp,
            coins: deltaCoins,
            uuid: session.uuid
        });

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('Update stats error', e);
        return NextResponse.json({ error: 'Lỗi đồng bộ dữ liệu' }, { status: 500 });
    }
}
