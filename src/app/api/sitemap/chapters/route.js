import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.headers.get('host') || 'truyenvip.com';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;

  try {
    const chapRes = await query(`
      SELECT id, manga_id, updated_at 
      FROM chapters 
      ORDER BY updated_at DESC
      LIMIT 10000
    `);

    const chapters = chapRes.recordset || [];
    const chapterEntries = chapters.map(c => `
  <url>
    <loc>${origin}/manga/${c.manga_id}/chapter/${c.id}</loc>
    <lastmod>${new Date(c.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${chapterEntries}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error('Chapters sitemap generation failed:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
