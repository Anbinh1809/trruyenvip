import { query, checkRateLimit } from '@/core/database/connection';
import { getSession } from '@/core/security/auth';
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

        const { xpDelta, coinDelta, missionData } = body;
        const deltaXp = parseInt(xpDelta || 0);
        const deltaCoins = parseInt(coinDelta || 0);

        // 2. Return early if no changes
        if (deltaXp === 0 && deltaCoins === 0 && !missionData) {
            return NextResponse.json({ success: true });
        }

        // TITAN-GRADE SANITY CHECK: Max 500 XP and 100 Coins per heart-beat (3s)
        if (deltaXp > 500 || deltaCoins > 100) {
            return NextResponse.json({ error: 'Dữ liệu bất thường (Deltas excessive)' }, { status: 400 });
        }

        // 4. TITAN RATE LIMIT: Unify with core system infrastructure
        const limiter = await checkRateLimit(`stats_${session.uuid}`, 1, 3); // 1 update / 3s
        if (!limiter.success) {
            return NextResponse.json({ 
              error: 'Hệ thống đang bận',
              nextAvailable: limiter.reset - Date.now()
            }, { status: 429 });
        }

        // 5. Apply Update (ATOMIC RECONCILIATION)
        await query(`
            UPDATE users 
            SET xp = xp + @xp, 
                vipcoins = vipcoins + @coins,
                mission_data = CASE 
                    WHEN @missionData IS NOT NULL THEN @missionData::jsonb
                    ELSE mission_data 
                END,
                last_stats_update = NOW()
            WHERE uuid = @uuid
        `, {
            xp: deltaXp,
            coins: deltaCoins,
            missionData: missionData ? JSON.stringify(missionData) : null,
            uuid: session.uuid
        });

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error('[TITAN ERROR] Update stats failed:', e.message);
        return NextResponse.json({ error: 'Lỗi đồng bộ dữ liệu' }, { status: 500 });
    }
}
