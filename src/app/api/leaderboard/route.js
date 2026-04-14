import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
    try {
        const result = await query(`
            SELECT id, username, xp, vipcoins, avatar
            FROM users
            ORDER BY xp DESC
            LIMIT 50
        `);

        // Compute rank tier from XP
        const usersWithRank = (result.recordset || []).map((u, index) => {
            let rankStr = 'Thành viên mới';
            const xp = u.xp || 0;
            if (xp >= 10000) rankStr = 'Thành viên danh dự';
            else if (xp >= 5000) rankStr = 'Hội viên kim cương';
            else if (xp >= 2000) rankStr = 'Hội viên vàng';
            else if (xp >= 500) rankStr = 'Độc giả cao cấp';
            else if (xp >= 100) rankStr = 'Độc giả trung thành';
            
            return {
                ...u,
                rank: rankStr,
                position: index + 1,
            };
        });

        return NextResponse.json(usersWithRank);
    } catch (e) {
        console.error('Leaderboard API Error:', e);
        return NextResponse.json({ error: 'Không thể tải bảng xếp hạng' }, { status: 500 });
    }
}
