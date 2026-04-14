import { query } from '@/lib/db';
import { queueMangaSync, queueChapterScrape } from '@/lib/crawler/engine';
import { parseChapterNumber } from '@/lib/crawler/utils';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

        const source = url.includes('nettruyen') ? 'nettruyen' : (url.includes('truyenqq') ? 'truyenqq' : null);
        if (!source) return NextResponse.json({ error: 'Nguồn không hỗ trợ' }, { status: 400 });

        // Robust Parsing Logic
        // Example: https://www.nettruyennew.com/truyen-tranh/manga-slug/chap-123/789
        const parts = url.split('/');
        let mangaSlug = '';
        let chapterSlug = '';

        if (source === 'nettruyen') {
            const mangaIdx = parts.indexOf('truyen-tranh');
            if (mangaIdx !== -1) {
                mangaSlug = parts[mangaIdx + 1];
                if (parts[mangaIdx + 2]?.startsWith('chap-')) {
                    chapterSlug = parts[mangaIdx + 2];
                }
            }
        } else {
            // TruyenQQ
            const mangaIdx = parts.indexOf('truyen-tranh');
            if (mangaIdx !== -1) {
                mangaSlug = parts[mangaIdx + 1]?.replace('.html', '');
                if (parts[mangaIdx + 2]?.startsWith('chap-')) {
                    chapterSlug = parts[mangaIdx + 2]?.split('.')[0];
                }
            }
        }

        if (!mangaSlug) return NextResponse.json({ error: 'Không thể nhận diện mã truyện' }, { status: 400 });

        // 1. Ensure Manga exists
        const mangaCheck = await query('SELECT id FROM manga WHERE id = $1', [mangaSlug]);
        if (mangaCheck.rowCount === 0) {
            await query('INSERT INTO manga (id, title, source_url) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', 
                [mangaSlug, mangaSlug.replace(/-/g, ' '), url.split('/chap-')[0]]);
        }

        // 2. Identify and Queue Sync
        queueMangaSync(mangaSlug, url.split('/chap-')[0], source, true, 8);

        let chapterId = null;
        if (chapterSlug) {
            chapterId = `${mangaSlug}_${chapterSlug}`;
            const chapCheck = await query('SELECT id FROM chapters WHERE id = $1', [chapterId]);
            if (chapCheck.rowCount === 0) {
                await query('INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
                    [chapterId, mangaSlug, chapterSlug.replace(/-/g, ' '), url, parseChapterNumber(chapterSlug)]);
            }
            queueChapterScrape(chapterId, url, source, true, 10); // High priority
        }

        return NextResponse.json({
            success: true,
            mangaId: mangaSlug,
            chapterId: chapterId,
            redirectUrl: chapterId ? `/manga/${mangaSlug}/chapter/${chapterId}` : `/manga/${mangaSlug}`
        });

    } catch (err) {
        console.error('[Migration Error]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
