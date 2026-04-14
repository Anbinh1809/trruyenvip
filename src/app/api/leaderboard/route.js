import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
    try {
        const result = await query(`
            SELECT id, username, level, xp, avatar, contribution_points, badge_ids
            FROM "Users"
            ORDER BY level DESC, xp DESC
            LIMIT 50
        `);

        // Compute rank in JS instead of dbo.calculateRank
        const usersWithRank = (result.recordset || []).map(u => {
            let rankStr = 'Thành viên mới';
            if (u.level >= 100) rankStr = 'Thành viên danh dự';
            else if (u.level >= 75) rankStr = 'Hội viên kim cương';
            else if (u.level >= 50) rankStr = 'Hội viên vàng';
            else if (u.level >= 30) rankStr = 'Độc giả cao cấp';
            else if (u.level >= 10) rankStr = 'Độc giả trung thành';
            
            return {
                ...u,
                rank: rankStr
            };
        });

        return NextResponse.json(usersWithRank);
    } catch (e) {
        console.error('Leaderboard API Error:', e);
        return NextResponse.json({ error: 'Không thể tải bảng xếp hạng' }, { status: 500 });
    }
}
