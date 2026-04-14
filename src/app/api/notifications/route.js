import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const res = await query(`
            SELECT n.*, m.cover 
            FROM notifications n
            LEFT JOIN manga m ON n.manga_id = m.id
            WHERE n.user_uuid = @uuid
            ORDER BY n.created_at DESC
            LIMIT 20
        `, { uuid: session.uuid });

        return NextResponse.json(res.recordset || []);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id, all } = await req.json();

        if (all) {
            await query('UPDATE notifications SET is_read = TRUE WHERE user_uuid = @uuid', { uuid: session.uuid });
        } else if (id) {
            await query('UPDATE notifications SET is_read = TRUE WHERE id = @id AND user_uuid = @uuid', { id, uuid: session.uuid });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
