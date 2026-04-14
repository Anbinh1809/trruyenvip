import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.headers.get('host') || 'truyenvip.com';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;

  try {
    // Fetch ALL manga for total indexing
    const mangaRes = await query(`
      SELECT id, last_crawled 
      FROM manga 
      ORDER BY last_crawled DESC
    `);

    const manga = mangaRes.recordset || [];
    const mangaEntries = manga.map(m => `
  <url>
    <loc>${origin}/manga/${m.id}</loc>
    <lastmod>${new Date(m.last_crawled || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${mangaEntries}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error('Manga sitemap generation failed:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
