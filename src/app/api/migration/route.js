import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { crawlFullMangaChapters } from '@/lib/crawler';

export async function POST(req) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

        // --- VALIDATION: SYNTAX CHECK ---
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (e) {
            return NextResponse.json({ error: 'Định dạng URL không hợp lệ' }, { status: 400 });
        }

        // --- SECURITY: SSRF PROTECTION (Strict Hostname Whitelisting) ---
        const allowedHosts = [
            'nettruyenme.com', 'www.nettruyenme.com',
            'nettruyenon.com', 'www.nettruyenon.com',
            'nettruyennew.com', 'www.nettruyennew.com',
            'truyenqqno.com', 'www.truyenqqno.com',
            'truyenqqvip.com', 'www.truyenqqvip.com',
            'truyenqq.com', 'www.truyenqq.com',
            'nettruyen.me', 'www.nettruyen.me'
        ];

        const host = parsedUrl.hostname.toLowerCase();
        const isWhitelisted = allowedHosts.includes(host) || allowedHosts.some(h => host.endsWith('.' + h));

        if (!isWhitelisted) {
            return NextResponse.json({ error: 'Tên miền không được hỗ trợ hoặc không an toàn' }, { status: 403 });
        }

        console.log(`[Migration] Attempting to parse: ${url}`);

        let mangaId = null;
        let chapterSlug = null;
        let source = null;

        // 1. Unified Parsing Logic
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

        if (url.includes('nettruyen')) {
            source = 'nettruyen';
            // NetTruyen Manga URL: /truyen-tranh/manga-slug
            // NetTruyen Chapter URL: /truyen-tranh/manga-slug/chap-123/123456
            const truyenTranhIdx = pathSegments.indexOf('truyen-tranh');
            if (truyenTranhIdx !== -1 && pathSegments[truyenTranhIdx + 1]) {
                mangaId = pathSegments[truyenTranhIdx + 1];
                if (pathSegments[truyenTranhIdx + 2] && pathSegments[truyenTranhIdx + 2].startsWith('chap-')) {
                    chapterSlug = pathSegments[truyenTranhIdx + 2];
                }
            }
        } else if (url.includes('truyenqq')) {
            source = 'truyenqq';
            // TruyenQQ Manga URL: /truyen/manga-slug.html
            // TruyenQQ Chapter URL: /truyen/manga-slug/chap-123.html
            const truyenIdx = pathSegments.indexOf('truyen');
            if (truyenIdx !== -1 && pathSegments[truyenIdx + 1]) {
                mangaId = pathSegments[truyenIdx + 1].replace('.html', '');
                if (pathSegments[truyenIdx + 2]) {
                    chapterSlug = pathSegments[truyenIdx + 2].replace('.html', '');
                } else if (pathSegments[truyenIdx + 1].includes('chap-')) {
                    // Fallback for direct chapter links if they differ
                    chapterSlug = pathSegments[truyenIdx + 1].replace('.html', '');
                }
            }
        }

        if (!mangaId) {
            return NextResponse.json({ error: 'Unsupported URL format' }, { status: 400 });
        }

        // 2. Lookup or Initialize Manga (Hardened lookup with Postgres-native concatenation)
        let manga = await query(`
            SELECT id FROM Manga 
            WHERE id = @mangaId 
            OR source_url = @url
            OR source_url LIKE '%/' || @mangaId
            OR source_url LIKE '%/' || @mangaId || '.html'
        `, { mangaId, url });
        
        if (manga.recordset.length === 0) {
            console.log(`[Migration] New manga detected: ${mangaId}. Queueing background sync...`);
            
            let detailUrl = parsedUrl.origin;
            if (source === 'nettruyen') {
                detailUrl += `/truyen-tranh/${mangaId}`;
            } else if (source === 'truyenqq') {
                detailUrl += `/truyen/${mangaId}.html`;
            }
            
            // TITAN BACKFILL: Add to queue instead of awaiting, preventing 504 timeouts
            await queueMangaSync(mangaId, detailUrl, source, false, 8); // Priority 8 (User-triggered)
        }


        // 3. Match Chapter
        const internalChapterId = chapterSlug ? `${mangaId}_${chapterSlug}` : null;
        let redirectUrl = `/manga/${mangaId}`;

        if (internalChapterId) {
            const chap = await query("SELECT id FROM Chapters WHERE id = @chapId", { chapId: internalChapterId });
            if (chap.recordset.length > 0) {
                redirectUrl = `/manga/${mangaId}/chapter/${internalChapterId}`;
            }
        }

        return NextResponse.json({ 
            success: true, 
            redirectUrl,
            mangaId,
            chapterId: internalChapterId
        });

    } catch (err) {
        console.error('Migration error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
