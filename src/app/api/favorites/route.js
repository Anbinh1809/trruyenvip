import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const results = await query(`
            SELECT m.id, m.title, m.cover,
                   (SELECT MAX(chapter_number) FROM Chapters WHERE manga_id = m.id) as latest_chapter_number
            FROM Favorites f
            JOIN Manga m ON f.manga_id = m.id
            WHERE f.user_uuid = @uuid
            ORDER BY f.created_at DESC
        `, { uuid: session.uuid });

        return NextResponse.json(results.recordset);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { mangaId } = await req.json();
        
        // Toggle logic
        const exists = await query(`
            SELECT id FROM Favorites 
            WHERE user_uuid = @uuid 
            AND manga_id = @mangaId
        `, { uuid: session.uuid, mangaId });

        if (exists.recordset.length > 0) {
            await query(`
                DELETE FROM Favorites 
                WHERE user_uuid = @uuid 
                AND manga_id = @mangaId
            `, { uuid: session.uuid, mangaId });
            return NextResponse.json({ message: 'Removed', status: 'removed' });
        } else {
            await query(`
                INSERT INTO Favorites (user_uuid, manga_id) 
                VALUES (@uuid, @mangaId)
            `, { uuid: session.uuid, mangaId });
            return NextResponse.json({ message: 'Added', status: 'added' });
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
