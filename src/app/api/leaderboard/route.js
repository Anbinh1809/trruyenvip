import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
    try {
        const result = await query(`
            SELECT TOP 50 stats.title as rank, id, username, level, xp, avatar, contribution_points, badge_ids
            FROM (SELECT id, username, level, xp, avatar, contribution_points, badge_ids FROM Users) as u
            CROSS APPLY (SELECT * FROM dbo.calculateRank(u.level)) as stats
            ORDER BY u.level DESC, u.xp DESC
        `);

        return NextResponse.json(result.recordset);
    } catch (e) {
        console.error('Leaderboard API Error:', e);
        return NextResponse.json({ error: 'Không thể tải bảng xếp hạng' }, { status: 500 });
    }
}
