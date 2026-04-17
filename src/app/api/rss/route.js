import { query } from '@/HeThong/Database/CoSoDuLieu';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const result = await query(`
            SELECT 
                c.id as chapter_id,
                c.title as chapter_title,
                c.chapter_number,
                c.updated_at,
                m.id as manga_id,
                m.title as manga_title,
                m.cover as manga_cover,
                m.description as manga_description
            FROM chapters c
            JOIN manga m ON c.manga_id = m.id
            ORDER BY c.updated_at DESC
            LIMIT 50
        `);

        const chapters = result.recordset || [];
        const host = request.headers.get('host') || 'truyenvip.com';
        const protocol = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
        const origin = `${protocol}://${host}`;

        const rssItems = chapters.map(chap => {
            const chapUrl = `${origin}/manga/${chap.manga_id}/chapter/${chap.chapter_id}`;
            const coverUrl = (chap.manga_cover && chap.manga_cover.startsWith('http')) 
                ? `${origin}/api/proxy?url=${encodeURIComponent(chap.manga_cover)}` 
                : `${origin}${chap.manga_cover || '/placeholder-manga.svg'}`;
            
            return `
                <item>
                    <title><![CDATA[${chap.manga_title} - ${chap.chapter_title}]]></title>
                    <link>${chapUrl}</link>
                    <guid isPermaLink="false">${chap.chapter_id}</guid>
                    <pubDate>${new Date(chap.updated_at).toUTCString()}</pubDate>
                    <description><![CDATA[
                        <img src="${coverUrl}" width="200" style="margin-bottom: 10px;" /><br/>
                        Chương mới nhất của bộ truyện ${chap.manga_title} đã được cập nhật trên TruyenVip.
                    ]]></description>
                </item>
            `;
        }).join('');

        const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2001/Atom">
<channel>
    <title>TruyenVip - Mới Cập Nhật</title>
    <link>${origin}</link>
    <description>Non tảng Ä‘oc truyện tranh online cao cấp, cập nhật chưÆ¡ng mo›i nhanh nhất.</description>
    <language>vi</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${origin}/api/rss" rel="self" type="application/rss+xml" />
    ${rssItems}
</channel>
</rss>`.trim();

        return new Response(rssFeed, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600'
            }
        });

    } catch (e) {
        console.error('RSS Feed Error:', e);
        return new Response('<error>Lỗi hệ thống</error>', { 
            status: 500,
            headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        });
    }
}

