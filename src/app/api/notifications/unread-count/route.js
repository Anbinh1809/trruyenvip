import { query } from '@/core/database/connection';
import { getSession } from '@/core/security/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ count: 0 });

        const res = await query(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_uuid = @uuid AND is_read = FALSE
        `, { uuid: session.uuid });

        return NextResponse.json({ count: Number(res.recordset?.[0]?.count || 0) });
    } catch (e) {
        return NextResponse.json({ count: 0 });
    }
}


