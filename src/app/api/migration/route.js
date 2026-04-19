import { query, checkRateLimit } from '@/core/database/connection';
import { queueMangaSync, queueChapterScrape } from '@/core/crawler/engine';
import { parseChapterNumber } from '@/core/crawler/utils';
import { withTitan } from '@/core/api/handler';

export const POST = withTitan({
    auth: true,
    handler: async (req, session) => {
        try {
            const { url } = await req.json();
            if (!url) {
                throw { status: 400, message: 'Thiếu liên kết nguồn' };
            }

            // TITAN RATE LIMIT: Prevent migration abuse
            const limiter = await checkRateLimit(`migration_${session.uuid}`, 10, 60);
            if (!limiter.success) {
                throw {  
                    status: 429,
                    message: 'Bạn đang thực hiện quá nhiều yêu cầu dịch chuyển. Vui lòng đợi trong giây lát.' 
                };
            }

            const host = new URL(url).hostname.toLowerCase();
            const source = host.includes('nettruyen') ? 'nettruyen' : 
                           host.includes('truyenqq') ? 'truyenqq' : 
                           host.includes('blogtruyen') ? 'blogtruyen' : 
                           host.includes('cmanga') ? 'cmanga' : 
                           host.includes('nhattruyen') ? 'nhattruyen' : null;
                           
            if (!source) {
                throw { status: 400, message: 'Nguồn không hỗ trợ. Chúng tôi hiện hỗ trợ NetTruyen, TruyenQQ, BlogTruyen, CManga, NhatTruyen.' };
            }

            // Robust Parsing Logic
            const parts = url.split('/');
            let mangaSlug = '';
            let chapterSlug = '';

            if (source === 'nettruyen' || source === 'nhattruyen') {
                const mangaIdx = parts.indexOf('truyen-tranh');
                if (mangaIdx !== -1) {
                    mangaSlug = parts[mangaIdx + 1];
                    if (parts[mangaIdx + 2]?.startsWith('chap-')) {
                        chapterSlug = parts[mangaIdx + 2];
                    }
                }
            } else if (source === 'truyenqq') {
                const mangaIdx = parts.indexOf('truyen-tranh');
                if (mangaIdx !== -1) {
                    mangaSlug = parts[mangaIdx + 1]?.replace('.html', '');
                    if (parts[mangaIdx + 2]?.startsWith('chap-')) {
                        chapterSlug = parts[mangaIdx + 2]?.split('.')[0];
                    }
                }
            } else if (source === 'blogtruyen') {
                const idPart = parts.find(p => /^\d+$/.test(p));
                if (idPart) mangaSlug = `bt_${idPart}`;
            } else if (source === 'cmanga') {
                const mangaIdx = parts.indexOf('manga');
                if (mangaIdx !== -1) mangaSlug = parts[mangaIdx + 1];
            }

            if (!mangaSlug) {
                throw { status: 400, message: 'Không thể nhận diện mã truyện từ liên kết này.' };
            }

            // 1. Ensure Manga exists - Use Shell for immediate feedback
            const mangaCheck = await query('SELECT id FROM manga WHERE id = @id', { id: mangaSlug });
            if (mangaCheck.recordset.length === 0) {
                const rawTitle = mangaSlug.replace(/-/g, ' ');
                const capitalizeTitle = rawTitle.replace(/\b\w/g, l => l.toUpperCase());
                await query('INSERT INTO manga (id, title, source_url, status) VALUES (@id, @title, @url, @status) ON CONFLICT DO NOTHING', 
                    { id: mangaSlug, title: capitalizeTitle, url: url.split('/chap-')[0], status: 'Đang dịch chuyển...' });
            }

            // 2. Identify and Queue Sync
            const syncUrl = url.split('/chap-')[0];
            await queueMangaSync(mangaSlug, syncUrl, source, false, 10, true);

            let chapterId = null;
            if (chapterSlug) {
                chapterId = `${mangaSlug}_${chapterSlug}`;
                const chapCheck = await query('SELECT id FROM chapters WHERE id = @id', { id: chapterId });
                if (chapCheck.recordset.length === 0) {
                    await query('INSERT INTO chapters (id, manga_id, title, source_url, chapter_number) VALUES (@id, @mId, @title, @url, @num) ON CONFLICT DO NOTHING',
                        { id: chapterId, mId: mangaSlug, title: chapterSlug.replace(/-/g, ' '), url, num: parseChapterNumber(chapterSlug) });
                }
                await queueChapterScrape(chapterId, url, source, true, 10); // Ultra High priority
            }

            return {
                success: true,
                mangaId: mangaSlug,
                chapterId: chapterId,
                redirectUrl: chapterId ? `/manga/${mangaSlug}/chapter/${chapterId}` : `/manga/${mangaSlug}`
            };
        } catch (e) {
            console.error('[Migration:Error]', e);
            throw { status: e.status || 500, message: e.message || 'Lỗi hệ thống trong quá trình dịch chuyển.' };
        }
    }
});
