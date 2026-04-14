import { crawlFullMangaChapters } from '@/lib/crawler';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { mangaId } = await req.json();
        if (!mangaId) return NextResponse.json({ error: 'Missing mangaId' }, { status: 400 });

        const mangaData = await query('SELECT source_url FROM manga WHERE id = @id', { id: mangaId });
        if (!mangaData.recordset?.[0]) {
            return NextResponse.json({ error: 'Manga not found' }, { status: 404 });
        }

        const manga = mangaData.recordset[0];
        const source = manga.source_url.includes('nettruyen') ? 'nettruyen' : 'truyenqq';

        // Trigger deep crawl
        console.log(`[REPAIR-GAP] Starting deep repair for ${mangaId} initiated by ${session.username}`);
        crawlFullMangaChapters(mangaId, manga.source_url, source).catch(e => {
            console.error(`[REPAIR-GAP] Error for ${mangaId}:`, e.message);
        });

        return NextResponse.json({ success: true, message: 'Repair cycle started in background.' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
