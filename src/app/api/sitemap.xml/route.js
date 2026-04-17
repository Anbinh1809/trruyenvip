import { query } from '@/HeThong/Database/CoSoDuLieu';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

export async function GET(request) {
    try {
        const host = request.headers.get('host') || 'truyenvip.com';
        const protocol = host.startsWith('localhost') ? 'http' : 'https';
        const origin = `${protocol}://${host}`;

        // POLARIS OPTIMIZATION: Fix case-sensitivity and add safety limit
        const mangaRes = await query("SELECT id, last_crawled FROM manga ORDER BY last_crawled DESC LIMIT 10000");
        const mangaList = mangaRes.recordset;

        // Fetch all genres
        const genreRes = await query("SELECT slug FROM genres ORDER BY slug ASC");
        const genreList = genreRes.recordset;

        const staticPages = [
            '',
            '/genres',
            '/history',
            '/rewards',
            '/leaderboard',
            '/auth/login',
            '/auth/register'
        ];

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static pages
        staticPages.forEach(page => {
            xml += `
  <url>
    <loc>${origin}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
        });

        // Add genres
        genreList.forEach(genre => {
            xml += `
  <url>
    <loc>${origin}/genres?type=${genre.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        // Add manga pages
        mangaList.forEach(manga => {
            const lastMod = manga.last_crawled ? new Date(manga.last_crawled).toISOString() : new Date().toISOString();
            xml += `
  <url>
    <loc>${origin}/manga/${manga.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        xml += `
</urlset>`;

        return new Response(xml.trim(), {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600'
            }
        });

    } catch (e) {
        console.error('Sitemap generation error:', e);
        return new Response('Error', { status: 500 });
    }
}

