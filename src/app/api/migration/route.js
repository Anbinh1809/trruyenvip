import { query, checkRateLimit } from '@/lib/db';
import { queueMangaSync, queueChapterScrape } from '@/lib/crawler/engine';
import { parseChapterNumber } from '@/lib/crawler/utils';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

        // TITAN RATE LIMIT: Prevent migration abuse
        const limiter = await checkRateLimit(`migration_${session.uuid}`, 5, 60);
        if (!limiter.success) {
            return NextResponse.json({ 
                error: 'Bạn đang thực hiện quá nhiều yêu cầu dịch chuyển. Vui lòng đợi trong giây lát.' 
            }, { status: 429 });
        }

        const source = url.includes('nettruyen') ? 'nettruyen' : (url.includes('truyenqq') ? 'truyenqq' : null);
        if (!source) return NextResponse.json({ error: 'Nguồn không hỗ trợ' }, { status: 400 });

        // Robust Parsing Logic
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
        const mangaCheck = await query('SELECT id FROM manga WHERE id = @id', { id: mangaSlug });
        if (mangaCheck.recordset.length === 0) {
            const rawTitle = mangaSlug.replace(/-/g, ' ');
            const capitalizeTitle = rawTitle.replace(/\b\w/g, l => l.toUpperCase());
            await query('INSERT INTO manga (id, title, source_url) VALUES (@id, @title, @url) ON CONFLICT DO NOTHING', 
                { id: mangaSlug, title: capitalizeTitle, url: url.split('/chap-')[0] });
        }

        // 2. Identify and Queue Sync
        queueMangaSync(mangaSlug, url.split('/chap-')[0], source, true, 8);

        let chapterId = null;
        if (chapterSlug) {
            chapterId = `${mangaSlug}_${chapterSlug}`;
            const chapCheck = await query('SELECT id FROM chapters WHERE id = @id', { id: chapterId });
            if (chapCheck.recordset.length === 0) {
                await query('INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) VALUES (@id, @mId, @title, @url, @num) ON CONFLICT DO NOTHING',
                    { id: chapterId, mId: mangaSlug, title: chapterSlug.replace(/-/g, ' '), url, num: parseChapterNumber(chapterSlug) });
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
