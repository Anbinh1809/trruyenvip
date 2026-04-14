import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
    try {
        const result = await query(`
            SELECT username, xp, vipcoins, avatar, role
            FROM users
            ORDER BY xp DESC
            LIMIT 100
        `);

        return NextResponse.json(result.recordset || []);
    } catch (e) {
        console.error('Leaderboard API Error:', e);
        return NextResponse.json({ error: 'Không thể tải bảng xếp hạng' }, { status: 500 });
    }
}
